export interface LatLng {
  lat: number;
  lng: number;
}

export interface EmergencyCall {
  id: string;
  callerName: string;
  callerNumber: string;
  location: LatLng & { address: string };
  timestamp: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  status: 'pending' | 'dispatched' | 'en_route' | 'at_scene' | 'to_hospital' | 'completed';
  assignedAmbulance?: string;
  assignedHospital?: string;
  hospitalLocation?: LatLng;
  patientCount: number;
}

export interface AmbulanceUnit {
  id: string;
  driverName: string;
  vehicleNumber: string;
  location: LatLng;
  status: 'available' | 'dispatched' | 'en_route' | 'at_scene' | 'to_hospital' | 'returning' | 'maintenance';
  currentCallId?: string;
  type: 'basic' | 'advanced' | 'icu';
  routeHistory: LatLng[];
}

export interface HospitalInfo {
  id: string;
  name: string;
  location: LatLng;
  address: string;
  bedsAvailable: number;
  icuBeds: number;
  emergencyRoom: boolean;
  specialties: string[];
  phone: string;
  confirmed: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export interface CongestionZone {
  center: LatLng;
  radius: number;
  level: 'moderate' | 'heavy' | 'severe';
  label: string;
  permanent: boolean;
}
