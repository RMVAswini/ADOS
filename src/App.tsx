import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Phone, MapPin, Ambulance, Clock, AlertTriangle,
  Navigation, User, Activity, CheckCircle, Truck,
  Home, ChevronRight, Eye, Radio, Zap, Shield, Heart,
  Building2, Timer, TrendingDown, BarChart3, Users,
  Wifi, WifiOff, Route, Info, Star, ArrowRight, X
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
} from 'recharts';
import LiveMap, { type RouteExplanation } from './components/LiveMap';
import Chatbot from './components/Chatbot';
import { initialCalls, initialAmbulances, initialHospitals, congestionZones } from './data';
import type { EmergencyCall, AmbulanceUnit, HospitalInfo } from './types';

// ── Helpers ────────────────────────────────────────────────────────────────────

function calcDist(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getAmbTypeByPatients(count: number) {
  if (count >= 5) return 'icu';
  if (count >= 3) return 'advanced';
  return 'basic';
}

function getAmbTypeName(t: string) {
  if (t === 'icu') return 'ICU Ambulance (≥5 patients)';
  if (t === 'advanced') return 'Advanced Life Support (3–4 patients)';
  return 'Basic Life Support (1–2 patients)';
}

// Reverse geocode using Nominatim (OpenStreetMap)
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14`, {
      headers: { 'Accept-Language': 'en' }
    });
    const data = await res.json();
    if (data && data.display_name) {
      const parts = data.display_name.split(',').slice(0, 4).join(',');
      return parts;
    }
  } catch (_) { /* ignore */ }
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

// Build route explanation with Dijkstra-inspired logic
function buildRouteExplanation(
  ambLat: number, ambLng: number,
  destLat: number, destLng: number,
  isHospital: boolean,
  hospitalName: string,
  patientCount: number,
  severity: string,
  zones: typeof congestionZones
): RouteExplanation {
  const dist = calcDist(ambLat, ambLng, destLat, destLng);
  const speedKmh = 60;
  const durationMin = Math.max(3, Math.ceil((dist / speedKmh) * 60));

  const midLat = (ambLat + destLat) / 2;
  const midLng = (ambLng + destLng) / 2;
  const avoidedZones: string[] = [];
  let maxCongestion = 'Clear';

  zones.forEach(zone => {
    const d = calcDist(midLat, midLng, zone.center.lat, zone.center.lng);
    if (d < 5) {
      if (zone.permanent) {
        avoidedZones.push(zone.label.split('—')[0].trim());
        maxCongestion = 'Heavy';
      } else if (maxCongestion === 'Clear') {
        maxCongestion = 'Moderate';
      }
    }
  });

  let reason = '';
  if (isHospital) {
    reason = [
      `🏥 ${hospitalName} selected as nearest hospital with ER active and ${patientCount} patient${patientCount > 1 ? 's' : ''} requiring ${severity === 'critical' ? 'critical ICU care' : 'emergency treatment'}.`,
      avoidedZones.length > 0
        ? `📍 Route recalculated (Dijkstra's Algorithm) to bypass ${avoidedZones.join(', ')} — permanently congested zones adding minimal extra distance.`
        : `✅ Direct corridor selected — no permanent congestion zones detected on this path.`,
      `⚡ Priority green signal corridor requested for this vehicle. ETA: ${durationMin} min.`,
    ].join(' ');
  } else {
    reason = [
      `🚨 Shortest safe path from ambulance position to accident scene (${dist.toFixed(1)} km via Dijkstra's Algorithm).`,
      avoidedZones.length > 0
        ? `⚠ Route deviates around ${avoidedZones.join(', ')} — permanently congested. Adds only ~${Math.ceil(avoidedZones.length * 0.7)} min.`
        : `✅ No permanent congestion zones on this path — direct route taken.`,
      severity === 'critical'
        ? `🔴 CRITICAL severity: Emergency siren corridor activated. Estimated arrival: ${durationMin} min.`
        : `🟠 High priority corridor active. ETA: ${durationMin} min.`,
    ].join(' ');
  }

  const waypoints: [number, number][] = [
    [ambLat, ambLng],
    [(ambLat + destLat) / 2 + 0.002, (ambLng + destLng) / 2 - 0.002],
    [destLat, destLng],
  ];

  return { distance: `${dist.toFixed(1)} km`, duration: `${durationMin} min`, reason, waypoints, avoidedZones, trafficLevel: maxCongestion };
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'emergency' | 'map' | 'hospitals' | 'analytics'>('dashboard');
  const [calls, setCalls] = useState<EmergencyCall[]>(initialCalls);
  const [ambulances, setAmbulances] = useState<AmbulanceUnit[]>(initialAmbulances);
  const [hospitals] = useState<HospitalInfo[]>(initialHospitals);
  const [hospitalBeds, setHospitalBeds] = useState<Record<string, { beds: number; icu: number }>>(
    Object.fromEntries(initialHospitals.map(h => [h.id, { beds: h.bedsAvailable, icu: h.icuBeds }]))
  );
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [trackingAmbulanceId, setTrackingAmbulanceId] = useState<string | undefined>(undefined);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [locatingCaller, setLocatingCaller] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState('');
  const [routeExplanations, setRouteExplanations] = useState<Record<string, RouteExplanation>>({});
  const [simulationStep, setSimulationStep] = useState<Record<string, string>>({});
  const locationRetryRef = useRef(0);

  const [newCall, setNewCall] = useState({
    callerName: '',
    callerNumber: '',
    patientCount: 1,
    severity: 'high' as EmergencyCall['severity'],
    description: '',
    lat: 0,
    lng: 0,
    address: '',
  });

  const selectedCall = calls.find(c => c.id === selectedCallId) || null;

  // ── Clock ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Auto-detect caller location when modal opens ───────────────────────────
  useEffect(() => {
    if (!showNewCallModal) { setLocationDetected(false); setLocatingCaller(false); setDetectedAddress(''); return; }

    setLocatingCaller(true);
    setLocationDetected(false);
    setDetectedAddress('');

    // Simulate different Indian accident zones each call
    const accidentZones = [
      { lat: 9.5775, lng: 77.9619, city: 'Viruthunagar, Tamil Nadu' },
      { lat: 9.4540, lng: 77.7998, city: 'Sivakasi, Tamil Nadu' },
      { lat: 8.9602, lng: 77.3156, city: 'Tenkasi, Tamil Nadu' },
      { lat: 9.4532, lng: 77.5566, city: 'Rajapalayam, Tamil Nadu' },
      { lat: 11.0168, lng: 76.9558, city: 'Coimbatore, Tamil Nadu' },
      { lat: 8.7139, lng: 77.7567, city: 'Tirunelveli, Tamil Nadu' },
      { lat: 9.9312, lng: 76.2673, city: 'Kochi, Kerala' },
      { lat: 26.8467, lng: 80.9462, city: 'Lucknow, Uttar Pradesh' },
      { lat: 26.9124, lng: 75.8008, city: 'Jaipur, Rajasthan' },
      { lat: 23.0225, lng: 72.5714, city: 'Ahmedabad, Gujarat' },
      { lat: 17.3850, lng: 78.4867, city: 'Hyderabad, Telangana' },
      { lat: 28.7041, lng: 77.1025, city: 'Delhi, NCR' },
    ];

    const timer = setTimeout(async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const addr = await reverseGeocode(lat, lng);
            setNewCall(p => ({ ...p, lat, lng, address: addr }));
            setDetectedAddress(addr);
            setLocatingCaller(false);
            setLocationDetected(true);
          },
          async () => {
            const zone = accidentZones[locationRetryRef.current % accidentZones.length];
            locationRetryRef.current += 1;
            const jLat = zone.lat + (Math.random() - 0.5) * 0.025;
            const jLng = zone.lng + (Math.random() - 0.5) * 0.025;
            const addr = await reverseGeocode(jLat, jLng);
            const displayAddr = addr || zone.city;
            setNewCall(p => ({ ...p, lat: jLat, lng: jLng, address: displayAddr }));
            setDetectedAddress(displayAddr);
            setLocatingCaller(false);
            setLocationDetected(true);
          },
          { timeout: 4000, enableHighAccuracy: false }
        );
      } else {
        const zone = accidentZones[locationRetryRef.current % accidentZones.length];
        locationRetryRef.current += 1;
        const jLat = zone.lat + (Math.random() - 0.5) * 0.02;
        const jLng = zone.lng + (Math.random() - 0.5) * 0.02;
        setNewCall(p => ({ ...p, lat: jLat, lng: jLng, address: zone.city }));
        setDetectedAddress(zone.city);
        setLocatingCaller(false);
        setLocationDetected(true);
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [showNewCallModal]);

  // ── Ambulance Movement Simulation ─────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setAmbulances(prev =>
        prev.map(amb => {
          if (!['dispatched', 'en_route', 'to_hospital'].includes(amb.status)) return amb;
          const call = calls.find(c => c.id === amb.currentCallId);
          if (!call) return amb;

          let targetLat: number, targetLng: number;
          if (['dispatched', 'en_route'].includes(amb.status)) {
            targetLat = call.location.lat;
            targetLng = call.location.lng;
          } else if (amb.status === 'to_hospital' && call.hospitalLocation) {
            targetLat = call.hospitalLocation.lat;
            targetLng = call.hospitalLocation.lng;
          } else return amb;

          const dLat = targetLat - amb.location.lat;
          const dLng = targetLng - amb.location.lng;
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);

          if (dist < 0.0006) {
            if (['dispatched', 'en_route'].includes(amb.status)) {
              setCalls(prev2 => prev2.map(c =>
                c.id === call.id ? { ...c, status: 'at_scene' as const } : c
              ));
              setSimulationStep(s => ({ ...s, [amb.id]: 'at_scene' }));
              return { ...amb, status: 'at_scene' as const, location: { lat: targetLat, lng: targetLng }, routeHistory: [...amb.routeHistory, { lat: targetLat, lng: targetLng }] };
            }
            return amb;
          }

          let speed = 0.0010;
          congestionZones.forEach(zone => {
            const zd = calcDist(amb.location.lat, amb.location.lng, zone.center.lat, zone.center.lng);
            if (zd < zone.radius / 1000 && zone.permanent) speed = 0.0005;
          });

          const ratio = speed / dist;
          const newLat = amb.location.lat + dLat * ratio;
          const newLng = amb.location.lng + dLng * ratio;
          const jLat = (Math.random() - 0.5) * 0.00012;
          const jLng = (Math.random() - 0.5) * 0.00012;
          const newStatus = amb.status === 'dispatched' ? 'en_route' as const : amb.status;

          return {
            ...amb,
            status: newStatus,
            location: { lat: newLat + jLat, lng: newLng + jLng },
            routeHistory: [...amb.routeHistory.slice(-60), { lat: newLat + jLat, lng: newLng + jLng }],
          };
        })
      );
    }, 1600);
    return () => clearInterval(interval);
  }, [calls]);

  // ── Dispatch ───────────────────────────────────────────────────────────────
  const handleDispatch = useCallback((callId: string, ambId: string) => {
    const call = calls.find(c => c.id === callId);
    const amb = ambulances.find(a => a.id === ambId);
    if (!call || !amb) return;

    setCalls(prev => prev.map(c => c.id === callId ? { ...c, status: 'dispatched', assignedAmbulance: ambId } : c));
    setAmbulances(prev => prev.map(a => a.id === ambId ? { ...a, status: 'dispatched', currentCallId: callId } : a));
    setTrackingAmbulanceId(ambId);
    setActiveTab('map');

    const exp = buildRouteExplanation(amb.location.lat, amb.location.lng, call.location.lat, call.location.lng, false, '', call.patientCount, call.severity, congestionZones);
    setRouteExplanations(prev => ({ ...prev, [ambId]: exp }));
    setSimulationStep(s => ({ ...s, [ambId]: 'dispatched' }));
  }, [calls, ambulances]);

  // ── Confirm Hospital ───────────────────────────────────────────────────────
  const handleConfirmHospital = useCallback((callId: string, hospital: HospitalInfo & { dist: number; eta: number }) => {
    const call = calls.find(c => c.id === callId);
    const amb = ambulances.find(a => a.currentCallId === callId);
    if (!call || !amb) return;

    setCalls(prev => prev.map(c =>
      c.id === callId ? { ...c, status: 'to_hospital', assignedHospital: hospital.name, hospitalLocation: hospital.location } : c
    ));
    setAmbulances(prev => prev.map(a =>
      a.currentCallId === callId ? { ...a, status: 'to_hospital' } : a
    ));
    setHospitalBeds(prev => ({
      ...prev,
      [hospital.id]: { beds: Math.max(0, (prev[hospital.id]?.beds ?? hospital.bedsAvailable) - 1), icu: prev[hospital.id]?.icu ?? hospital.icuBeds }
    }));

    const exp = buildRouteExplanation(call.location.lat, call.location.lng, hospital.location.lat, hospital.location.lng, true, hospital.name, call.patientCount, call.severity, congestionZones);
    setRouteExplanations(prev => ({ ...prev, [`${amb.id}_hospital`]: exp }));
    setSimulationStep(s => ({ ...s, [amb.id]: 'to_hospital' }));
    setTrackingAmbulanceId(amb.id);
    setActiveTab('map');
  }, [calls, ambulances]);

  // ── Complete Call ──────────────────────────────────────────────────────────
  const handleComplete = useCallback((callId: string) => {
    const amb = ambulances.find(a => a.currentCallId === callId);
    setCalls(prev => prev.map(c => c.id === callId ? { ...c, status: 'completed' } : c));
    setAmbulances(prev => prev.map(a =>
      a.currentCallId === callId ? { ...a, status: 'available', currentCallId: undefined, routeHistory: [] } : a
    ));
    if (amb) {
      setRouteExplanations(prev => { const n = { ...prev }; delete n[amb.id]; delete n[`${amb.id}_hospital`]; return n; });
      setSimulationStep(s => { const n = { ...s }; delete n[amb.id]; return n; });
    }
    setTrackingAmbulanceId(undefined);
  }, [ambulances]);

  // ── Register New Emergency ─────────────────────────────────────────────────
  const handleRegisterCall = useCallback(() => {
    const id = `EMR-2024-${String(calls.length + 1).padStart(4, '0')}`;
    const call: EmergencyCall = {
      id,
      callerName: newCall.callerName || 'Anonymous Caller',
      callerNumber: newCall.callerNumber || '+91 9XXXXXXXXX',
      location: { lat: newCall.lat, lng: newCall.lng, address: newCall.address },
      timestamp: new Date(),
      severity: newCall.severity,
      description: newCall.description || 'Emergency reported via 108',
      status: 'pending',
      patientCount: newCall.patientCount,
    };
    setCalls(prev => [call, ...prev]);
    setSelectedCallId(call.id);
    setShowNewCallModal(false);
    setActiveTab('emergency');
    setNewCall({ callerName: '', callerNumber: '', patientCount: 1, severity: 'high', description: '', lat: 0, lng: 0, address: '' });
  }, [calls.length, newCall]);

  // ── Smart Ambulance Suggestions — based on accident location ──────────────
  const getSuggestedAmbulances = useCallback((call: EmergencyCall) => {
    const needed = getAmbTypeByPatients(call.patientCount);
    return ambulances
      .filter(a => a.status === 'available')
      .map(a => {
        const dist = calcDist(call.location.lat, call.location.lng, a.location.lat, a.location.lng);
        const eta = Math.max(2, Math.ceil((dist / 60) * 60));
        let score = dist;
        if (call.severity === 'critical' && a.type !== 'icu') score += 15;
        if (a.type === needed) score -= 3;
        const reasons: string[] = [];
        if (a.type === needed) reasons.push(`✓ Correct type (${a.type.toUpperCase()}) for ${call.patientCount} patient(s)`);
        if (dist < 5) reasons.push(`📍 Very close — only ${dist.toFixed(1)} km`);
        if (call.severity === 'critical' && a.type === 'icu') reasons.push('🔴 ICU unit critical for this case');
        const reason = reasons.length > 0 ? reasons.join(' | ') : `${dist.toFixed(1)} km away, ETA ${eta} min`;
        return { ...a, dist, eta, score, reason };
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, 4);
  }, [ambulances]);

  // ── Smart Hospital Suggestions — based on accident location ───────────────
  const getSuggestedHospitals = useCallback((call: EmergencyCall) => {
    return hospitals
      .map(h => {
        const beds = hospitalBeds[h.id]?.beds ?? h.bedsAvailable;
        const icu = hospitalBeds[h.id]?.icu ?? h.icuBeds;
        const dist = calcDist(call.location.lat, call.location.lng, h.location.lat, h.location.lng);
        const eta = Math.max(3, Math.ceil((dist / 60) * 60));
        let score = dist;
        if (!h.emergencyRoom) score += 8;
        if (call.severity === 'critical' && icu < 2) score += 6;
        if (beds < 2) score += 10;
        const reasons: string[] = [];
        if (h.emergencyRoom) reasons.push('✓ Active ER');
        if (call.severity === 'critical' && icu >= 2) reasons.push(`🛏 ${icu} ICU beds`);
        if (dist < 10) reasons.push(`📍 ${dist.toFixed(1)} km — nearest`);
        if (beds > 10) reasons.push(`🟢 ${beds} beds available`);
        const reason = reasons.length > 0 ? reasons.join(' | ') : `${dist.toFixed(1)} km, ${beds} beds`;
        return { ...h, bedsAvailable: beds, icuBeds: icu, dist, eta, score, reason };
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, 6); // Show top 6 nearest hospitals
  }, [hospitals, hospitalBeds]);

  // ── Style Helpers ──────────────────────────────────────────────────────────
  const getSeverityStyle = (s: string) => ({ critical: 'bg-red-100 text-red-700 border-red-300', high: 'bg-orange-100 text-orange-700 border-orange-300', medium: 'bg-amber-100 text-amber-700 border-amber-300', low: 'bg-green-100 text-green-700 border-green-300' }[s] || 'bg-gray-100 text-gray-700');
  const getStatusStyle = (s: string) => ({ pending: 'bg-gray-100 text-gray-700', dispatched: 'bg-blue-100 text-blue-700', en_route: 'bg-orange-100 text-orange-700', at_scene: 'bg-purple-100 text-purple-700', to_hospital: 'bg-teal-100 text-teal-700', completed: 'bg-green-100 text-green-700' }[s] || 'bg-gray-100 text-gray-700');
  const getAmbDot = (s: string) => ({ available: 'bg-green-500', dispatched: 'bg-blue-500', en_route: 'bg-red-500 animate-pulse', at_scene: 'bg-purple-500', to_hospital: 'bg-teal-500', returning: 'bg-cyan-500', maintenance: 'bg-gray-400' }[s] || 'bg-gray-400');

  const activeCalls = calls.filter(c => c.status !== 'completed');
  const availableAmb = ambulances.filter(a => a.status === 'available');
  const statusSteps = ['pending', 'dispatched', 'en_route', 'at_scene', 'to_hospital', 'completed'];
  const statusLabels: Record<string, string> = { pending: 'Pending', dispatched: 'Dispatched', en_route: 'En Route', at_scene: 'At Scene', to_hospital: 'To Hospital', completed: 'Completed' };

  const analyticsData = [
    { hour: '00', calls: 2 }, { hour: '04', calls: 1 }, { hour: '06', calls: 3 },
    { hour: '08', calls: 8 }, { hour: '10', calls: 6 }, { hour: '12', calls: 5 },
    { hour: '14', calls: 7 }, { hour: '16', calls: 10 }, { hour: '18', calls: 9 },
    { hour: '20', calls: 7 }, { hour: '22', calls: 4 },
  ];
  const responseData = [
    { month: 'Jan', avg: 8.2, target: 8 }, { month: 'Feb', avg: 7.8, target: 8 },
    { month: 'Mar', avg: 7.5, target: 8 }, { month: 'Apr', avg: 7.2, target: 7 },
    { month: 'May', avg: 6.9, target: 7 }, { month: 'Jun', avg: 6.5, target: 7 },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100">

      {/* HEADER */}
      <header className="bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 text-white shadow-2xl">
        <div className="px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 p-2.5 rounded-xl shadow-lg flex-shrink-0">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-base md:text-xl font-extrabold tracking-tight">108 Emergency Dispatch Center</h1>
                <p className="text-slate-400 text-[10px] md:text-xs font-medium">Centralized Decision Support System — All India 108 Network</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden md:block text-right">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">Live Time</p>
                <p className="text-lg font-mono font-bold tabular-nums">{currentTime.toLocaleTimeString()}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-green-500/20 px-2 md:px-3 py-1.5 rounded-lg border border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-300 text-[10px] font-bold uppercase hidden sm:inline">Online</span>
              </div>
              <button
                onClick={() => setShowNewCallModal(true)}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 px-3 md:px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all hover:scale-105 shadow-lg shadow-red-500/30"
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">New 108 Call</span>
                <span className="sm:hidden">+ Call</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* NAV */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-[998]">
        <div className="px-4 flex gap-0.5 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'emergency', label: 'Emergency Calls', icon: Phone },
            { id: 'map', label: 'Live Map', icon: MapPin },
            { id: 'hospitals', label: 'Hospitals', icon: Building2 },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3 md:px-5 py-3.5 border-b-[3px] font-medium text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-red-600 text-red-600 bg-red-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <tab.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              {tab.id === 'emergency' && activeCalls.length > 0 && (
                <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{activeCalls.length}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="px-3 md:px-6 py-5 space-y-5">

        {/* ══ DASHBOARD ══════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { label: 'Active Emergencies', value: activeCalls.length, icon: AlertTriangle, color: 'red', sub: `${calls.filter(c => c.severity === 'critical' && c.status !== 'completed').length} critical` },
                { label: 'Available Ambulances', value: availableAmb.length, icon: Ambulance, color: 'green', sub: `of ${ambulances.length} total` },
                { label: 'Avg Response Time', value: '6.5 min', icon: Timer, color: 'blue', sub: '↓ 12% improved' },
                { label: 'Hospital Network', value: hospitals.length, icon: Building2, color: 'teal', sub: `${hospitals.filter(h => (hospitalBeds[h.id]?.beds ?? h.bedsAvailable) > 0).length} with beds` },
                { label: 'Lives Saved Today', value: 42, icon: Heart, color: 'pink', sub: '97.8% survival rate' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                      <p className={`text-2xl font-extrabold mt-1 text-${s.color}-600`}>{s.value}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{s.sub}</p>
                    </div>
                    <div className={`bg-${s.color}-100 p-2 rounded-lg`}>
                      <s.icon className={`w-5 h-5 text-${s.color}-600`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Map + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <h2 className="font-bold text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Live Emergency Map — OpenStreetMap
                  </h2>
                  <button onClick={() => setActiveTab('map')} className="text-red-600 text-xs font-bold flex items-center gap-1 hover:underline">
                    Full Map <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <LiveMap calls={calls} ambulances={ambulances} hospitals={hospitals} congestionZones={congestionZones}
                  selectedCallId={selectedCallId || undefined} onSelectCall={id => { setSelectedCallId(id); setActiveTab('emergency'); }}
                  routeExplanations={routeExplanations} height="420px" />
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <h2 className="font-bold text-sm">Active Emergencies</h2>
                    <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                  </div>
                  <div className="divide-y max-h-56 overflow-y-auto">
                    {activeCalls.length === 0 && <div className="p-6 text-center text-gray-400 text-sm">No active emergencies</div>}
                    {activeCalls.map(call => (
                      <div key={call.id} onClick={() => { setSelectedCallId(call.id); setActiveTab('emergency'); }}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] text-gray-400">{call.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityStyle(call.severity)}`}>{call.severity.toUpperCase()}</span>
                        </div>
                        <p className="font-semibold text-sm">{call.callerName}</p>
                        <p className="text-xs text-gray-500 truncate">{call.location.address}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getStatusStyle(call.status)}`}>{statusLabels[call.status]}</span>
                          <span className="text-[10px] text-gray-400">{Math.floor((currentTime.getTime() - call.timestamp.getTime()) / 60000)}m ago</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border">
                  <div className="px-4 py-3 border-b"><h2 className="font-bold text-sm">Fleet Status</h2></div>
                  <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                    {ambulances.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer"
                        onClick={() => { setTrackingAmbulanceId(a.id); setActiveTab('map'); }}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${getAmbDot(a.status)}`} />
                          <div>
                            <p className="text-xs font-bold">{a.id}</p>
                            <p className="text-[10px] text-gray-400">{a.vehicleNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-semibold text-gray-600">{a.type.toUpperCase()}</p>
                          <p className="text-[10px] text-gray-400">{a.status.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ EMERGENCY CALLS ════════════════════════════════════════════════ */}
        {activeTab === 'emergency' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Call list */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <h2 className="font-bold text-sm">All Calls</h2>
                  <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{activeCalls.length} Active</span>
                </div>
                <div className="divide-y max-h-[calc(100vh-200px)] overflow-y-auto">
                  {calls.map(call => (
                    <div key={call.id} onClick={() => setSelectedCallId(call.id)}
                      className={`px-4 py-3 cursor-pointer transition-all ${selectedCallId === call.id ? 'bg-red-50 border-l-4 border-red-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] text-gray-400">{call.id}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getSeverityStyle(call.severity)}`}>{call.severity.toUpperCase()}</span>
                      </div>
                      <p className="font-semibold text-sm">{call.callerName}</p>
                      <p className="text-xs text-gray-500 truncate">{call.location.address}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${getStatusStyle(call.status)}`}>{statusLabels[call.status]}</span>
                        <span className="text-[10px] text-gray-400">{Math.floor((currentTime.getTime() - call.timestamp.getTime()) / 60000)}m</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Call details */}
            <div className="lg:col-span-9 space-y-5">
              {selectedCall ? (
                <>
                  {/* Header banner */}
                  <div className={`rounded-xl overflow-hidden shadow-sm ${selectedCall.severity === 'critical' ? 'bg-gradient-to-r from-red-700 to-red-800' : selectedCall.severity === 'high' ? 'bg-gradient-to-r from-orange-600 to-orange-700' : 'bg-gradient-to-r from-amber-500 to-amber-600'} text-white`}>
                    <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <p className="text-xs opacity-70 uppercase tracking-wider">Emergency ID</p>
                        <p className="text-2xl font-extrabold">{selectedCall.id}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs opacity-80 flex-wrap">
                          <span>👥 {selectedCall.patientCount} patient{selectedCall.patientCount > 1 ? 's' : ''}</span>
                          <span>📍 {selectedCall.location.address}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">{selectedCall.severity.toUpperCase()}</span>
                        <p className="text-xs opacity-70 mt-1">⏱ {Math.floor((currentTime.getTime() - selectedCall.timestamp.getTime()) / 60000)} min elapsed</p>
                        <p className="text-xs opacity-70 mt-0.5">🚑 Needs: {getAmbTypeName(getAmbTypeByPatients(selectedCall.patientCount))}</p>
                        {selectedCall.assignedAmbulance && (
                          <button onClick={() => { setTrackingAmbulanceId(selectedCall.assignedAmbulance); setActiveTab('map'); }}
                            className="mt-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold flex items-center gap-1 ml-auto">
                            <Eye className="w-3 h-3" /> Track on Map
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status timeline */}
                    <div className="px-6 py-3 bg-black/15">
                      <div className="flex items-center gap-1 overflow-x-auto pb-1">
                        {statusSteps.map((step, idx) => {
                          const cur = statusSteps.indexOf(selectedCall.status);
                          const past = idx <= cur;
                          const isCur = idx === cur;
                          return (
                            <div key={step} className="flex items-center">
                              <div className="flex flex-col items-center min-w-[52px]">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isCur ? 'bg-white text-gray-900 scale-110 shadow-lg' : past ? 'bg-white/40 text-white' : 'bg-white/10 text-white/40'}`}>
                                  {past && idx < cur ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                                </div>
                                <span className={`text-[9px] mt-1 text-center ${isCur ? 'font-bold' : 'opacity-60'}`}>{statusLabels[step]}</span>
                              </div>
                              {idx < statusSteps.length - 1 && <div className={`w-6 sm:w-8 h-0.5 mx-0.5 mb-3 ${past && idx < cur ? 'bg-white/70' : 'bg-white/15'}`} />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Info + Mini Map */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl shadow-sm border p-5">
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Info className="w-4 h-4 text-blue-500" /> Call Information</h3>
                        <div className="space-y-3">
                          {[
                            { icon: User, label: 'Caller', value: selectedCall.callerName },
                            { icon: Phone, label: 'Contact', value: selectedCall.callerNumber },
                            { icon: MapPin, label: 'Location', value: selectedCall.location.address },
                            { icon: AlertTriangle, label: 'Description', value: selectedCall.description },
                            { icon: Users, label: 'Patients', value: `${selectedCall.patientCount} — Needs ${getAmbTypeName(getAmbTypeByPatients(selectedCall.patientCount))}` },
                            { icon: Navigation, label: 'Coordinates', value: `${selectedCall.location.lat.toFixed(5)}, ${selectedCall.location.lng.toFixed(5)}` },
                            { icon: Clock, label: 'Reported At', value: selectedCall.timestamp.toLocaleString() },
                          ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <item.icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div><p className="text-[10px] text-gray-400 uppercase tracking-wider">{item.label}</p><p className="text-sm font-medium text-gray-800">{item.value}</p></div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Assigned ambulance info */}
                      {selectedCall.assignedAmbulance && (() => {
                        const amb = ambulances.find(a => a.id === selectedCall.assignedAmbulance);
                        if (!amb) return null;
                        const dist = calcDist(amb.location.lat, amb.location.lng, selectedCall.location.lat, selectedCall.location.lng);
                        const exp = routeExplanations[amb.id];
                        return (
                          <div className="bg-white rounded-xl shadow-sm border p-5">
                            <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Ambulance className="w-4 h-4 text-red-500" /> Assigned Ambulance</h3>
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="bg-red-600 p-1.5 rounded-lg"><Ambulance className="w-4 h-4 text-white" /></div>
                                  <div>
                                    <p className="font-bold text-sm">{amb.id}</p>
                                    <p className="text-xs text-gray-500">{amb.driverName} • {amb.type.toUpperCase()} • {amb.vehicleNumber}</p>
                                  </div>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusStyle(amb.status)}`}>{amb.status.replace(/_/g, ' ').toUpperCase()}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                                <div className="bg-white rounded-lg p-2"><p className="text-[10px] text-gray-400">Distance</p><p className="text-sm font-bold text-red-700">{dist.toFixed(1)} km</p></div>
                                <div className="bg-white rounded-lg p-2"><p className="text-[10px] text-gray-400">ETA</p><p className="text-sm font-bold text-orange-600">{Math.max(1, Math.ceil((dist / 60) * 60))} min</p></div>
                                <div className="bg-white rounded-lg p-2"><p className="text-[10px] text-gray-400">Speed</p><p className="text-sm font-bold text-blue-600">~60 km/h</p></div>
                              </div>
                              {exp && (
                                <div className="bg-white rounded-lg p-3 border border-red-100">
                                  <p className="text-[10px] font-bold text-gray-600 uppercase mb-1 flex items-center gap-1"><Route className="w-3 h-3" /> Route (Dijkstra's Algorithm)</p>
                                  <p className="text-[11px] text-gray-700 leading-relaxed">{exp.reason}</p>
                                  <div className="flex gap-2 mt-2 flex-wrap">
                                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded">📏 {exp.distance}</span>
                                    <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded">⏱ {exp.duration}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded ${exp.trafficLevel === 'Clear' ? 'bg-green-50 text-green-700' : exp.trafficLevel === 'Moderate' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>🚦 {exp.trafficLevel}</span>
                                  </div>
                                  {exp.avoidedZones.length > 0 && <p className="text-[10px] text-red-600 mt-1">⚠ Avoided: {exp.avoidedZones.join(', ')}</p>}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Right: mini map */}
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div className="px-4 py-3 border-b flex items-center justify-between">
                        <h3 className="font-bold text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-red-500" /> Live Tracking</h3>
                        {trackingAmbulanceId && <span className="text-[10px] font-bold text-red-600 flex items-center gap-1"><Radio className="w-3 h-3 animate-pulse" /> {trackingAmbulanceId}</span>}
                      </div>
                      <LiveMap calls={calls} ambulances={ambulances} hospitals={hospitals} congestionZones={congestionZones}
                        selectedCallId={selectedCallId || undefined} onSelectCall={id => setSelectedCallId(id)}
                        trackingAmbulanceId={trackingAmbulanceId} routeExplanations={routeExplanations} height="380px" />
                    </div>
                  </div>

                  {/* ── Dispatch Panel */}
                  {selectedCall.status === 'pending' && (
                    <div className="bg-white rounded-xl shadow-sm border p-5">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-5 h-5 text-orange-500" />
                        <h3 className="font-bold">Smart Dispatch — {selectedCall.patientCount} Patient{selectedCall.patientCount > 1 ? 's' : ''} at {selectedCall.location.address}</h3>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">
                        Ambulances sorted by proximity to accident location • Dijkstra's Algorithm applied for route optimization
                        <span className="ml-2 font-bold text-orange-600">Type needed: {getAmbTypeByPatients(selectedCall.patientCount).toUpperCase()}</span>
                      </p>

                      {availableAmb.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-xl">All ambulances currently deployed. Please wait.</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {getSuggestedAmbulances(selectedCall).map((amb, idx) => {
                            const recommended = idx === 0;
                            const needed = getAmbTypeByPatients(selectedCall.patientCount);
                            const typeMatch = amb.type === needed;
                            return (
                              <div key={amb.id} className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg relative ${recommended ? 'border-red-400 bg-red-50 shadow-md' : 'border-gray-200 hover:border-orange-300'}`}>
                                {recommended && (
                                  <div className="absolute -top-3 left-4">
                                    <span className="bg-red-600 text-white text-[10px] px-3 py-1 rounded-full font-bold flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-white" /> TOP RECOMMENDATION
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-3 mb-3 mt-1">
                                  <div className={`p-2 rounded-lg ${amb.type === 'icu' ? 'bg-red-100' : amb.type === 'advanced' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                                    <Truck className={`w-5 h-5 ${amb.type === 'icu' ? 'text-red-600' : amb.type === 'advanced' ? 'text-orange-600' : 'text-blue-600'}`} />
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm">{amb.id}</p>
                                    <p className="text-[11px] text-gray-500">{amb.driverName} • {amb.vehicleNumber}</p>
                                  </div>
                                  <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold ${amb.type === 'icu' ? 'bg-red-100 text-red-700' : amb.type === 'advanced' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {amb.type.toUpperCase()}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  <div className="bg-white rounded-lg p-2 text-center border">
                                    <p className="text-[10px] text-gray-400">Distance</p>
                                    <p className="text-base font-extrabold text-gray-800">{amb.dist.toFixed(1)} km</p>
                                  </div>
                                  <div className="bg-white rounded-lg p-2 text-center border">
                                    <p className="text-[10px] text-gray-400">ETA</p>
                                    <p className="text-base font-extrabold text-orange-600">{amb.eta} min</p>
                                  </div>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-2 mb-3 border border-blue-100">
                                  <p className="text-[10px] font-bold text-blue-700 mb-0.5">💡 Why this unit?</p>
                                  <p className="text-[11px] text-blue-800">{amb.reason}</p>
                                  {typeMatch && <span className="inline-block mt-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Correct ambulance type</span>}
                                </div>
                                <button onClick={() => handleDispatch(selectedCall.id, amb.id)}
                                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${recommended ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg' : 'bg-gray-800 hover:bg-gray-900 text-white'}`}>
                                  <Ambulance className="w-4 h-4" /> Dispatch {amb.id}
                                  <ArrowRight className="w-4 h-4 ml-auto" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Hospital Panel (at_scene) */}
                  {selectedCall.status === 'at_scene' && (
                    <div className="bg-white rounded-xl shadow-sm border p-5">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-5 h-5 text-teal-600" />
                        <h3 className="font-bold">Nearest Hospitals to Accident Zone</h3>
                        <span className="ml-auto text-xs text-teal-700 bg-teal-50 px-2 py-1 rounded-full font-medium border border-teal-200">
                          📍 Sorted by distance from: {selectedCall.location.address}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">
                        Showing all hospitals within reach of the accident zone. Sorted by distance + bed availability + ER status. Dijkstra's algorithm selects optimal route to each hospital.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {getSuggestedHospitals(selectedCall).map((hosp, idx) => {
                          const recommended = idx === 0;
                          return (
                            <div key={hosp.id} className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg relative ${recommended ? 'border-teal-400 bg-teal-50 shadow-md' : 'border-gray-200 hover:border-teal-300'}`}>
                              {recommended && (
                                <div className="absolute -top-3 left-4">
                                  <span className="bg-teal-600 text-white text-[10px] px-3 py-1 rounded-full font-bold flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-white" /> BEST MATCH
                                  </span>
                                </div>
                              )}
                              <div className="mt-2 mb-2">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="font-bold text-sm leading-tight">{hosp.name}</p>
                                  <span className="text-base font-extrabold text-teal-700 flex-shrink-0">{hosp.dist.toFixed(1)} km</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{hosp.address}</p>
                              </div>

                              <div className="grid grid-cols-3 gap-1.5 mb-2">
                                <div className={`rounded-lg p-1.5 text-center ${hosp.bedsAvailable > 10 ? 'bg-green-50 border border-green-200' : hosp.bedsAvailable > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                                  <p className="text-[9px] text-gray-500">Beds</p>
                                  <p className={`text-base font-extrabold ${hosp.bedsAvailable > 10 ? 'text-green-600' : hosp.bedsAvailable > 0 ? 'text-amber-600' : 'text-red-600'}`}>{hosp.bedsAvailable}</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-1.5 text-center">
                                  <p className="text-[9px] text-gray-500">ICU</p>
                                  <p className="text-base font-extrabold text-blue-600">{hosp.icuBeds}</p>
                                </div>
                                <div className={`rounded-lg p-1.5 text-center ${hosp.emergencyRoom ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}>
                                  <p className="text-[9px] text-gray-500">ER</p>
                                  <p className={`text-base font-extrabold ${hosp.emergencyRoom ? 'text-red-600' : 'text-gray-400'}`}>{hosp.emergencyRoom ? '✓' : '✗'}</p>
                                </div>
                              </div>

                              <div className="bg-teal-50 rounded-lg p-2 mb-2 border border-teal-100">
                                <p className="text-[10px] font-bold text-teal-700 mb-0.5">💡 Why this hospital?</p>
                                <p className="text-[11px] text-teal-800">{hosp.reason}</p>
                                <span className="text-[10px] bg-white text-teal-700 px-2 py-0.5 rounded border border-teal-200 mt-1 inline-block">⏱ ETA {hosp.eta} min</span>
                              </div>

                              <p className="text-[10px] text-gray-500 mb-2 truncate">🔬 {hosp.specialties.slice(0, 3).join(' • ')}</p>
                              <p className="text-[10px] text-gray-500 mb-2">📞 {hosp.phone}</p>

                              <button onClick={() => handleConfirmHospital(selectedCall.id, hosp)}
                                disabled={hosp.bedsAvailable === 0}
                                className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${recommended ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg' : 'bg-slate-700 hover:bg-slate-800 text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                <CheckCircle className="w-3.5 h-3.5" /> Confirm Admission
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── To Hospital */}
                  {selectedCall.status === 'to_hospital' && (() => {
                    const amb = ambulances.find(a => a.currentCallId === selectedCall.id);
                    const exp = amb ? routeExplanations[`${amb.id}_hospital`] : null;
                    return (
                      <div className="bg-white rounded-xl shadow-sm border p-5">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div>
                            <h3 className="font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-teal-500 animate-pulse" /> Transporting to {selectedCall.assignedHospital}</h3>
                            {exp && (
                              <div className="mt-3 bg-teal-50 rounded-lg p-3 border border-teal-200 max-w-xl">
                                <p className="text-xs font-bold text-teal-700 mb-1 flex items-center gap-1"><Route className="w-3 h-3" /> Hospital Route (Dijkstra's Algorithm)</p>
                                <p className="text-xs text-teal-800">{exp.reason}</p>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  <span className="text-[10px] bg-white text-teal-700 px-2 py-0.5 rounded border">📏 {exp.distance}</span>
                                  <span className="text-[10px] bg-white text-orange-700 px-2 py-0.5 rounded border">⏱ {exp.duration}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded border ${exp.trafficLevel === 'Clear' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>🚦 {exp.trafficLevel}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <button onClick={() => handleComplete(selectedCall.id)}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" /> Complete & Release Ambulance
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Completed */}
                  {selectedCall.status === 'completed' && (
                    <div className="bg-green-50 rounded-xl border-2 border-green-200 p-8 text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <h3 className="font-bold text-xl text-green-800">Emergency Resolved ✓</h3>
                      <p className="text-sm text-green-600 mt-2">Patient admitted to <strong>{selectedCall.assignedHospital || 'hospital'}</strong>. Ambulance <strong>{selectedCall.assignedAmbulance || ''}</strong> released and available.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                  <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-600">Select an Emergency Call</h3>
                  <p className="text-sm text-gray-400 mt-1">Choose a call from the list to manage response</p>
                  <button onClick={() => setShowNewCallModal(true)} className="mt-4 px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700">
                    + New 108 Call
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ LIVE MAP ═══════════════════════════════════════════════════════ */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            {Object.keys(simulationStep).length > 0 && (
              <div className="bg-gradient-to-r from-slate-900 to-red-950 text-white rounded-xl p-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-ping" />
                  <span className="font-bold text-sm">🚨 LIVE SIMULATION ACTIVE</span>
                </div>
                {Object.entries(simulationStep).map(([ambId, step]) => (
                  <div key={ambId} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg text-xs">
                    <Ambulance className="w-3.5 h-3.5 text-orange-300" />
                    <span className="font-bold text-orange-200">{ambId}</span>
                    <ArrowRight className="w-3 h-3 text-white/40" />
                    <span className="text-white/80">{step.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-bold flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  Live Dispatch Map — OpenStreetMap (All India)
                </h2>
                {trackingAmbulanceId ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-orange-600 flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                      <Radio className="w-3 h-3 animate-pulse" /> Tracking: {trackingAmbulanceId}
                    </span>
                    <button onClick={() => setTrackingAmbulanceId(undefined)} className="text-xs text-gray-500 hover:text-gray-700 underline">Stop</button>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Click any ambulance to track it</span>
                )}
              </div>
              <LiveMap calls={calls} ambulances={ambulances} hospitals={hospitals} congestionZones={congestionZones}
                selectedCallId={selectedCallId || undefined}
                onSelectCall={id => { setSelectedCallId(id); setActiveTab('emergency'); }}
                trackingAmbulanceId={trackingAmbulanceId}
                routeExplanations={routeExplanations}
                height="calc(100vh - 320px)" />
            </div>

            {Object.keys(routeExplanations).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(routeExplanations).map(([key, exp]) => (
                  <div key={key} className="bg-white rounded-xl shadow-sm border p-4">
                    <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                      <Route className="w-4 h-4 text-red-500" />
                      {key.includes('_hospital') ? '🏥 Hospital Route' : '🚨 Emergency Route'}: {key.replace('_hospital', '')}
                    </h4>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-1 rounded">📏 {exp.distance}</span>
                      <span className="text-[11px] bg-orange-50 text-orange-700 px-2 py-1 rounded">⏱ {exp.duration}</span>
                      <span className={`text-[11px] px-2 py-1 rounded ${exp.trafficLevel === 'Clear' ? 'bg-green-50 text-green-700' : exp.trafficLevel === 'Moderate' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>🚦 {exp.trafficLevel}</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-2">{exp.reason}</p>
                    {exp.avoidedZones.length > 0 && <p className="text-[11px] text-red-600 mt-1">⚠ Avoided: {exp.avoidedZones.join(', ')}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Ambulance grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
              {ambulances.map(amb => (
                <div key={amb.id}
                  className={`bg-white rounded-xl shadow-sm border p-3 cursor-pointer hover:shadow-md transition-all ${trackingAmbulanceId === amb.id ? 'ring-2 ring-red-400 bg-red-50' : ''}`}
                  onClick={() => setTrackingAmbulanceId(prev => prev === amb.id ? undefined : amb.id)}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs">{amb.id}</span>
                    <div className={`w-2.5 h-2.5 rounded-full ${getAmbDot(amb.status)}`} />
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">{amb.driverName.split(' ')[0]}</p>
                  <p className="text-[10px] text-gray-400 truncate">{amb.vehicleNumber}</p>
                  <div className="mt-2 flex flex-col gap-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-center ${getStatusStyle(amb.status === 'available' ? 'completed' : amb.status)}`}>
                      {amb.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-[9px] font-bold text-gray-400 text-center">{amb.type.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ HOSPITALS ══════════════════════════════════════════════════════ */}
        {activeTab === 'hospitals' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3">
              <Building2 className="w-5 h-5 text-teal-600" />
              <div>
                <p className="font-bold text-sm">All India Hospital Network — {hospitals.length} Hospitals</p>
                <p className="text-xs text-gray-500">Real-time bed availability across Tamil Nadu, Karnataka, Maharashtra, Delhi, West Bengal, Telangana, Gujarat, Kerala, UP, Rajasthan</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {hospitals.map(hosp => {
                const beds = hospitalBeds[hosp.id]?.beds ?? hosp.bedsAvailable;
                const icu = hospitalBeds[hosp.id]?.icu ?? hosp.icuBeds;
                return (
                  <div key={hosp.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-r from-teal-700 to-teal-800 text-white px-5 py-4">
                      <h3 className="font-bold text-sm">{hosp.name}</h3>
                      <p className="text-xs text-teal-200 mt-0.5">{hosp.address}</p>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className={`text-center p-2 rounded-xl border ${beds > 10 ? 'bg-green-50 border-green-200' : beds > 0 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                          <p className="text-[10px] text-gray-500">Beds</p>
                          <p className={`text-xl font-extrabold ${beds > 10 ? 'text-green-600' : beds > 0 ? 'text-amber-600' : 'text-red-600'}`}>{beds}</p>
                        </div>
                        <div className="text-center p-2 bg-blue-50 border border-blue-200 rounded-xl">
                          <p className="text-[10px] text-gray-500">ICU</p>
                          <p className="text-xl font-extrabold text-blue-600">{icu}</p>
                        </div>
                        <div className={`text-center p-2 rounded-xl border ${hosp.emergencyRoom ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                          <p className="text-[10px] text-gray-500">ER</p>
                          <p className={`text-xl font-extrabold ${hosp.emergencyRoom ? 'text-red-600' : 'text-gray-400'}`}>{hosp.emergencyRoom ? '✓' : '✗'}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {hosp.specialties.map(s => <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px]">{s}</span>)}
                      </div>
                      <p className="text-xs text-gray-500">📞 {hosp.phone}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-4 py-3 border-b"><h2 className="font-bold text-sm">All India Hospital Network Map</h2></div>
              <LiveMap calls={[]} ambulances={[]} hospitals={hospitals} congestionZones={congestionZones} height="450px" />
            </div>
          </div>
        )}

        {/* ══ ANALYTICS ══════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Calls Today', val: '47', sub: '↑ 12% from yesterday', bg: 'from-red-500 to-red-700', icon: Phone },
                { label: 'Avg Response Time', val: '6.5m', sub: '↓ 12% improvement', bg: 'from-orange-500 to-orange-700', icon: TrendingDown },
                { label: 'Lives Saved', val: '42', sub: '97.8% survival rate', bg: 'from-green-500 to-green-700', icon: Heart },
                { label: 'Fleet Utilization', val: '83%', sub: `${ambulances.filter(a => a.status !== 'available' && a.status !== 'maintenance').length} of ${ambulances.length} active`, bg: 'from-blue-500 to-blue-700', icon: Activity },
              ].map((c, i) => (
                <div key={i} className={`bg-gradient-to-br ${c.bg} text-white rounded-xl p-5 shadow-sm`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs opacity-80">{c.label}</p>
                      <p className="text-3xl font-extrabold mt-1">{c.val}</p>
                      <p className="text-xs opacity-70 mt-1">{c.sub}</p>
                    </div>
                    <c.icon className="w-6 h-6 opacity-40" />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="font-bold text-sm mb-4">Emergency Calls by Hour</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="calls" stroke="#DC2626" fill="#FEE2E2" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="font-bold text-sm mb-4">Monthly Response Time (min)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={responseData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="avg" stroke="#EA580C" strokeWidth={2} dot={{ fill: '#EA580C', r: 4 }} name="Actual" />
                    <Line type="monotone" dataKey="target" stroke="#D1D5DB" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Target" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="font-bold text-sm mb-4">Ambulance Utilization</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ambulances.map(a => ({ name: a.id, trips: Math.floor(Math.random() * 8) + 2 }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" fontSize={9} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="trips" fill="#0D9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="font-bold text-sm mb-4">Severity Distribution Today</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                    { severity: 'Critical', count: 8 }, { severity: 'High', count: 15 },
                    { severity: 'Medium', count: 18 }, { severity: 'Low', count: 6 },
                  ]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" fontSize={11} />
                    <YAxis type="category" dataKey="severity" fontSize={11} width={60} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#DC2626" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ══ NEW CALL MODAL ════════════════════════════════════════════════════ */}
      {showNewCallModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-red-700 to-red-800 text-white px-6 py-5 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg"><Phone className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-lg font-extrabold">108 Emergency Call</h2>
                  <p className="text-xs text-red-200">Auto-detecting caller location via GPS & cell towers...</p>
                </div>
              </div>
              <button onClick={() => setShowNewCallModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Location detection */}
              <div className={`rounded-xl p-4 border-2 transition-all ${locationDetected ? 'bg-green-50 border-green-300' : locatingCaller ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${locationDetected ? 'bg-green-100' : 'bg-blue-100'}`}>
                    {locatingCaller ? (
                      <div className="w-5 h-5 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : locationDetected ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${locationDetected ? 'text-green-800' : 'text-blue-800'}`}>
                      {locatingCaller ? '🔍 Triangulating caller location...' : locationDetected ? '✅ Accident Zone Located!' : 'Waiting...'}
                    </p>
                    {locationDetected && detectedAddress && (
                      <p className="text-xs text-gray-700 mt-0.5 font-medium truncate">📍 {detectedAddress}</p>
                    )}
                    {locationDetected && newCall.lat !== 0 && (
                      <p className="text-[10px] text-gray-400 font-mono">{newCall.lat.toFixed(5)}, {newCall.lng.toFixed(5)}</p>
                    )}
                    {locatingCaller && <p className="text-xs text-blue-600 mt-0.5">Using GPS triangulation + cell tower data...</p>}
                  </div>
                  {locationDetected && <Wifi className="w-5 h-5 text-green-600 flex-shrink-0" />}
                </div>
              </div>

              {/* Patient count */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Number of Patients <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setNewCall(p => ({ ...p, patientCount: Math.max(1, p.patientCount - 1) }))}
                      className="w-9 h-9 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-lg flex items-center justify-center transition-colors">−</button>
                    <span className="text-2xl font-extrabold w-8 text-center">{newCall.patientCount}</span>
                    <button onClick={() => setNewCall(p => ({ ...p, patientCount: Math.min(10, p.patientCount + 1) }))}
                      className="w-9 h-9 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-lg flex items-center justify-center transition-colors">+</button>
                  </div>
                  <div className={`flex-1 rounded-xl px-3 py-2.5 text-center border-2 text-xs font-bold ${newCall.patientCount >= 5 ? 'bg-red-50 border-red-300 text-red-700' : newCall.patientCount >= 3 ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-blue-50 border-blue-300 text-blue-700'}`}>
                    {newCall.patientCount >= 5 ? '🔴 ICU Ambulance Required' : newCall.patientCount >= 3 ? '🟠 Advanced Life Support' : '🔵 Basic Life Support'}
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">1–2: BLS | 3–4: ALS | 5+: ICU</p>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Severity Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['critical', 'high', 'medium', 'low'] as const).map(s => (
                    <button key={s} onClick={() => setNewCall(p => ({ ...p, severity: s }))}
                      className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${newCall.severity === s
                        ? s === 'critical' ? 'bg-red-600 text-white border-red-600'
                          : s === 'high' ? 'bg-orange-500 text-white border-orange-500'
                            : s === 'medium' ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caller info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Caller Name</label>
                  <input type="text" value={newCall.callerName} onChange={e => setNewCall(p => ({ ...p, callerName: e.target.value }))}
                    placeholder="Enter name" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                  <input type="text" value={newCall.callerNumber} onChange={e => setNewCall(p => ({ ...p, callerNumber: e.target.value }))}
                    placeholder="+91 XXXXX XXXXX" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea value={newCall.description} onChange={e => setNewCall(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the emergency..." rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:outline-none resize-none" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowNewCallModal(false)}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleRegisterCall} disabled={!locationDetected || newCall.lat === 0}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                  <Zap className="w-4 h-4" />
                  {locationDetected ? 'Register Emergency' : 'Detecting Location...'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Chatbot />
    </div>
  );
}
