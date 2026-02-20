import { useState, useMemo } from 'react';
import { Building2, Search, Filter, MapPin, Phone, Star, Activity, Bed, AlertCircle, ChevronDown, X } from 'lucide-react';

interface Hospital {
  id: string;
  name: string;
  type: 'government' | 'private';
  state: string;
  city: string;
  address: string;
  totalBeds: number;
  availableBeds: number;
  icuBeds: number;
  availableIcu: number;
  erAvailable: boolean;
  specialties: string[];
  phone: string;
  emergencyPhone: string;
  rating: number;
  distance?: number;
  traumaCenter: boolean;
  oxygenAvailable: boolean;
  bloodBank: boolean;
}

const hospitalsData: Hospital[] = [
  // Government Hospitals - All India
  { id: 'GOV001', name: 'AIIMS Bhubaneswar', type: 'government', state: 'Odisha', city: 'Bhubaneswar', address: 'Sijua, Khordha, Odisha - 751019', totalBeds: 950, availableBeds: 127, icuBeds: 127, availableIcu: 18, erAvailable: true, specialties: ['All Specialties', 'Cardiology', 'Trauma', 'Neurology'], phone: '+91 674 2476789', emergencyPhone: '+91 674 2476700', rating: 4.3, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV002', name: 'AIIMS Jodhpur', type: 'government', state: 'Rajasthan', city: 'Jodhpur', address: 'Basni Phase-II, Jodhpur, Rajasthan - 342005', totalBeds: 592, availableBeds: 77, icuBeds: 77, availableIcu: 12, erAvailable: true, specialties: ['All Specialties', 'Cardiology', 'Trauma', 'Neurology'], phone: '+91 291 2740741', emergencyPhone: '+91 291 2740700', rating: 4.2, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV003', name: 'AIIMS New Delhi', type: 'government', state: 'Delhi', city: 'New Delhi', address: 'Ansari Nagar, New Delhi - 110029', totalBeds: 2368, availableBeds: 295, icuBeds: 295, availableIcu: 42, erAvailable: true, specialties: ['All Specialties', 'Cardiology', 'Neurology', 'Trauma'], phone: '+91 11 26588500', emergencyPhone: '+91 11 26589393', rating: 4.5, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV004', name: 'AIIMS Patna', type: 'government', state: 'Bihar', city: 'Patna', address: 'Phulwari Sharif, Patna, Bihar - 801505', totalBeds: 793, availableBeds: 108, icuBeds: 108, availableIcu: 15, erAvailable: true, specialties: ['All Specialties', 'Trauma', 'Cardiology', 'Neurology'], phone: '+91 612 2451070', emergencyPhone: '+91 612 2451000', rating: 4.2, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV005', name: 'AIIMS Raipur', type: 'government', state: 'Chhattisgarh', city: 'Raipur', address: 'Tatibandh, Raipur, Chhattisgarh - 492099', totalBeds: 890, availableBeds: 118, icuBeds: 118, availableIcu: 22, erAvailable: true, specialties: ['All Specialties', 'Trauma', 'Cardiology', 'Neurology'], phone: '+91 771 2571828', emergencyPhone: '+91 771 2571800', rating: 4.1, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV006', name: 'PGIMER Chandigarh', type: 'government', state: 'Chandigarh', city: 'Chandigarh', address: 'Sector 12, Chandigarh - 160012', totalBeds: 2010, availableBeds: 245, icuBeds: 245, availableIcu: 38, erAvailable: true, specialties: ['All Specialties', 'Trauma', 'Cardiology', 'Neurosurgery'], phone: '+91 172 2747585', emergencyPhone: '+91 172 2747585', rating: 4.6, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV007', name: 'SGPGI Lucknow', type: 'government', state: 'Uttar Pradesh', city: 'Lucknow', address: 'Raebareli Road, Lucknow, UP - 226014', totalBeds: 1090, availableBeds: 142, icuBeds: 142, availableIcu: 25, erAvailable: true, specialties: ['All Specialties', 'Gastroenterology', 'Nephrology', 'Neurology'], phone: '+91 522 2494401', emergencyPhone: '+91 522 2494444', rating: 4.4, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV008', name: 'NIMHANS Bangalore', type: 'government', state: 'Karnataka', city: 'Bangalore', address: 'Hosur Road, Bangalore, Karnataka - 560029', totalBeds: 1520, availableBeds: 185, icuBeds: 185, availableIcu: 32, erAvailable: true, specialties: ['Neurology', 'Neurosurgery', 'Psychiatry', 'Emergency'], phone: '+91 80 26699000', emergencyPhone: '+91 80 26699000', rating: 4.5, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV009', name: 'Safdarjung Hospital', type: 'government', state: 'Delhi', city: 'New Delhi', address: 'Safdarjung Enclave, New Delhi - 110029', totalBeds: 1500, availableBeds: 198, icuBeds: 198, availableIcu: 28, erAvailable: true, specialties: ['Trauma', 'Burns', 'Emergency', 'Orthopedics'], phone: '+91 11 26730000', emergencyPhone: '+91 11 26730100', rating: 4.1, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV010', name: 'KEM Hospital Mumbai', type: 'government', state: 'Maharashtra', city: 'Mumbai', address: 'Acharya Donde Marg, Parel, Mumbai - 400012', totalBeds: 1850, availableBeds: 225, icuBeds: 225, availableIcu: 35, erAvailable: true, specialties: ['Trauma', 'Emergency', 'Burns', 'Plastic Surgery'], phone: '+91 22 24136051', emergencyPhone: '+91 22 24136000', rating: 4.3, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV011', name: 'Madras Medical College', type: 'government', state: 'Tamil Nadu', city: 'Chennai', address: 'EVR Periyar Salai, Chennai - 600003', totalBeds: 2100, availableBeds: 268, icuBeds: 268, availableIcu: 42, erAvailable: true, specialties: ['All Specialties', 'Trauma', 'Cardiology', 'Neurology'], phone: '+91 44 25305151', emergencyPhone: '+91 44 25305100', rating: 4.2, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV012', name: 'Government Rajaji Hospital', type: 'government', state: 'Tamil Nadu', city: 'Madurai', address: 'Panagal Road, Madurai, TN - 625020', totalBeds: 1200, availableBeds: 156, icuBeds: 156, availableIcu: 24, erAvailable: true, specialties: ['Emergency', 'Trauma', 'General Surgery', 'Burns'], phone: '+91 452 2532535', emergencyPhone: '+91 452 2532500', rating: 4.0, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV013', name: 'GKND Hospital', type: 'government', state: 'Tamil Nadu', city: 'Viruthunagar', address: 'Srivilliputhur Road, Viruthunagar - 626001', totalBeds: 350, availableBeds: 45, icuBeds: 45, availableIcu: 8, erAvailable: true, specialties: ['Emergency', 'General Surgery', 'Orthopedics', 'Pediatrics'], phone: '+91 4562 243100', emergencyPhone: '+91 4562 243100', rating: 3.9, traumaCenter: false, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV014', name: 'Sivakasi GH', type: 'government', state: 'Tamil Nadu', city: 'Sivakasi', address: 'Hospital Road, Sivakasi, TN - 626123', totalBeds: 280, availableBeds: 38, icuBeds: 38, availableIcu: 6, erAvailable: true, specialties: ['Emergency', 'Burns', 'Trauma', 'General Medicine'], phone: '+91 4562 220100', emergencyPhone: '+91 4562 220100', rating: 3.8, traumaCenter: false, oxygenAvailable: true, bloodBank: false },
  { id: 'GOV015', name: 'Tenkasi GH', type: 'government', state: 'Tamil Nadu', city: 'Tenkasi', address: 'Main Road, Tenkasi, TN - 627811', totalBeds: 320, availableBeds: 42, icuBeds: 42, availableIcu: 7, erAvailable: true, specialties: ['Emergency', 'General Medicine', 'Trauma', 'Obstetrics'], phone: '+91 4633 280100', emergencyPhone: '+91 4633 280100', rating: 3.9, traumaCenter: false, oxygenAvailable: true, bloodBank: true },
  
  // Private Hospitals - All India
  { id: 'PVT001', name: 'Alchemist Hospital Panchkula', type: 'private', state: 'Haryana', city: 'Panchkula', address: 'Sector 53, Panchkula, Haryana - 134109', totalBeds: 250, availableBeds: 45, icuBeds: 45, availableIcu: 12, erAvailable: true, specialties: ['Cardiology', 'Orthopedics', 'Emergency', 'Neurology'], phone: '+91 172 2581640', emergencyPhone: '+91 172 2581600', rating: 4.2, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT002', name: 'Amala Hospital Tenkasi', type: 'private', state: 'Tamil Nadu', city: 'Tenkasi', address: 'Courtallam Road, Tenkasi - 627811', totalBeds: 40, availableBeds: 8, icuBeds: 8, availableIcu: 2, erAvailable: true, specialties: ['General Surgery', 'Emergency', 'Internal Medicine'], phone: '+91 4633 456789', emergencyPhone: '+91 4633 456700', rating: 3.9, traumaCenter: false, oxygenAvailable: true, bloodBank: false },
  { id: 'PVT003', name: 'Amar Singh Hospital Jammu', type: 'private', state: 'Jammu & Kashmir', city: 'Jammu', address: 'Gandhi Nagar, Jammu - 180004', totalBeds: 200, availableBeds: 38, icuBeds: 38, availableIcu: 9, erAvailable: true, specialties: ['Cardiology', 'Orthopedics', 'Emergency', 'General Surgery'], phone: '+91 191 2470000', emergencyPhone: '+91 191 2470100', rating: 4.1, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT004', name: 'Amrita Institute Kochi', type: 'private', state: 'Kerala', city: 'Kochi', address: 'AIMS Ponekkara, Kochi - 682041', totalBeds: 1183, availableBeds: 197, icuBeds: 197, availableIcu: 35, erAvailable: true, specialties: ['All Specialties', 'Cardiology', 'Neurosurgery', 'Transplant'], phone: '+91 484 2851234', emergencyPhone: '+91 484 2851200', rating: 4.8, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT005', name: 'Andhra Hospital Vijayawada', type: 'private', state: 'Andhra Pradesh', city: 'Vijayawada', address: 'Labbaipeta, Vijayawada, AP - 520010', totalBeds: 250, availableBeds: 45, icuBeds: 45, availableIcu: 11, erAvailable: true, specialties: ['Cardiology', 'Neurology', 'Orthopedics', 'Emergency'], phone: '+91 866 2480000', emergencyPhone: '+91 866 2480100', rating: 4.3, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT006', name: 'Apollo Hospitals Chennai', type: 'private', state: 'Tamil Nadu', city: 'Chennai', address: '21 Greams Lane, Chennai - 600006', totalBeds: 450, availableBeds: 68, icuBeds: 68, availableIcu: 18, erAvailable: true, specialties: ['Cardiology', 'Oncology', 'Neurology', 'Transplant'], phone: '+91 44 28293333', emergencyPhone: '+91 44 28290200', rating: 4.7, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT007', name: 'Apollo Hospitals Sivakasi', type: 'private', state: 'Tamil Nadu', city: 'Sivakasi', address: 'Viruthunagar Road, Sivakasi - 626123', totalBeds: 120, availableBeds: 22, icuBeds: 22, availableIcu: 6, erAvailable: true, specialties: ['Cardiology', 'Orthopedics', 'Emergency', 'General Surgery'], phone: '+91 4562 280000', emergencyPhone: '+91 4562 280100', rating: 4.4, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT008', name: 'Fortis Hospital Bangalore', type: 'private', state: 'Karnataka', city: 'Bangalore', address: '154/9 Bannerghatta Road, Bangalore - 560076', totalBeds: 280, availableBeds: 52, icuBeds: 52, availableIcu: 14, erAvailable: true, specialties: ['Emergency Medicine', 'ICU', 'General Surgery', 'Neurosurgery'], phone: '+91 80 49292929', emergencyPhone: '+91 80 49292900', rating: 4.5, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT009', name: 'Max Hospital Saket', type: 'private', state: 'Delhi', city: 'New Delhi', address: '1, Press Enclave Road, Saket, Delhi - 110017', totalBeds: 600, availableBeds: 95, icuBeds: 95, availableIcu: 22, erAvailable: true, specialties: ['Oncology', 'Cardiology', 'Neurology', 'Transplant'], phone: '+91 11 26515050', emergencyPhone: '+91 11 26515000', rating: 4.6, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT010', name: 'Medanta Medicity Gurugram', type: 'private', state: 'Haryana', city: 'Gurugram', address: 'Sector 38, Gurugram, Haryana - 122001', totalBeds: 1250, availableBeds: 185, icuBeds: 185, availableIcu: 42, erAvailable: true, specialties: ['All Specialties', 'Cardiology', 'Oncology', 'Transplant'], phone: '+91 124 4141414', emergencyPhone: '+91 124 4141400', rating: 4.7, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT011', name: 'Manipal Hospital Bangalore', type: 'private', state: 'Karnataka', city: 'Bangalore', address: '98, HAL Airport Road, Bangalore - 560017', totalBeds: 600, availableBeds: 98, icuBeds: 98, availableIcu: 25, erAvailable: true, specialties: ['Cardiology', 'Neurology', 'Oncology', 'Orthopedics'], phone: '+91 80 25023344', emergencyPhone: '+91 80 25023300', rating: 4.5, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT012', name: 'Kokilaben Hospital Mumbai', type: 'private', state: 'Maharashtra', city: 'Mumbai', address: 'Rao Saheb Achutrao Patwardhan Marg, Mumbai - 400053', totalBeds: 750, availableBeds: 125, icuBeds: 125, availableIcu: 32, erAvailable: true, specialties: ['Oncology', 'Cardiology', 'Neurology', 'Transplant'], phone: '+91 22 42696969', emergencyPhone: '+91 22 42696900', rating: 4.6, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT013', name: 'Yashoda Hospitals Hyderabad', type: 'private', state: 'Telangana', city: 'Hyderabad', address: 'Raj Bhavan Road, Somajiguda, Hyderabad - 500082', totalBeds: 450, availableBeds: 72, icuBeds: 72, availableIcu: 18, erAvailable: true, specialties: ['Cardiology', 'Neurology', 'Emergency', 'Transplant'], phone: '+91 40 45674567', emergencyPhone: '+91 40 45674500', rating: 4.4, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT014', name: 'Narayana Health Bangalore', type: 'private', state: 'Karnataka', city: 'Bangalore', address: '258/A, Bommasandra Industrial Area, Bangalore - 560099', totalBeds: 1000, availableBeds: 165, icuBeds: 165, availableIcu: 38, erAvailable: true, specialties: ['Cardiology', 'Oncology', 'Orthopedics', 'Neurology'], phone: '+91 80 71222222', emergencyPhone: '+91 80 71222200', rating: 4.5, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT015', name: 'CARE Hospitals Hyderabad', type: 'private', state: 'Telangana', city: 'Hyderabad', address: 'Road No 1, Banjara Hills, Hyderabad - 500034', totalBeds: 350, availableBeds: 58, icuBeds: 58, availableIcu: 15, erAvailable: true, specialties: ['Cardiology', 'Neurology', 'Emergency', 'Gastroenterology'], phone: '+91 40 61666666', emergencyPhone: '+91 40 61666600', rating: 4.4, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
];

const indianStates = [
  'All States', 'Andhra Pradesh', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Delhi', 'Haryana', 'Jammu & Kashmir',
  'Karnataka', 'Kerala', 'Maharashtra', 'Odisha', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh'
];

import type { AmbulanceUnit } from '../types';

interface HospitalDirectoryProps {
  ambulances: AmbulanceUnit[];
}

export default function HospitalDirectory({ ambulances }: HospitalDirectoryProps) {
  // NOTE: This directory uses a light, card-based layout similar to Option B screenshot

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All States');
  const [hospitalType, setHospitalType] = useState<'all' | 'government' | 'private'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'beds' | 'rating'>('name');
  const [expandedHospital, setExpandedHospital] = useState<string | null>(null);

  const filteredHospitals = useMemo(() => {
    return hospitalsData
      .filter(hosp => {
        const matchesSearch =
          searchQuery === '' ||
          hosp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hosp.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hosp.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hosp.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesState = selectedState === 'All States' || hosp.state === selectedState;
        const matchesType = hospitalType === 'all' || hosp.type === hospitalType;

        return matchesSearch && matchesState && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'beds') return b.availableBeds - a.availableBeds;
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0;
      });
  }, [searchQuery, selectedState, hospitalType, sortBy]);

  const governmentHospitals = filteredHospitals.filter(h => h.type === 'government');
  const privateHospitals = filteredHospitals.filter(h => h.type === 'private');

  // Ambulance statistics (all India)
  const totalAmbulances = ambulances.length;
  const availableAmbulances = ambulances.filter(a => a.status === 'available').length;
  const icuAmbulances = ambulances.filter(a => a.type === 'icu').length;

  const totalBeds = hospitalsData.reduce((sum, h) => sum + h.totalBeds, 0);
  const totalAvailableBeds = hospitalsData.reduce((sum, h) => sum + h.availableBeds, 0);
  const totalIcuBeds = hospitalsData.reduce((sum, h) => sum + h.icuBeds, 0);
  const totalAvailableIcu = hospitalsData.reduce((sum, h) => sum + h.availableIcu, 0);
  const bedsFullCount = hospitalsData.filter(h => h.availableBeds === 0).length;

  const getBedStatus = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage > 30) return { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', label: 'LOW' };
    if (percentage > 15) return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', label: 'MEDIUM' };
    if (percentage > 0) return { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', label: 'HIGH' };
    return { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', label: 'CRITICAL' };
  };

  const HospitalCard = ({ hosp, rank }: { hosp: Hospital; rank: number }) => {
    const bedStatus = getBedStatus(hosp.availableBeds, hosp.totalBeds);
    const icuStatus = getBedStatus(hosp.availableIcu, hosp.icuBeds);
    const isExpanded = expandedHospital === hosp.id;

    return (
      <div
        className={`group relative rounded-xl border transition-all duration-300 overflow-hidden bg-white shadow-sm hover:shadow-md ${
          hosp.type === 'government'
            ? 'border-blue-200 hover:border-blue-400'
            : 'border-purple-200 hover:border-purple-400'
        }`}
      >
        {/* Rank Badge */}
        <div className={`absolute top-3 right-3 z-10 px-2 py-1 rounded-md text-[10px] font-bold ${
          rank === 1 ? 'bg-yellow-500 text-black' : rank === 2 ? 'bg-gray-400 text-black' : rank === 3 ? 'bg-orange-600 text-white' : 'bg-slate-700 text-gray-300'
        }`}>
          #{rank} NEAREST
        </div>

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className={`p-2.5 rounded-xl ${
                hosp.type === 'government' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-slate-900 truncate pr-16">{hosp.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                <p className="text-xs text-slate-500 truncate">
                  {hosp.city}, {hosp.state}
                </p>
              </div>
            </div>
          </div>

          {/* Bed Stats */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div
              className={`rounded-lg p-2 text-center border ${bedStatus.bg.replace('bg-', 'bg-').replace('/20', '/40')} ${
                bedStatus.border
              }`}
            >
              <p className="text-[9px] text-slate-500 uppercase">Beds</p>
              <p className={`text-base font-extrabold ${bedStatus.color.replace('text-', 'text-')}`}>
                {hosp.availableBeds}
              </p>
              <p className="text-[8px] text-slate-400">/{hosp.totalBeds}</p>
            </div>
            <div
              className={`rounded-lg p-2 text-center border ${icuStatus.bg.replace('bg-', 'bg-').replace('/20', '/40')} ${
                icuStatus.border
              }`}
            >
              <p className="text-[9px] text-slate-500 uppercase">ICU</p>
              <p className={`text-base font-extrabold ${icuStatus.color}`}>{hosp.availableIcu}</p>
              <p className="text-[8px] text-slate-400">/{hosp.icuBeds}</p>
            </div>
            <div
              className={`rounded-lg p-2 text-center border ${
                hosp.erAvailable
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <p className="text-[9px] text-slate-500 uppercase">ER</p>
              <p
                className={`text-base font-extrabold ${
                  hosp.erAvailable ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {hosp.erAvailable ? '24/7' : 'No'}
              </p>
            </div>
            <div className="rounded-lg p-2 text-center border bg-slate-50 border-slate-200">
              <p className="text-[9px] text-slate-500 uppercase">Rating</p>
              <div className="flex items-center justify-center gap-0.5">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <p className="text-base font-extrabold text-slate-800">{hosp.rating}</p>
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div className="flex flex-wrap gap-1 mb-3">
            {hosp.specialties.slice(0, 4).map((spec, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-slate-50 text-slate-700 rounded text-[9px] border border-slate-200"
              >
                {spec}
              </span>
            ))}
          </div>

          {/* Contact */}
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-300">{hosp.phone}</span>
          </div>

          {/* Expand Button */}
          <button
            onClick={() => setExpandedHospital(isExpanded ? null : hosp.id)}
            className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              hosp.type === 'government'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isExpanded ? 'Show Less' : 'View Details'}
            <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2 animate-in">
              <p className="text-xs text-gray-400"><strong className="text-gray-300">Address:</strong> {hosp.address}</p>
              <p className="text-xs text-gray-400"><strong className="text-gray-300">Emergency:</strong> {hosp.emergencyPhone}</p>
              <div className="flex flex-wrap gap-2">
                {hosp.traumaCenter && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[9px] border border-red-500/30">🚨 Trauma Center</span>}
                {hosp.oxygenAvailable && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[9px] border border-blue-500/30">💨 Oxygen</span>}
                {hosp.bloodBank && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[9px] border border-purple-500/30">🩸 Blood Bank</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow border border-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 border-b border-blue-500/40 rounded-t-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 p-2.5 rounded-xl">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white">Hospital Directory</h1>
                <p className="text-xs text-gray-400">All India Hospital Network — Real-time Bed Availability</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase">Total Hospitals</p>
                <p className="text-2xl font-extrabold text-white">{hospitalsData.length}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase">Ambulances (All India)</p>
                <p className="text-sm font-bold text-emerald-300">
                  {availableAmbulances} available / {totalAmbulances} total
                </p>
                <p className="text-[10px] text-emerald-200 mt-0.5">ICU Units: {icuAmbulances}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 bg-sky-50 border-b border-sky-200">
        <div className="flex items-center gap-6 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-slate-700">Government: <strong className="text-slate-900">{hospitalsData.filter(h => h.type === 'government').length}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            <span className="text-slate-700">Private: <strong className="text-slate-900">{hospitalsData.filter(h => h.type === 'private').length}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Bed className="w-3 h-3 text-emerald-500" />
            <span className="text-slate-700">Total Beds: <strong className="text-emerald-600">{totalAvailableBeds.toLocaleString()}</strong> / {totalBeds.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-sky-500" />
            <span className="text-slate-700">Total ICU: <strong className="text-sky-600">{totalAvailableIcu.toLocaleString()}</strong> / {totalIcuBeds.toLocaleString()}</span>
          </div>
          {bedsFullCount > 0 && (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3 text-red-500" />
              <span className="text-xs text-red-600">Beds Full: <strong>{bedsFullCount}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search hospital name, city, district, state, pincode..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 focus:border-sky-500/70"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1 border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-2" />
            <span className="text-xs text-slate-600 pr-2">View:</span>
            <button
              onClick={() => setHospitalType('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${hospitalType === 'all' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              Government + Private
            </button>
            <button
              onClick={() => setHospitalType('government')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${hospitalType === 'government' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              Government Only
            </button>
            <button
              onClick={() => setHospitalType('private')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${hospitalType === 'private' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              Private Only
            </button>
          </div>

          <select
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
          >
            {indianStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/70"
          >
            <option value="name">Sort: A-Z</option>
            <option value="beds">Sort: Available Beds</option>
            <option value="rating">Sort: Rating</option>
          </select>

          <button
            onClick={() => { setSearchQuery(''); setSelectedState('All States'); setHospitalType('all'); setSortBy('name'); }}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2"
          >
            Reset
          </button>
        </div>

        {/* Results Count */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Total</span>
          <span className="font-bold text-white">{filteredHospitals.length}</span>
          <span className="text-gray-400">hospitals shown</span>
          <span className="text-gray-600">|</span>
          <span className="text-blue-400">Government: <strong>{governmentHospitals.length}</strong></span>
          <span className="text-gray-600">|</span>
          <span className="text-purple-400">Private: <strong>{privateHospitals.length}</strong></span>
        </div>
      </div>

      {/* Hospital Grid */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Government Hospitals */}
          {(hospitalType === 'all' || hospitalType === 'government') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">Government Hospitals</span>
                  <span className="bg-blue-400 text-blue-950 text-[10px] px-2 py-0.5 rounded-full font-bold">{governmentHospitals.length}</span>
                </div>
              </div>
              {governmentHospitals.map((hosp, idx) => (
                <HospitalCard key={hosp.id} hosp={hosp} rank={idx + 1} />
              ))}
              {governmentHospitals.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No government hospitals found</p>
                </div>
              )}
            </div>
          )}

          {/* Private Hospitals */}
          {(hospitalType === 'all' || hospitalType === 'private') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-purple-600 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">Private Hospitals</span>
                  <span className="bg-purple-400 text-purple-950 text-[10px] px-2 py-0.5 rounded-full font-bold">{privateHospitals.length}</span>
                </div>
              </div>
              {privateHospitals.map((hosp, idx) => (
                <HospitalCard key={hosp.id} hosp={hosp} rank={idx + 1} />
              ))}
              {privateHospitals.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No private hospitals found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
