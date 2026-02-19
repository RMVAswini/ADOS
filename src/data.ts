import type { EmergencyCall, AmbulanceUnit, HospitalInfo, CongestionZone } from './types';

// India-wide hospitals across many cities/districts
export const initialHospitals: HospitalInfo[] = [
  // Tamil Nadu
  { id: 'H001', name: 'Apollo Hospitals Chennai', location: { lat: 13.0550, lng: 80.2089 }, address: '22, Greams Rd, Thousand Lights, Chennai', bedsAvailable: 15, icuBeds: 4, emergencyRoom: true, specialties: ['Cardiology', 'Neurology', 'Trauma', 'Orthopedics'], phone: '+91 44 2829 3333', confirmed: false },
  { id: 'H002', name: 'Government Rajaji Hospital', location: { lat: 9.9231, lng: 78.1198 }, address: 'Panagal Rd, Madurai, Tamil Nadu', bedsAvailable: 30, icuBeds: 8, emergencyRoom: true, specialties: ['Emergency', 'Trauma', 'General Surgery', 'Burns'], phone: '+91 452 253 2535', confirmed: false },
  { id: 'H003', name: 'GKND Hospital Viruthunagar', location: { lat: 9.5775, lng: 77.9619 }, address: 'Srivilliputhur Rd, Viruthunagar, TN', bedsAvailable: 12, icuBeds: 3, emergencyRoom: true, specialties: ['Emergency', 'General Surgery', 'Orthopedics', 'Pediatrics'], phone: '+91 4562 243 100', confirmed: false },
  { id: 'H004', name: 'Sivakasi General Hospital', location: { lat: 9.4540, lng: 77.7998 }, address: 'Hospital Rd, Sivakasi, Tamil Nadu', bedsAvailable: 18, icuBeds: 5, emergencyRoom: true, specialties: ['Emergency', 'Burns', 'Trauma', 'General Medicine'], phone: '+91 4562 220 100', confirmed: false },
  { id: 'H005', name: 'Rajapalayam Medical Centre', location: { lat: 9.4532, lng: 77.5566 }, address: 'Gandhi Nagar, Rajapalayam, TN', bedsAvailable: 10, icuBeds: 2, emergencyRoom: true, specialties: ['General Surgery', 'Emergency', 'Medicine'], phone: '+91 4563 220 777', confirmed: false },
  { id: 'H006', name: 'Tenkasi District Hospital', location: { lat: 8.9602, lng: 77.3156 }, address: 'Main Rd, Tenkasi, Tamil Nadu', bedsAvailable: 22, icuBeds: 6, emergencyRoom: true, specialties: ['Emergency', 'General Medicine', 'Trauma', 'Obstetrics'], phone: '+91 4633 280 100', confirmed: false },
  { id: 'H007', name: 'Coimbatore Medical College', location: { lat: 11.0168, lng: 76.9558 }, address: 'Trichy Rd, Coimbatore, Tamil Nadu', bedsAvailable: 40, icuBeds: 12, emergencyRoom: true, specialties: ['Neurosurgery', 'Cardiology', 'Trauma', 'Oncology'], phone: '+91 422 230 1200', confirmed: false },
  { id: 'H008', name: 'Tirunelveli Medical College', location: { lat: 8.7139, lng: 77.7567 }, address: 'High Ground Rd, Tirunelveli, TN', bedsAvailable: 25, icuBeds: 7, emergencyRoom: true, specialties: ['Emergency', 'Trauma', 'Cardiology', 'Nephrology'], phone: '+91 462 257 2344', confirmed: false },

  // Karnataka
  { id: 'H009', name: 'Fortis Hospital Bangalore', location: { lat: 12.9022, lng: 77.5962 }, address: '154/9, Bannerghatta Rd, Bangalore', bedsAvailable: 8, icuBeds: 3, emergencyRoom: true, specialties: ['Emergency Medicine', 'ICU', 'General Surgery', 'Neurosurgery'], phone: '+91 80 4929 2929', confirmed: false },
  { id: 'H010', name: 'NIMHANS Bangalore', location: { lat: 12.9407, lng: 77.5938 }, address: 'Hosur Rd, Bangalore, Karnataka', bedsAvailable: 20, icuBeds: 6, emergencyRoom: true, specialties: ['Neurology', 'Psychiatry', 'Neurosurgery', 'Emergency'], phone: '+91 80 2669 9000', confirmed: false },

  // Maharashtra
  { id: 'H011', name: 'KEM Hospital Mumbai', location: { lat: 19.0005, lng: 72.8416 }, address: 'Acharya Donde Marg, Parel, Mumbai', bedsAvailable: 25, icuBeds: 8, emergencyRoom: true, specialties: ['Trauma', 'Emergency', 'Burns', 'Plastic Surgery'], phone: '+91 22 2413 6051', confirmed: false },
  { id: 'H012', name: 'Sassoon General Hospital Pune', location: { lat: 18.5196, lng: 73.8553 }, address: 'Bund Garden Rd, Pune, Maharashtra', bedsAvailable: 35, icuBeds: 10, emergencyRoom: true, specialties: ['Emergency', 'Cardiology', 'Trauma', 'Neurology'], phone: '+91 20 2612 8000', confirmed: false },

  // Delhi/NCR
  { id: 'H013', name: 'AIIMS New Delhi', location: { lat: 28.5672, lng: 77.2100 }, address: 'Sri Aurobindo Marg, Ansari Nagar, Delhi', bedsAvailable: 12, icuBeds: 5, emergencyRoom: true, specialties: ['Cardiology', 'Oncology', 'Emergency', 'Pediatrics'], phone: '+91 11 2658 8500', confirmed: false },
  { id: 'H014', name: 'Safdarjung Hospital Delhi', location: { lat: 28.5688, lng: 77.2067 }, address: 'Safdarjung Enclave, New Delhi', bedsAvailable: 20, icuBeds: 7, emergencyRoom: true, specialties: ['Trauma', 'Burns', 'Emergency', 'Orthopedics'], phone: '+91 11 2673 0000', confirmed: false },

  // West Bengal
  { id: 'H015', name: 'AMRI Hospitals Kolkata', location: { lat: 22.5186, lng: 88.3612 }, address: 'JC-16 & 17, Salt Lake, Kolkata', bedsAvailable: 20, icuBeds: 7, emergencyRoom: true, specialties: ['Multi-specialty', 'Trauma', 'Neurology', 'Cardiology'], phone: '+91 33 4066 6666', confirmed: false },

  // Telangana
  { id: 'H016', name: 'Yashoda Hospitals Hyderabad', location: { lat: 17.4239, lng: 78.4738 }, address: 'Raj Bhavan Rd, Somajiguda, Hyderabad', bedsAvailable: 16, icuBeds: 5, emergencyRoom: true, specialties: ['Cardiology', 'Neurology', 'Emergency', 'Transplant'], phone: '+91 40 4567 4567', confirmed: false },

  // Gujarat
  { id: 'H017', name: 'Civil Hospital Ahmedabad', location: { lat: 23.0395, lng: 72.5822 }, address: 'Asarwa, Ahmedabad, Gujarat', bedsAvailable: 28, icuBeds: 9, emergencyRoom: true, specialties: ['Emergency', 'Trauma', 'Cardiology', 'Burns'], phone: '+91 79 2268 0000', confirmed: false },

  // Kerala
  { id: 'H018', name: 'Medical Trust Hospital Kochi', location: { lat: 9.9816, lng: 76.2999 }, address: 'M.G. Road, Ernakulam, Kochi', bedsAvailable: 14, icuBeds: 4, emergencyRoom: true, specialties: ['Cardiology', 'Orthopedics', 'Emergency', 'Neurology'], phone: '+91 484 235 8001', confirmed: false },

  // Uttar Pradesh
  { id: 'H019', name: 'KGMU Lucknow', location: { lat: 26.8682, lng: 80.9227 }, address: 'Shah Mina Rd, Lucknow, UP', bedsAvailable: 30, icuBeds: 10, emergencyRoom: true, specialties: ['Emergency', 'Trauma', 'Cardiology', 'Nephrology'], phone: '+91 522 225 7540', confirmed: false },

  // Rajasthan
  { id: 'H020', name: 'SMS Hospital Jaipur', location: { lat: 26.9124, lng: 75.8008 }, address: 'JLN Marg, Jaipur, Rajasthan', bedsAvailable: 22, icuBeds: 6, emergencyRoom: true, specialties: ['Trauma', 'Emergency', 'Cardiology', 'Orthopedics'], phone: '+91 141 256 0291', confirmed: false },
];

export const initialAmbulances: AmbulanceUnit[] = [
  { id: 'AMB-TN01', driverName: 'Suresh Yadav', vehicleNumber: 'TN-59-AM-2024', location: { lat: 13.0550, lng: 80.2089 }, status: 'en_route', currentCallId: 'EMR-2024-0001', type: 'advanced', routeHistory: [{ lat: 13.0540, lng: 80.2080 }, { lat: 13.0545, lng: 80.2084 }, { lat: 13.0550, lng: 80.2089 }] },
  { id: 'AMB-TN02', driverName: 'Murugan Raja', vehicleNumber: 'TN-59-AM-2025', location: { lat: 9.5800, lng: 77.9650 }, status: 'available', type: 'icu', routeHistory: [] },
  { id: 'AMB-TN03', driverName: 'Selvam K', vehicleNumber: 'TN-59-AM-2026', location: { lat: 9.4550, lng: 77.8010 }, status: 'available', type: 'basic', routeHistory: [] },
  { id: 'AMB-KA01', driverName: 'Ramesh Singh', vehicleNumber: 'KA-01-AM-2025', location: { lat: 12.9022, lng: 77.5962 }, status: 'dispatched', currentCallId: 'EMR-2024-0002', type: 'icu', routeHistory: [{ lat: 12.9010, lng: 77.5950 }, { lat: 12.9022, lng: 77.5962 }] },
  { id: 'AMB-MH01', driverName: 'Vikram Sharma', vehicleNumber: 'MH-01-AM-2026', location: { lat: 19.0760, lng: 72.8777 }, status: 'available', type: 'icu', routeHistory: [] },
  { id: 'AMB-DL01', driverName: 'Pradeep Kumar', vehicleNumber: 'DL-01-AM-2027', location: { lat: 28.5672, lng: 77.2100 }, status: 'available', type: 'basic', routeHistory: [] },
  { id: 'AMB-WB01', driverName: 'Neha Verma', vehicleNumber: 'WB-01-AM-2028', location: { lat: 22.5186, lng: 88.3612 }, status: 'available', type: 'advanced', routeHistory: [] },
  { id: 'AMB-TS01', driverName: 'Arun Deshmukh', vehicleNumber: 'TS-01-AM-2029', location: { lat: 17.4239, lng: 78.4738 }, status: 'maintenance', type: 'basic', routeHistory: [] },
];

export const initialCalls: EmergencyCall[] = [
  {
    id: 'EMR-2024-0001',
    callerName: 'Rajesh Kumar',
    callerNumber: '+91 98765 43210',
    location: { lat: 13.0550, lng: 80.2089, address: 'Anna Salai, Chennai, Tamil Nadu' },
    timestamp: new Date(Date.now() - 300000),
    severity: 'critical',
    description: 'Major road accident — multiple vehicle collision, 3 injured',
    status: 'en_route',
    assignedAmbulance: 'AMB-TN01',
    patientCount: 3,
  },
  {
    id: 'EMR-2024-0002',
    callerName: 'Priya Sharma',
    callerNumber: '+91 98765 12345',
    location: { lat: 12.9716, lng: 77.5946, address: 'MG Road, Bangalore, Karnataka' },
    timestamp: new Date(Date.now() - 600000),
    severity: 'high',
    description: 'Severe chest pain — possible cardiac arrest in elderly male',
    status: 'dispatched',
    assignedAmbulance: 'AMB-KA01',
    patientCount: 1,
  },
  {
    id: 'EMR-2024-0003',
    callerName: 'Amit Patel',
    callerNumber: '+91 91234 56789',
    location: { lat: 19.0760, lng: 72.8777, address: 'Bandra, Mumbai, Maharashtra' },
    timestamp: new Date(Date.now() - 900000),
    severity: 'medium',
    description: 'Fall from height — suspected fracture',
    status: 'completed',
    patientCount: 1,
  },
];

// Permanent congestion zones across India
export const congestionZones: CongestionZone[] = [
  { center: { lat: 13.0827, lng: 80.2707 }, radius: 700, level: 'severe', label: 'Chennai Central — Always Congested', permanent: true },
  { center: { lat: 12.9716, lng: 77.5946 }, radius: 600, level: 'heavy', label: 'Bangalore MG Road — Heavy Traffic', permanent: true },
  { center: { lat: 19.0760, lng: 72.8777 }, radius: 500, level: 'moderate', label: 'Mumbai CST — Peak Hours', permanent: false },
  { center: { lat: 28.7041, lng: 77.1025 }, radius: 450, level: 'moderate', label: 'Delhi Connaught Place — Intermittent', permanent: false },
  { center: { lat: 22.5726, lng: 88.3639 }, radius: 550, level: 'heavy', label: 'Kolkata Park Street — Always Busy', permanent: true },
  { center: { lat: 9.9312, lng: 76.2673 }, radius: 400, level: 'moderate', label: 'Kochi MG Road — Moderate', permanent: false },
  { center: { lat: 17.3850, lng: 78.4867 }, radius: 500, level: 'heavy', label: 'Hyderabad Hitech City — Heavy', permanent: true },
  { center: { lat: 9.5775, lng: 77.9619 }, radius: 250, level: 'moderate', label: 'Viruthunagar Town Center', permanent: false },
];
