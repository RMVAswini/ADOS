import { useEffect, useRef, useCallback } from 'react';
import type { EmergencyCall, AmbulanceUnit, HospitalInfo, CongestionZone } from '../types';

export interface RouteExplanation {
  distance: string;
  duration: string;
  reason: string;
  waypoints: [number, number][];
  avoidedZones: string[];
  trafficLevel: string;
}

interface LiveMapProps {
  calls: EmergencyCall[];
  ambulances: AmbulanceUnit[];
  hospitals: HospitalInfo[];
  congestionZones: CongestionZone[];
  selectedCallId?: string;
  onSelectCall?: (id: string) => void;
  trackingAmbulanceId?: string;
  height?: string;
  routeExplanations?: Record<string, RouteExplanation>;
}

function generateSmartRoute(
  startLat: number, startLng: number,
  endLat: number, endLng: number,
  zones: CongestionZone[]
): [number, number][] {
  const points: [number, number][] = [[startLat, startLng]];
  const steps = 10;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    let lat = startLat + (endLat - startLat) * t;
    let lng = startLng + (endLng - startLng) * t;
    zones.forEach(zone => {
      if (zone.permanent || zone.level === 'severe') {
        const dLat = lat - zone.center.lat;
        const dLng = lng - zone.center.lng;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        const avoidRadius = (zone.radius / 111000) * 1.6;
        if (dist < avoidRadius) {
          const pushFactor = (avoidRadius - dist) / (dist + 0.0001);
          lat += dLat * pushFactor;
          lng += dLng * pushFactor;
        }
      }
    });
    const roadDeviation = 0.0008 * Math.sin(t * Math.PI * 3);
    lat += roadDeviation;
    lng += roadDeviation * 0.4;
    points.push([lat, lng]);
  }
  points.push([endLat, endLng]);
  return points;
}

function calculateHeading(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = lng2 - lng1;
  const dLat = lat2 - lat1;
  return (Math.atan2(dLng, dLat) * (180 / Math.PI) + 360) % 360;
}

// Inject Leaflet CSS dynamically
function injectLeafletCSS() {
  if (document.getElementById('leaflet-css-injected')) return;
  const style = document.createElement('style');
  style.id = 'leaflet-css-injected';
  style.textContent = `
    .leaflet-map-pane, .leaflet-tile, .leaflet-marker-icon, .leaflet-marker-shadow,
    .leaflet-tile-pane, .leaflet-overlay-pane, .leaflet-shadow-pane,
    .leaflet-marker-pane, .leaflet-popup-pane, .leaflet-tooltip-pane { position: absolute; }
    .leaflet-map-pane { top: 0; left: 0; }
    .leaflet-container { overflow: hidden; outline: none; font-family: inherit; }
    .leaflet-container img { max-width: none !important; }
    .leaflet-tile { filter: inherit; visibility: inherit; }
    .leaflet-marker-icon, .leaflet-marker-shadow { display: block; }
    .leaflet-container .leaflet-marker-pane img, .leaflet-container .leaflet-shadow-pane img,
    .leaflet-container .leaflet-tile-pane img, .leaflet-container img.leaflet-image-layer,
    .leaflet-container .leaflet-layer { max-width: none !important; }
    .leaflet-tile { padding: 0; margin: 0; }
    .leaflet-zoom-box { width: 0; height: 0; }
    .leaflet-overlay-pane svg { position: relative; }
    .leaflet-pane { z-index: 400; }
    .leaflet-tile-pane { z-index: 200; }
    .leaflet-overlay-pane { z-index: 400; }
    .leaflet-shadow-pane { z-index: 500; }
    .leaflet-marker-pane { z-index: 600; }
    .leaflet-tooltip-pane { z-index: 650; }
    .leaflet-popup-pane { z-index: 700; }
    .leaflet-map-pane canvas { z-index: 100; }
    .leaflet-map-pane svg { z-index: 200; }
    .leaflet-control { z-index: 800; position: relative; }
    .leaflet-top, .leaflet-bottom { position: absolute; z-index: 1000; pointer-events: none; }
    .leaflet-top { top: 0; } .leaflet-bottom { bottom: 0; }
    .leaflet-left { left: 0; } .leaflet-right { right: 0; }
    .leaflet-control { float: left; clear: left; }
    .leaflet-right .leaflet-control { float: right; clear: right; }
    .leaflet-top .leaflet-control { margin-top: 10px; }
    .leaflet-bottom .leaflet-control { margin-bottom: 10px; }
    .leaflet-left .leaflet-control { margin-left: 10px; }
    .leaflet-right .leaflet-control { margin-right: 10px; }
    .leaflet-control-zoom a, .leaflet-control-layers-toggle { background-position: 50% 50%; background-repeat: no-repeat; display: block; }
    .leaflet-control-zoom a { width: 26px; height: 26px; line-height: 26px; color: black; text-align: center; text-decoration: none; }
    .leaflet-touch .leaflet-control-zoom a { width: 30px; height: 30px; line-height: 30px; }
    .leaflet-control-zoom a, .leaflet-control-layers a { background-color: #fff; border-bottom: 1px solid #ccc; }
    .leaflet-control-zoom a:hover { background-color: #f4f4f4; }
    .leaflet-control-zoom-in { border-radius: 4px 4px 0 0; }
    .leaflet-control-zoom-out { border-radius: 0 0 4px 4px; }
    .leaflet-control-zoom { box-shadow: 0 1px 5px rgba(0,0,0,0.65); border-radius: 4px; }
    .leaflet-bar { box-shadow: 0 1px 5px rgba(0,0,0,0.65); border-radius: 4px; }
    .leaflet-bar a, .leaflet-bar a:hover { background-color: #fff; border-bottom: 1px solid #ccc; width: 26px; height: 26px; line-height: 26px; display: block; text-align: center; text-decoration: none; color: black; }
    .leaflet-bar a:hover { background-color: #f4f4f4; }
    .leaflet-bar a:first-child { border-top-left-radius: 4px; border-top-right-radius: 4px; }
    .leaflet-bar a:last-child { border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; border-bottom: none; }
    .leaflet-bar a.leaflet-disabled { cursor: default; background-color: #f4f4f4; color: #bbb; }
    .leaflet-popup { position: absolute; text-align: center; }
    .leaflet-popup-content-wrapper { padding: 1px; text-align: left; border-radius: 12px; background: white; box-shadow: 0 3px 14px rgba(0,0,0,.4); }
    .leaflet-popup-content { margin: 10px 16px; line-height: 1.4; }
    .leaflet-popup-content p { margin: 4px 0; }
    .leaflet-popup-tip-container { width: 40px; height: 20px; position: absolute; left: 50%; margin-left: -20px; overflow: hidden; pointer-events: none; }
    .leaflet-popup-tip { width: 17px; height: 17px; padding: 1px; margin: -10px auto 0; transform: rotate(45deg); background: white; box-shadow: 0 3px 14px rgba(0,0,0,.4); }
    .leaflet-popup-close-button { position: absolute; top: 0; right: 0; border: none; text-align: center; width: 24px; height: 24px; font: 16px/24px Tahoma,Verdana,sans-serif; color: #757575; text-decoration: none; background: transparent; }
    .leaflet-popup-close-button:hover { color: #585858; background-color: #f4f4f4; border-radius: 50%; }
    .leaflet-interactive { cursor: pointer; }
    .leaflet-grab { cursor: grab; }
    .leaflet-grabbing { cursor: grabbing; }
    .leaflet-crosshair, .leaflet-crosshair .leaflet-interactive { cursor: crosshair; }
    .leaflet-popup-scrolled { overflow: auto; border-bottom: 1px solid #ddd; border-top: 1px solid #ddd; }
    .leaflet-div-icon { background: #fff; border: 1px solid #666; }
    .custom-marker { background: transparent !important; border: none !important; box-shadow: none !important; }
    .route-arrow { background: transparent !important; border: none !important; }
    @keyframes ambPulse {
      0% { box-shadow: 0 4px 14px rgba(220,38,38,0.4), 0 0 0 0 rgba(220,38,38,0.6); }
      100% { box-shadow: 0 4px 14px rgba(220,38,38,0.4), 0 0 0 14px rgba(220,38,38,0); }
    }
    @keyframes hospitalPulse {
      0% { box-shadow: 0 3px 10px rgba(15,118,110,0.4), 0 0 0 0 rgba(15,118,110,0.5); }
      100% { box-shadow: 0 3px 10px rgba(15,118,110,0.4), 0 0 0 12px rgba(15,118,110,0); }
    }
  `;
  document.head.appendChild(style);
}

const emergencyIcon = (L: typeof import('leaflet'), severity: string) => {
  const color = severity === 'critical' ? '#DC2626' : severity === 'high' ? '#EA580C' : severity === 'medium' ? '#D97706' : '#16A34A';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="position:relative;">
      <div style="width:40px;height:40px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,0.4);border:3px solid white;animation:ambPulse 1s infinite alternate;">
        <span style="font-size:18px;">⚠</span>
      </div>
      <div style="position:absolute;top:-26px;left:50%;transform:translateX(-50%);background:#1F2937;color:white;padding:2px 8px;border-radius:4px;font-size:10px;white-space:nowrap;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${severity.toUpperCase()}</div>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

const ambulanceIcon = (L: typeof import('leaflet'), status: string, type: string, heading: number = 0) => {
  const color = status === 'available' ? '#16A34A' : status === 'maintenance' ? '#6B7280' : ['en_route', 'dispatched'].includes(status) ? '#DC2626' : status === 'to_hospital' ? '#0D9488' : '#EA580C';
  const typeLabel = type === 'icu' ? 'ICU' : type === 'advanced' ? 'ALS' : 'BLS';
  const isMoving = ['dispatched', 'en_route', 'to_hospital'].includes(status);
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="transform:rotate(${heading}deg);position:relative;">
      <div style="width:46px;height:46px;border-radius:10px;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,0.4);border:3px solid white;${isMoving ? 'animation:ambPulse 0.7s infinite alternate;' : ''}">
        <span style="font-size:22px;">🚑</span>
      </div>
      <div style="position:absolute;top:-22px;left:50%;transform:translateX(-50%) rotate(-${heading}deg);background:${color};color:white;padding:1px 6px;border-radius:3px;font-size:9px;white-space:nowrap;font-weight:800;box-shadow:0 1px 4px rgba(0,0,0,0.4);">${typeLabel}${isMoving ? ' 🚨' : ''}</div>
    </div>`,
    iconSize: [46, 46],
    iconAnchor: [23, 46],
  });
};

const hospitalMarkerIcon = (L: typeof import('leaflet'), hasER: boolean) => {
  const color = hasER ? '#0F766E' : '#6B7280';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="position:relative;">
      <div style="width:38px;height:38px;border-radius:8px;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.35);border:2px solid white;animation:hospitalPulse 2s infinite alternate;">
        <span style="font-size:18px;">🏥</span>
      </div>
      <div style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);background:${color};color:white;padding:1px 5px;border-radius:3px;font-size:8px;white-space:nowrap;font-weight:700;">ER${hasER ? ' ✓' : ''}</div>
    </div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
  });
};

export default function LiveMap({
  calls,
  ambulances,
  hospitals,
  congestionZones: zones,
  selectedCallId,
  onSelectCall,
  trackingAmbulanceId,
  height = '600px',
  routeExplanations = {},
}: LiveMapProps) {
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<import('leaflet').LayerGroup | null>(null);
  const routesRef = useRef<import('leaflet').LayerGroup | null>(null);
  const congestionRef = useRef<import('leaflet').LayerGroup | null>(null);
  const trailRef = useRef<import('leaflet').LayerGroup | null>(null);
  const ambMarkersRef = useRef<Map<string, import('leaflet').Marker>>(new Map());
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const initDoneRef = useRef(false);

  // Init map
  useEffect(() => {
    if (initDoneRef.current || !mapContainerRef.current) return;
    initDoneRef.current = true;

    injectLeafletCSS();

    import('leaflet').then(L => {
      if (mapRef.current || !mapContainerRef.current) return;

      // Fix leaflet default icon path issue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      leafletRef.current = L;

      const map = L.map(mapContainerRef.current!, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      markersRef.current = L.layerGroup().addTo(map);
      routesRef.current = L.layerGroup().addTo(map);
      congestionRef.current = L.layerGroup().addTo(map);
      trailRef.current = L.layerGroup().addTo(map);

      mapRef.current = map;

      // Initial render after map is ready
      setTimeout(() => map.invalidateSize(), 300);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        ambMarkersRef.current.clear();
        initDoneRef.current = false;
      }
    };
  }, []);

  // Update ambulance markers (smooth movement)
  useEffect(() => {
    const L = leafletRef.current;
    if (!L || !markersRef.current || !mapRef.current) return;

    ambulances.forEach(amb => {
      const existing = ambMarkersRef.current.get(amb.id);
      const history = amb.routeHistory;
      let heading = 0;
      if (history.length >= 2) {
        heading = calculateHeading(history[history.length - 2].lat, history[history.length - 2].lng, history[history.length - 1].lat, history[history.length - 1].lng);
      }

      if (existing) {
        existing.setLatLng([amb.location.lat, amb.location.lng]);
        existing.setIcon(ambulanceIcon(L, amb.status, amb.type, heading));
      } else {
        const call = calls.find(c => c.id === amb.currentCallId);
        const marker = L.marker([amb.location.lat, amb.location.lng], {
          icon: ambulanceIcon(L, amb.status, amb.type, heading),
          zIndexOffset: 1000,
        });

        marker.bindPopup(`
          <div style="min-width:220px;font-family:system-ui;">
            <div style="background:${amb.status === 'available' ? '#16A34A' : amb.status === 'to_hospital' ? '#0D9488' : '#DC2626'};color:white;padding:10px 14px;margin:-10px -16px 10px;border-radius:12px 12px 0 0;">
              <strong style="font-size:15px;">🚑 ${amb.id}</strong><br>
              <span style="font-size:11px;opacity:0.85;">${amb.type.toUpperCase()} — ${amb.vehicleNumber}</span>
            </div>
            <p style="margin:6px 0;font-size:13px;"><strong>👤 ${amb.driverName}</strong></p>
            <p style="margin:4px 0;font-size:12px;">Status: <strong>${amb.status.replace(/_/g, ' ').toUpperCase()}</strong></p>
            ${call ? `<p style="margin:4px 0;font-size:11px;color:#0D9488;">📞 ${call.id} | ${call.severity.toUpperCase()}</p>` : ''}
            <p style="margin:4px 0;font-size:10px;color:#6B7280;">📍 ${amb.location.lat.toFixed(5)}, ${amb.location.lng.toFixed(5)}</p>
          </div>
        `);

        marker.on('click', () => marker.openPopup());
        markersRef.current!.addLayer(marker);
        ambMarkersRef.current.set(amb.id, marker);
      }
    });

    // Remove markers for ambulances that no longer exist
    ambMarkersRef.current.forEach((marker, id) => {
      if (!ambulances.find(a => a.id === id)) {
        markersRef.current!.removeLayer(marker);
        ambMarkersRef.current.delete(id);
      }
    });
  }, [ambulances, calls]);

  // Update static markers
  const updateStaticMarkers = useCallback(() => {
    const L = leafletRef.current;
    if (!L || !markersRef.current) return;

    // Remove only static layers (not ambulance markers)
    const toRemove: import('leaflet').Layer[] = [];
    markersRef.current.eachLayer(layer => {
      if (!Array.from(ambMarkersRef.current.values()).includes(layer as import('leaflet').Marker)) {
        toRemove.push(layer);
      }
    });
    toRemove.forEach(l => markersRef.current!.removeLayer(l));

    // Emergency call markers
    calls.filter(c => c.status !== 'completed').forEach(call => {
      const marker = L.marker([call.location.lat, call.location.lng], {
        icon: emergencyIcon(L, call.severity),
        zIndexOffset: 2000,
      });

      marker.bindPopup(`
        <div style="min-width:250px;font-family:system-ui;">
          <div style="background:${call.severity === 'critical' ? '#DC2626' : call.severity === 'high' ? '#EA580C' : '#D97706'};color:white;padding:10px 14px;margin:-10px -16px 10px;border-radius:12px 12px 0 0;">
            <strong style="font-size:14px;">${call.id}</strong><br>
            <span style="font-size:11px;opacity:0.85;">${call.severity.toUpperCase()} PRIORITY</span>
          </div>
          <p style="margin:6px 0;font-size:13px;"><strong>📞 ${call.callerName}</strong></p>
          <p style="margin:4px 0;font-size:12px;">📍 ${call.location.address}</p>
          <p style="margin:4px 0;font-size:12px;">📋 ${call.description}</p>
          <p style="margin:4px 0;font-size:12px;">👥 Patients: <strong>${call.patientCount}</strong></p>
          <p style="margin:4px 0;font-size:12px;">Status: <strong>${call.status.replace(/_/g, ' ').toUpperCase()}</strong></p>
          ${call.assignedAmbulance ? `<p style="margin:6px 0;font-size:11px;background:#D1FAE5;padding:5px 8px;border-radius:6px;color:#065F46;">🚑 ${call.assignedAmbulance} dispatched</p>` : ''}
          ${call.assignedHospital ? `<p style="margin:4px 0;font-size:11px;background:#CCFBF1;padding:5px 8px;border-radius:6px;color:#134E4A;">🏥 → ${call.assignedHospital}</p>` : ''}
        </div>
      `);
      marker.on('click', () => { onSelectCall?.(call.id); marker.openPopup(); });
      if (call.id === selectedCallId) setTimeout(() => marker.openPopup(), 200);

      // Pulse ring
      const ring = L.circle([call.location.lat, call.location.lng], {
        radius: 300,
        color: call.severity === 'critical' ? '#DC2626' : '#EA580C',
        fillColor: call.severity === 'critical' ? '#DC2626' : '#EA580C',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '6,8',
      });

      markersRef.current!.addLayer(ring);
      markersRef.current!.addLayer(marker);
    });

    // Hospital markers
    hospitals.forEach(hosp => {
      const marker = L.marker([hosp.location.lat, hosp.location.lng], {
        icon: hospitalMarkerIcon(L, hosp.emergencyRoom),
        zIndexOffset: 500,
      });

      marker.bindPopup(`
        <div style="min-width:250px;font-family:system-ui;">
          <div style="background:#0F766E;color:white;padding:10px 14px;margin:-10px -16px 10px;border-radius:12px 12px 0 0;">
            <strong>🏥 ${hosp.name}</strong>
          </div>
          <p style="margin:5px 0;font-size:12px;">📍 ${hosp.address}</p>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:8px 0;">
            <div style="background:#F0FDF4;border-radius:8px;padding:8px;text-align:center;border:1px solid #BBF7D0;">
              <div style="font-size:10px;color:#6B7280;">Beds</div>
              <div style="font-size:20px;font-weight:800;color:${hosp.bedsAvailable > 10 ? '#16A34A' : '#D97706'};">${hosp.bedsAvailable}</div>
            </div>
            <div style="background:#EFF6FF;border-radius:8px;padding:8px;text-align:center;border:1px solid #BFDBFE;">
              <div style="font-size:10px;color:#6B7280;">ICU</div>
              <div style="font-size:20px;font-weight:800;color:#2563EB;">${hosp.icuBeds}</div>
            </div>
            <div style="background:#FEF2F2;border-radius:8px;padding:8px;text-align:center;border:1px solid #FECACA;">
              <div style="font-size:10px;color:#6B7280;">ER</div>
              <div style="font-size:20px;font-weight:800;color:${hosp.emergencyRoom ? '#DC2626' : '#9CA3AF'};">${hosp.emergencyRoom ? '✓' : '✗'}</div>
            </div>
          </div>
          <p style="margin:5px 0;font-size:11px;">🔬 ${hosp.specialties.join(' • ')}</p>
          <p style="margin:5px 0;font-size:12px;">📞 ${hosp.phone}</p>
        </div>
      `);
      markersRef.current!.addLayer(marker);
    });
  }, [calls, hospitals, selectedCallId, onSelectCall]);

  // Draw routes
  const updateRoutes = useCallback(() => {
    const L = leafletRef.current;
    if (!L || !routesRef.current) return;
    routesRef.current.clearLayers();

    ambulances.forEach(amb => {
      if (!['dispatched', 'en_route', 'at_scene', 'to_hospital'].includes(amb.status)) return;
      const call = calls.find(c => c.id === amb.currentCallId);
      if (!call) return;

      // Ambulance → Emergency
      if (['dispatched', 'en_route'].includes(amb.status)) {
        const route = generateSmartRoute(amb.location.lat, amb.location.lng, call.location.lat, call.location.lng, zones);

        const shadow = L.polyline(route as L.LatLngExpression[], { color: '#7F1D1D', weight: 12, opacity: 0.15 });
        routesRef.current!.addLayer(shadow);
        shadow.bringToBack();

        const line = L.polyline(route as L.LatLngExpression[], {
          color: '#DC2626', weight: 5, opacity: 0.9, dashArray: '14, 9', lineCap: 'round',
        });

        const exp = routeExplanations[amb.id];
        line.bindPopup(`
          <div style="min-width:250px;font-family:system-ui;">
            <div style="background:#DC2626;color:white;padding:8px 14px;margin:-10px -16px 10px;border-radius:12px 12px 0 0;">
              <strong>🚨 ${amb.id} → Emergency Route</strong>
            </div>
            ${exp ? `
              <p style="margin:4px 0;font-size:12px;">📏 <strong>${exp.distance}</strong> &nbsp; ⏱ <strong>${exp.duration}</strong></p>
              <p style="margin:4px 0;font-size:12px;">🚦 Traffic: <strong style="color:${exp.trafficLevel === 'Clear' ? '#16A34A' : '#DC2626'}">${exp.trafficLevel}</strong></p>
              <hr style="margin:8px 0;border-color:#F3F4F6;">
              <p style="font-size:11px;font-weight:700;color:#1F2937;margin:0 0 4px;">📋 Why this route?</p>
              <p style="font-size:11px;color:#374151;background:#FEF2F2;padding:6px;border-radius:6px;margin:0;">${exp.reason}</p>
              ${exp.avoidedZones.length > 0 ? `<p style="font-size:11px;color:#DC2626;margin:5px 0;">⚠ Congestion avoided: ${exp.avoidedZones.join(', ')}</p>` : ''}
            ` : '<p style="font-size:12px;">🔄 Calculating optimal route using Dijkstra\'s algorithm...</p>'}
          </div>
        `);
        routesRef.current!.addLayer(line);

        // Direction dots
        for (let i = 1; i < route.length - 1; i += 2) {
          const dot = L.divIcon({
            className: 'route-arrow',
            html: `<div style="width:10px;height:10px;background:#DC2626;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(220,38,38,0.9);"></div>`,
            iconSize: [10, 10], iconAnchor: [5, 5],
          });
          routesRef.current!.addLayer(L.marker(route[i] as L.LatLngExpression, { icon: dot }));
        }
      }

      // Ambulance → Hospital
      if (amb.status === 'to_hospital' && call.hospitalLocation) {
        const hRoute = generateSmartRoute(amb.location.lat, amb.location.lng, call.hospitalLocation.lat, call.hospitalLocation.lng, zones);

        const hShadow = L.polyline(hRoute as L.LatLngExpression[], { color: '#134E4A', weight: 12, opacity: 0.15 });
        routesRef.current!.addLayer(hShadow);
        hShadow.bringToBack();

        const hLine = L.polyline(hRoute as L.LatLngExpression[], {
          color: '#0D9488', weight: 5, opacity: 0.9, dashArray: '14, 9', lineCap: 'round',
        });

        const exp = routeExplanations[`${amb.id}_hospital`];
        hLine.bindPopup(`
          <div style="min-width:250px;font-family:system-ui;">
            <div style="background:#0D9488;color:white;padding:8px 14px;margin:-10px -16px 10px;border-radius:12px 12px 0 0;">
              <strong>🏥 ${amb.id} → ${call.assignedHospital}</strong>
            </div>
            ${exp ? `
              <p style="margin:4px 0;font-size:12px;">📏 <strong>${exp.distance}</strong> &nbsp; ⏱ <strong>${exp.duration}</strong></p>
              <p style="margin:4px 0;font-size:12px;">🚦 Traffic: <strong>${exp.trafficLevel}</strong></p>
              <hr style="margin:8px 0;border-color:#F3F4F6;">
              <p style="font-size:11px;font-weight:700;color:#1F2937;margin:0 0 4px;">🏥 Why this hospital?</p>
              <p style="font-size:11px;color:#374151;background:#F0FDFA;padding:6px;border-radius:6px;margin:0;">${exp.reason}</p>
            ` : `<p style="font-size:12px;">Transporting to <strong>${call.assignedHospital}</strong></p>`}
          </div>
        `);
        routesRef.current!.addLayer(hLine);

        for (let i = 1; i < hRoute.length - 1; i += 2) {
          const dot = L.divIcon({
            className: 'route-arrow',
            html: `<div style="width:10px;height:10px;background:#0D9488;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(13,148,136,0.9);"></div>`,
            iconSize: [10, 10], iconAnchor: [5, 5],
          });
          routesRef.current!.addLayer(L.marker(hRoute[i] as L.LatLngExpression, { icon: dot }));
        }
      }
    });
  }, [ambulances, calls, zones, routeExplanations]);

  // Draw congestion zones
  const updateCongestion = useCallback(() => {
    const L = leafletRef.current;
    if (!L || !congestionRef.current) return;
    congestionRef.current.clearLayers();

    zones.forEach(zone => {
      const color = zone.level === 'severe' ? '#DC2626' : zone.level === 'heavy' ? '#EA580C' : '#D97706';
      const circle = L.circle([zone.center.lat, zone.center.lng], {
        radius: zone.radius,
        color,
        fillColor: color,
        fillOpacity: zone.permanent ? 0.2 : 0.1,
        weight: zone.permanent ? 2.5 : 1.5,
        dashArray: zone.permanent ? '' : '8,6',
      });

      circle.bindPopup(`
        <div style="font-family:system-ui;min-width:210px;">
          <div style="background:${color};color:white;padding:8px 14px;margin:-10px -16px 10px;border-radius:12px 12px 0 0;">
            <strong>🚦 ${zone.level.toUpperCase()} CONGESTION</strong>
          </div>
          <p style="font-size:13px;font-weight:600;margin:0 0 6px;">${zone.label}</p>
          <div style="background:${zone.permanent ? '#FEF2F2' : '#FFFBEB'};padding:8px;border-radius:8px;border:1px solid ${zone.permanent ? '#FECACA' : '#FDE68A'};">
            <p style="font-size:12px;color:${zone.permanent ? '#DC2626' : '#D97706'};margin:0;font-weight:600;">
              ${zone.permanent ? '🔴 PERMANENTLY CONGESTED' : '🟡 TEMPORARY / PEAK HOURS'}
            </p>
            <p style="font-size:11px;color:#6B7280;margin:4px 0 0;">${zone.permanent ? 'Routes are auto-rerouted around this zone.' : 'Not a major concern for routing.'}</p>
          </div>
          <p style="font-size:11px;color:#6B7280;margin:6px 0 0;">📍 Impact radius: ${zone.radius}m</p>
        </div>
      `);

      const labelIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${color};color:white;padding:3px 8px;border-radius:5px;font-size:9px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${zone.permanent ? '🔴' : '🟡'} ${zone.level.toUpperCase()}</div>`,
        iconSize: [90, 20],
        iconAnchor: [45, 10],
      });

      congestionRef.current!.addLayer(circle);
      congestionRef.current!.addLayer(L.marker([zone.center.lat, zone.center.lng], { icon: labelIcon }));
    });
  }, [zones]);

  // Draw ambulance trails
  const updateTrails = useCallback(() => {
    const L = leafletRef.current;
    if (!L || !trailRef.current) return;
    trailRef.current.clearLayers();

    ambulances.forEach(amb => {
      if (amb.routeHistory.length < 2) return;
      if (trackingAmbulanceId && amb.id !== trackingAmbulanceId) return;

      const history = amb.routeHistory.slice(-50);
      if (history.length >= 2) {
        const trail = L.polyline(
          history.map(p => [p.lat, p.lng] as L.LatLngExpression),
          { color: '#6366F1', weight: 3, opacity: 0.65, dashArray: '4,8' }
        );
        trail.bindTooltip(`${amb.id} — movement trail`, { direction: 'top' });
        trailRef.current!.addLayer(trail);

        const startDot = L.circleMarker(
          [history[0].lat, history[0].lng] as L.LatLngExpression,
          { radius: 5, color: '#6366F1', fillColor: '#A5B4FC', fillOpacity: 1, weight: 2 }
        );
        trailRef.current!.addLayer(startDot);
      }
    });
  }, [ambulances, trackingAmbulanceId]);

  // Pan to tracked ambulance
  useEffect(() => {
    if (!mapRef.current || !trackingAmbulanceId) return;
    const amb = ambulances.find(a => a.id === trackingAmbulanceId);
    if (amb) mapRef.current.panTo([amb.location.lat, amb.location.lng], { animate: true, duration: 0.6 });
  }, [trackingAmbulanceId, ambulances]);

  // Focus on selected call
  useEffect(() => {
    if (!mapRef.current || !selectedCallId) return;
    const call = calls.find(c => c.id === selectedCallId);
    if (call) mapRef.current.setView([call.location.lat, call.location.lng], 13, { animate: true });
  }, [selectedCallId, calls]);

  useEffect(() => { updateStaticMarkers(); }, [updateStaticMarkers]);
  useEffect(() => { updateRoutes(); }, [updateRoutes]);
  useEffect(() => { updateCongestion(); }, [updateCongestion]);
  useEffect(() => { updateTrails(); }, [updateTrails]);

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 p-3 z-[999] text-xs max-w-[180px]">
        <p className="font-bold text-gray-700 mb-2 uppercase tracking-wider text-[10px]">Legend</p>
        <div className="space-y-1.5">
          {[
            { color: '#DC2626', shape: 'rounded-full', label: 'Critical Emergency', pulse: true },
            { color: '#EA580C', shape: 'rounded-full', label: 'High Priority' },
            { color: '#16A34A', shape: 'rounded-lg', label: 'Available Ambulance' },
            { color: '#DC2626', shape: 'rounded-lg', label: 'Active 🚨', pulse: true },
            { color: '#0D9488', shape: 'rounded-lg', label: 'To Hospital' },
            { color: '#0F766E', shape: 'rounded-md', label: 'Hospital 🏥' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-3.5 h-3.5 flex-shrink-0 ${item.shape} border-2 border-white shadow ${item.pulse ? 'animate-pulse' : ''}`} style={{ background: item.color }} />
              <span className="text-gray-600">{item.label}</span>
            </div>
          ))}
          <hr className="border-gray-200 my-1" />
          {[
            { color: '#DC2626', label: 'Emergency Route', dashed: true },
            { color: '#0D9488', label: 'Hospital Route', dashed: true },
            { color: '#6366F1', label: 'Amb Trail', dashed: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-5 flex-shrink-0" style={{ borderTop: `2px ${item.dashed ? 'dashed' : 'solid'} ${item.color}` }} />
              <span className="text-gray-600">{item.label}</span>
            </div>
          ))}
          <hr className="border-gray-200 my-1" />
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500/30 border border-red-500 flex-shrink-0" />
            <span className="text-gray-600">Permanent Congestion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-yellow-400/30 border border-yellow-400 flex-shrink-0" />
            <span className="text-gray-600">Temp Congestion</span>
          </div>
        </div>
      </div>

      {/* LIVE badge */}
      <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1.5 rounded-lg shadow-lg z-[999] flex items-center gap-2 text-xs font-bold">
        <div className="w-2 h-2 bg-white rounded-full animate-ping" />
        LIVE MAP
      </div>

      {/* Network badge */}
      <div className="absolute top-3 right-16 bg-white/90 text-gray-700 px-3 py-1.5 rounded-lg shadow z-[999] text-[10px] font-semibold border">
        🇮🇳 All India 108 Network
      </div>
    </div>
  );
}
