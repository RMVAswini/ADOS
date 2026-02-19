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
  // Government Hospitals - North India
  { id: 'GOV001', name: 'AIIMS Bhubaneswar', type: 'government', state: 'Odisha', city: 'Bhubaneswar', address: 'Sijua, Khordha, Odisha - 751019', totalBeds: 950, availableBeds: 127, icuBeds: 127, availableIcu: 18, erAvailable: true, specialties: ['All Specialties', 'Cardiology', 'Trauma', 'Neurology'], phone: '+91 674 2476789', emergencyPhone: '+91 674 2476700', rating: 4.3, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV002', name: 'AIIMS Jodhpur', type: 'government', state: 'Rajasthan', city: 'Jodhpur', address: 'Basni Phase-II, Jodhpur, Rajasthan - 342005', totalBeds: 592, availableBeds: 77, icuBeds: 77, availableIcu: 12, erAvailable: true, specialties: ['All Specialties', 'Cardiology', 'Trauma', 'Neurology'], phone: '+91 291 2740741', emergencyPhone: '+91 291 2740700', rating: 4.2, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV003', name: 'AIIMS New Delhi', type: 'government', state: 'Delhi', city: 'New Delhi', address: 'Ansari Nagar, New Delhi - 110029', totalBeds: 2368, availableBeds: 295, icuBeds: 295, availableIcu: 42, erAvailable: true, specialties: ['All Specialties', 'Cardiology', 'Neurology', 'Trauma'], phone: '+91 11 26588500', emergencyPhone: '+91 11 26589393', rating: 4.5, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV004', name: 'AIIMS Patna', type: 'government', state: 'Bihar', city: 'Patna', address: 'Phulwari Sharif, Patna, Bihar - 801505', totalBeds: 793, availableBeds: 108, icuBeds: 108, availableIcu: 15, erAvailable: true, specialties: ['All Specialties', 'Trauma', 'Cardiology', 'Neurology'], phone: '+91 612 2451070', emergencyPhone: '+91 612 2451000', rating: 4.2, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV005', name: 'AIIMS Raipur', type: 'government', state: 'Chhattisgarh', city: 'Raipur', address: 'Tatibandh, Raipur, Chhattisgarh - 492099', totalBeds: 890, availableBeds: 118, icuBeds: 118, availableIcu: 22, erAvailable: true, specialties: ['All Specialties', 'Trauma', 'Cardiology', 'Neurology'], phone: '+91 771 2571828', emergencyPhone: '+91 771 2571800', rating: 4.1, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV006', name: 'PGIMER Chandigarh', type: 'government', state: 'Chandigarh', city: 'Chandigarh', address: 'Sector 12, Chandigarh - 160012', totalBeds: 2010, availableBeds: 245, icuBeds: 245, availableIcu: 38, erAvailable: true, specialties: ['All Specialties', 'Trauma', 'Cardiology', 'Neurosurgery'], phone: '+91 172 2747585', emergencyPhone: '+91 172 2747585', rating: 4.6, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV007', name: 'SGPGI Lucknow', type: 'government', state: 'Uttar Pradesh', city: 'Lucknow', address: 'Raebareli Road, Lucknow, UP - 226014', totalBeds: 1090, availableBeds: 142, icuBeds: 142, availableIcu: 25, erAvailable: true, specialties: ['All Specialties', 'Gastroenterology', 'Nephrology', 'Neurology'], phone: '+91 522 2494401', emergencyPhone: '+91 522 2494444', rating: 4.4, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV009', name: 'Safdarjung Hospital', type: 'government', state: 'Delhi', city: 'New Delhi', address: 'Safdarjung Enclave, New Delhi - 110029', totalBeds: 1500, availableBeds: 198, icuBeds: 198, availableIcu: 28, erAvailable: true, specialties: ['Trauma', 'Burns', 'Emergency', 'Orthopedics'], phone: '+91 11 26730000', emergencyPhone: '+91 11 26730100', rating: 4.1, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV010', name: 'KEM Hospital Mumbai', type: 'government', state: 'Maharashtra', city: 'Mumbai', address: 'Acharya Donde Marg, Parel, Mumbai - 400012', totalBeds: 1850, availableBeds: 225, icuBeds: 225, availableIcu: 35, erAvailable: true, specialties: ['Trauma', 'Emergency', 'Burns', 'Plastic Surgery'], phone: '+91 22 24136051', emergencyPhone: '+91 22 24136000', rating: 4.3, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV016', name: 'SMS Hospital Jaipur', type: 'government', state: 'Rajasthan', city: 'Jaipur', address: 'JLN Marg, Jaipur, Rajasthan - 302004', totalBeds: 1200, availableBeds: 165, icuBeds: 165, availableIcu: 28, erAvailable: true, specialties: ['Trauma', 'Emergency', 'Cardiology', 'Orthopedics'], phone: '+91 141 2560291', emergencyPhone: '+91 141 2560100', rating: 4.2, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV017', name: 'BHU Hospital Varanasi', type: 'government', state: 'Uttar Pradesh', city: 'Varanasi', address: 'Banaras Hindu University, Varanasi - 221005', totalBeds: 900, availableBeds: 125, icuBeds: 125, availableIcu: 22, erAvailable: true, specialties: ['All Specialties', 'Trauma', 'Cardiology', 'Oncology'], phone: '+91 542 2367518', emergencyPhone: '+91 542 2367500', rating: 4.0, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV018', name: 'GMCH Chandigarh', type: 'government', state: 'Chandigarh', city: 'Chandigarh', address: 'Sector 32, Chandigarh - 160030', totalBeds: 800, availableBeds: 112, icuBeds: 112, availableIcu: 20, erAvailable: true, specialties: ['Emergency', 'Trauma', 'Cardiology', 'Neurology'], phone: '+91 172 2601023', emergencyPhone: '+91 172 2601000', rating: 4.1, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV019', name: 'RML Hospital Delhi', type: 'government', state: 'Delhi', city: 'New Delhi', address: 'Baba Kharak Singh Marg, Delhi - 110001', totalBeds: 1100, availableBeds: 148, icuBeds: 148, availableIcu: 26, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Trauma', 'Cardiology'], phone: '+91 11 23365525', emergencyPhone: '+91 11 23365500', rating: 4.0, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV020', name: 'Civil Hospital Ahmedabad', type: 'government', state: 'Gujarat', city: 'Ahmedabad', address: 'Asarwa, Ahmedabad, Gujarat - 380016', totalBeds: 2200, availableBeds: 285, icuBeds: 285, availableIcu: 48, erAvailable: true, specialties: ['All Specialties', 'Trauma', 'Burns', 'Cardiology'], phone: '+91 79 22680000', emergencyPhone: '+91 79 22680000', rating: 4.2, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  
  // Government Hospitals - South India
  { id: 'GOV008', name: 'NIMHANS Bangalore', type: 'government', state: 'Karnataka', city: 'Bangalore', address: 'Hosur Road, Bangalore, Karnataka - 560029', totalBeds: 1520, availableBeds: 185, icuBeds: 185, availableIcu: 32, erAvailable: true, specialties: ['Neurology', 'Neurosurgery', 'Psychiatry', 'Emergency'], phone: '+91 80 26699000', emergencyPhone: '+91 80 26699000', rating: 4.5, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV011', name: 'Madras Medical College', type: 'government', state: 'Tamil Nadu', city: 'Chennai', address: 'EVR Periyar Salai, Chennai - 600003', totalBeds: 2100, availableBeds: 268, icuBeds: 268, availableIcu: 42, erAvailable: true, specialties: ['All Specialties', 'Trauma', 'Cardiology', 'Neurology'], phone: '+91 44 25305151', emergencyPhone: '+91 44 25305100', rating: 4.2, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV012', name: 'Government Rajaji Hospital', type: 'government', state: 'Tamil Nadu', city: 'Madurai', address: 'Panagal Road, Madurai, TN - 625020', totalBeds: 1200, availableBeds: 156, icuBeds: 156, availableIcu: 24, erAvailable: true, specialties: ['Emergency', 'Trauma', 'General Surgery', 'Burns'], phone: '+91 452 2532535', emergencyPhone: '+91 452 2532500', rating: 4.0, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV013', name: 'GKND Hospital Viruthunagar', type: 'government', state: 'Tamil Nadu', city: 'Viruthunagar', address: 'Srivilliputhur Road, Viruthunagar - 626001', totalBeds: 350, availableBeds: 45, icuBeds: 45, availableIcu: 8, erAvailable: true, specialties: ['Emergency', 'General Surgery', 'Orthopedics', 'Pediatrics'], phone: '+91 4562 243100', emergencyPhone: '+91 4562 243100', rating: 3.9, traumaCenter: false, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV014', name: 'Sivakasi GH', type: 'government', state: 'Tamil Nadu', city: 'Sivakasi', address: 'Hospital Road, Sivakasi, TN - 626123', totalBeds: 280, availableBeds: 38, icuBeds: 38, availableIcu: 6, erAvailable: true, specialties: ['Emergency', 'Burns', 'Trauma', 'General Medicine'], phone: '+91 4562 220100', emergencyPhone: '+91 4562 220100', rating: 3.8, traumaCenter: false, oxygenAvailable: true, bloodBank: false },
  { id: 'GOV015', name: 'Tenkasi GH', type: 'government', state: 'Tamil Nadu', city: 'Tenkasi', address: 'Main Road, Tenkasi, TN - 627811', totalBeds: 320, availableBeds: 42, icuBeds: 42, availableIcu: 7, erAvailable: true, specialties: ['Emergency', 'General Medicine', 'Trauma', 'Obstetrics'], phone: '+91 4633 280100', emergencyPhone: '+91 4633 280100', rating: 3.9, traumaCenter: false, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV021', name: 'Coimbatore Medical College', type: 'government', state: 'Tamil Nadu', city: 'Coimbatore', address: 'Trichy Road, Coimbatore - 641018', totalBeds: 1350, availableBeds: 178, icuBeds: 178, availableIcu: 32, erAvailable: true, specialties: ['All Specialties', 'Trauma', 'Cardiology', 'Neurosurgery'], phone: '+91 422 2301200', emergencyPhone: '+91 422 2301000', rating: 4.1, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV022', name: 'Tirunelveli Medical College', type: 'government', state: 'Tamil Nadu', city: 'Tirunelveli', address: 'High Ground Road, Tirunelveli - 627011', totalBeds: 950, availableBeds: 128, icuBeds: 128, availableIcu: 22, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Trauma', 'Nephrology'], phone: '+91 462 2572344', emergencyPhone: '+91 462 2572300', rating: 4.0, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV023', name: 'Rajapalayam GH', type: 'government', state: 'Tamil Nadu', city: 'Rajapalayam', address: 'Gandhi Nagar, Rajapalayam - 626117', totalBeds: 180, availableBeds: 25, icuBeds: 25, availableIcu: 4, erAvailable: true, specialties: ['General Medicine', 'Emergency', 'Surgery'], phone: '+91 4563 220777', emergencyPhone: '+91 4563 220700', rating: 3.7, traumaCenter: false, oxygenAvailable: true, bloodBank: false },
  { id: 'GOV024', name: 'Thanjavur Medical College', type: 'government', state: 'Tamil Nadu', city: 'Thanjavur', address: 'Pudukkottai Road, Thanjavur - 613004', totalBeds: 850, availableBeds: 115, icuBeds: 115, availableIcu: 20, erAvailable: true, specialties: ['All Specialties', 'Cardiology', 'Trauma', 'Orthopedics'], phone: '+91 4362 221010', emergencyPhone: '+91 4362 221000', rating: 4.0, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV025', name: 'Osmania General Hospital', type: 'government', state: 'Telangana', city: 'Hyderabad', address: 'Afzalgunj, Hyderabad - 500012', totalBeds: 1100, availableBeds: 148, icuBeds: 148, availableIcu: 26, erAvailable: true, specialties: ['All Specialties', 'Trauma', 'Emergency', 'Surgery'], phone: '+91 40 24600173', emergencyPhone: '+91 40 24600100', rating: 4.0, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV026', name: 'Gandhi Hospital Secunderabad', type: 'government', state: 'Telangana', city: 'Secunderabad', address: 'Musheerabad, Secunderabad - 500003', totalBeds: 900, availableBeds: 125, icuBeds: 125, availableIcu: 22, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Trauma', 'Cardiology'], phone: '+91 40 27505566', emergencyPhone: '+91 40 27505500', rating: 4.1, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV027', name: 'Vijayawada GGH', type: 'government', state: 'Andhra Pradesh', city: 'Vijayawada', address: 'Bandar Road, Vijayawada - 520002', totalBeds: 750, availableBeds: 98, icuBeds: 98, availableIcu: 18, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Trauma', 'Obstetrics'], phone: '+91 866 2576001', emergencyPhone: '+91 866 2576000', rating: 3.9, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV028', name: 'Kurnool Medical College', type: 'government', state: 'Andhra Pradesh', city: 'Kurnool', address: 'Budhawarpet, Kurnool - 518002', totalBeds: 680, availableBeds: 88, icuBeds: 88, availableIcu: 16, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Cardiology', 'Trauma'], phone: '+91 8518 247222', emergencyPhone: '+91 8518 247200', rating: 3.9, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV029', name: 'Bowring Hospital Bangalore', type: 'government', state: 'Karnataka', city: 'Bangalore', address: 'Shivajinagar, Bangalore - 560001', totalBeds: 700, availableBeds: 92, icuBeds: 92, availableIcu: 18, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Trauma', 'Surgery'], phone: '+91 80 25591333', emergencyPhone: '+91 80 25591000', rating: 3.9, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV030', name: 'Mysore Medical College', type: 'government', state: 'Karnataka', city: 'Mysore', address: 'Irwin Road, Mysore - 570001', totalBeds: 850, availableBeds: 115, icuBeds: 115, availableIcu: 22, erAvailable: true, specialties: ['All Specialties', 'Trauma', 'Cardiology', 'Neurology'], phone: '+91 821 2520502', emergencyPhone: '+91 821 2520500', rating: 4.0, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV031', name: 'Government TD Medical College', type: 'government', state: 'Kerala', city: 'Alappuzha', address: 'Vandanam, Alappuzha - 688005', totalBeds: 750, availableBeds: 98, icuBeds: 98, availableIcu: 18, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Trauma', 'Cardiology'], phone: '+91 477 2282208', emergencyPhone: '+91 477 2282200', rating: 4.0, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV032', name: 'Trivandrum Medical College', type: 'government', state: 'Kerala', city: 'Thiruvananthapuram', address: 'Ulloor, Thiruvananthapuram - 695011', totalBeds: 1400, availableBeds: 185, icuBeds: 185, availableIcu: 32, erAvailable: true, specialties: ['All Specialties', 'Trauma', 'Cardiology', 'Oncology'], phone: '+91 471 2446432', emergencyPhone: '+91 471 2446400', rating: 4.3, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV033', name: 'Calicut Medical College', type: 'government', state: 'Kerala', city: 'Kozhikode', address: 'Govt. Medical College Campus, Kozhikode - 673008', totalBeds: 1100, availableBeds: 145, icuBeds: 145, availableIcu: 26, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Trauma', 'Nephrology'], phone: '+91 495 2350481', emergencyPhone: '+91 495 2350400', rating: 4.2, traumaCenter: true, oxygenAvailable: true, bloodBank: true },

  // Government Hospitals - East & North East India
  { id: 'GOV034', name: 'NRS Medical College Kolkata', type: 'government', state: 'West Bengal', city: 'Kolkata', address: '138, AJC Bose Road, Kolkata - 700014', totalBeds: 1600, availableBeds: 215, icuBeds: 215, availableIcu: 38, erAvailable: true, specialties: ['All Specialties', 'Trauma', 'Cardiology', 'Neurosurgery'], phone: '+91 33 22041101', emergencyPhone: '+91 33 22041100', rating: 4.2, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV035', name: 'SSKM Hospital Kolkata', type: 'government', state: 'West Bengal', city: 'Kolkata', address: 'S.S.K.M. Hospital Road, Kolkata - 700020', totalBeds: 1900, availableBeds: 245, icuBeds: 245, availableIcu: 42, erAvailable: true, specialties: ['All Specialties', 'Gastroenterology', 'Nephrology', 'Cardiology'], phone: '+91 33 22235211', emergencyPhone: '+91 33 22235000', rating: 4.3, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV036', name: 'Guwahati Medical College', type: 'government', state: 'Assam', city: 'Guwahati', address: 'Narakasur Hilltop, Bhangagarh, Guwahati - 781032', totalBeds: 950, availableBeds: 128, icuBeds: 128, availableIcu: 22, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Trauma', 'Cardiology'], phone: '+91 361 2573025', emergencyPhone: '+91 361 2573000', rating: 4.0, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV037', name: 'Silchar Medical College', type: 'government', state: 'Assam', city: 'Silchar', address: 'Ghungoor, Silchar - 788014', totalBeds: 550, availableBeds: 72, icuBeds: 72, availableIcu: 14, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Trauma', 'Surgery'], phone: '+91 3842 241152', emergencyPhone: '+91 3842 241100', rating: 3.9, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV038', name: 'JNIMS Imphal', type: 'government', state: 'Manipur', city: 'Imphal', address: 'Porompat, Imphal East - 795005', totalBeds: 450, availableBeds: 62, icuBeds: 62, availableIcu: 12, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Trauma', 'Medicine'], phone: '+91 385 2414204', emergencyPhone: '+91 385 2414200', rating: 3.8, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV039', name: 'NEIGRIHMS Shillong', type: 'government', state: 'Meghalaya', city: 'Shillong', address: 'Mawdiangdiang, Shillong - 793018', totalBeds: 650, availableBeds: 88, icuBeds: 88, availableIcu: 16, erAvailable: true, specialties: ['All Specialties', 'Cardiology', 'Trauma', 'Neurology'], phone: '+91 364 2538001', emergencyPhone: '+91 364 2538000', rating: 4.0, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV040', name: 'RIMS Ranchi', type: 'government', state: 'Jharkhand', city: 'Ranchi', address: 'Bariatu, Ranchi - 834009', totalBeds: 850, availableBeds: 118, icuBeds: 118, availableIcu: 22, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Trauma', 'Cardiology'], phone: '+91 651 2540577', emergencyPhone: '+91 651 2540500', rating: 4.0, traumaCenter: true, oxygenAvailable: true, bloodBank: true },

  // Government Hospitals - West India
  { id: 'GOV041', name: 'BJ Medical College Ahmedabad', type: 'government', state: 'Gujarat', city: 'Ahmedabad', address: 'Asarwa, Ahmedabad - 380016', totalBeds: 1400, availableBeds: 185, icuBeds: 185, availableIcu: 32, erAvailable: true, specialties: ['All Specialties', 'Cardiology', 'Trauma', 'Oncology'], phone: '+91 79 22680092', emergencyPhone: '+91 79 22680000', rating: 4.1, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV042', name: 'Surat Municipal Institute', type: 'government', state: 'Gujarat', city: 'Surat', address: 'Majura Gate, Surat - 395001', totalBeds: 650, availableBeds: 85, icuBeds: 85, availableIcu: 16, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Trauma', 'Surgery'], phone: '+91 261 2244145', emergencyPhone: '+91 261 2244100', rating: 3.9, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV043', name: 'Grant Medical College Mumbai', type: 'government', state: 'Maharashtra', city: 'Mumbai', address: 'Byculla, Mumbai - 400008', totalBeds: 1600, availableBeds: 215, icuBeds: 215, availableIcu: 38, erAvailable: true, specialties: ['All Specialties', 'Trauma', 'Emergency', 'Cardiology'], phone: '+91 22 23735555', emergencyPhone: '+91 22 23735000', rating: 4.2, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV044', name: 'Sassoon Hospital Pune', type: 'government', state: 'Maharashtra', city: 'Pune', address: 'Bund Garden Road, Pune - 411001', totalBeds: 1050, availableBeds: 138, icuBeds: 138, availableIcu: 25, erAvailable: true, specialties: ['All Specialties', 'Trauma', 'Emergency', 'Neurology'], phone: '+91 20 26128000', emergencyPhone: '+91 20 26128000', rating: 4.1, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV045', name: 'IGGMCH Nagpur', type: 'government', state: 'Maharashtra', city: 'Nagpur', address: 'Central Avenue Road, Nagpur - 440018', totalBeds: 750, availableBeds: 98, icuBeds: 98, availableIcu: 18, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Trauma', 'Cardiology'], phone: '+91 712 2744286', emergencyPhone: '+91 712 2744200', rating: 3.9, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV046', name: 'MY Hospital Indore', type: 'government', state: 'Madhya Pradesh', city: 'Indore', address: 'A.B. Road, Indore - 452001', totalBeds: 1100, availableBeds: 145, icuBeds: 145, availableIcu: 26, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Trauma', 'Cardiology'], phone: '+91 731 2523764', emergencyPhone: '+91 731 2523700', rating: 4.1, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV047', name: 'Hamidia Hospital Bhopal', type: 'government', state: 'Madhya Pradesh', city: 'Bhopal', address: 'Royal Market, Bhopal - 462001', totalBeds: 850, availableBeds: 115, icuBeds: 115, availableIcu: 22, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Trauma', 'Burns'], phone: '+91 755 2540534', emergencyPhone: '+91 755 2540500', rating: 4.0, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV048', name: 'Sawai Man Singh Hospital', type: 'government', state: 'Rajasthan', city: 'Jaipur', address: 'Jawaharlal Nehru Marg, Jaipur - 302004', totalBeds: 1400, availableBeds: 185, icuBeds: 185, availableIcu: 32, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Trauma', 'Oncology'], phone: '+91 141 2560291', emergencyPhone: '+91 141 2560200', rating: 4.2, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV049', name: 'RNT Medical College Udaipur', type: 'government', state: 'Rajasthan', city: 'Udaipur', address: 'Udaipur - 313001', totalBeds: 700, availableBeds: 92, icuBeds: 92, availableIcu: 18, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Trauma', 'Surgery'], phone: '+91 294 2426511', emergencyPhone: '+91 294 2426500', rating: 3.9, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'GOV050', name: 'Goa Medical College', type: 'government', state: 'Goa', city: 'Bambolim', address: 'Near Bambolim Cross, Goa - 403202', totalBeds: 950, availableBeds: 125, icuBeds: 125, availableIcu: 22, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Trauma', 'Cardiology'], phone: '+91 832 2458727', emergencyPhone: '+91 832 2458700', rating: 4.0, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  
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
  { id: 'PVT016', name: 'Apollo Indraprastha Delhi', type: 'private', state: 'Delhi', city: 'New Delhi', address: 'Sarita Vihar, Delhi Mathura Road, Delhi - 110076', totalBeds: 700, availableBeds: 112, icuBeds: 112, availableIcu: 28, erAvailable: true, specialties: ['All Specialties', 'Cardiology', 'Neurology', 'Transplant'], phone: '+91 11 71791090', emergencyPhone: '+91 11 71791000', rating: 4.7, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT017', name: 'BLK Hospital Delhi', type: 'private', state: 'Delhi', city: 'New Delhi', address: 'Pusa Road, Karol Bagh, Delhi - 110005', totalBeds: 650, availableBeds: 105, icuBeds: 105, availableIcu: 25, erAvailable: true, specialties: ['All Specialties', 'Oncology', 'Cardiology', 'Orthopedics'], phone: '+91 11 30403040', emergencyPhone: '+91 11 30403000', rating: 4.5, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT018', name: 'Jaypee Hospital Noida', type: 'private', state: 'Uttar Pradesh', city: 'Noida', address: 'Sector 128, Noida - 201304', totalBeds: 450, availableBeds: 72, icuBeds: 72, availableIcu: 18, erAvailable: true, specialties: ['All Specialties', 'Cardiology', 'Neurology', 'Emergency'], phone: '+91 120 4122222', emergencyPhone: '+91 120 4122200', rating: 4.3, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT019', name: 'Fortis Escorts Delhi', type: 'private', state: 'Delhi', city: 'New Delhi', address: 'Okhla Road, Sukhdev Vihar, Delhi - 110025', totalBeds: 310, availableBeds: 48, icuBeds: 48, availableIcu: 12, erAvailable: true, specialties: ['Cardiology', 'Cardiac Surgery', 'Emergency', 'Neurology'], phone: '+91 11 47135000', emergencyPhone: '+91 11 47135000', rating: 4.6, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT020', name: 'Wockhardt Hospital Mumbai', type: 'private', state: 'Maharashtra', city: 'Mumbai', address: 'Bandra Kurla Complex, Mumbai - 400051', totalBeds: 350, availableBeds: 58, icuBeds: 58, availableIcu: 15, erAvailable: true, specialties: ['Neurology', 'Cardiology', 'Orthopedics', 'Emergency'], phone: '+91 22 40991111', emergencyPhone: '+91 22 40991000', rating: 4.4, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT021', name: 'Ruby Hall Clinic Pune', type: 'private', state: 'Maharashtra', city: 'Pune', address: '40, Sassoon Road, Pune - 411001', totalBeds: 500, availableBeds: 82, icuBeds: 82, availableIcu: 20, erAvailable: true, specialties: ['All Specialties', 'Cardiology', 'Oncology', 'Emergency'], phone: '+91 20 26163391', emergencyPhone: '+91 20 26163000', rating: 4.5, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT022', name: 'Aster CMI Bangalore', type: 'private', state: 'Karnataka', city: 'Bangalore', address: 'Hebbal, Bangalore - 560024', totalBeds: 400, availableBeds: 65, icuBeds: 65, availableIcu: 16, erAvailable: true, specialties: ['All Specialties', 'Neurology', 'Cardiology', 'Emergency'], phone: '+91 80 43440100', emergencyPhone: '+91 80 43440100', rating: 4.4, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT023', name: 'Sunrise Hospital Kochi', type: 'private', state: 'Kerala', city: 'Kochi', address: 'Palarivattom, Kochi - 682025', totalBeds: 150, availableBeds: 28, icuBeds: 28, availableIcu: 7, erAvailable: true, specialties: ['Neurology', 'Orthopedics', 'Emergency', 'Cardiology'], phone: '+91 484 2345678', emergencyPhone: '+91 484 2345600', rating: 4.2, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT024', name: 'KIMS Trivandrum', type: 'private', state: 'Kerala', city: 'Thiruvananthapuram', address: 'Anayara, Trivandrum - 695029', totalBeds: 380, availableBeds: 62, icuBeds: 62, availableIcu: 15, erAvailable: true, specialties: ['All Specialties', 'Neurology', 'Cardiology', 'Emergency'], phone: '+91 471 3041000', emergencyPhone: '+91 471 3041000', rating: 4.4, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT025', name: 'Medicover Hyderabad', type: 'private', state: 'Telangana', city: 'Hyderabad', address: 'Hitech City, Hyderabad - 500081', totalBeds: 200, availableBeds: 35, icuBeds: 35, availableIcu: 9, erAvailable: true, specialties: ['Cardiology', 'Orthopedics', 'Emergency', 'Neurology'], phone: '+91 40 67199999', emergencyPhone: '+91 40 67199000', rating: 4.2, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT026', name: 'Gleneagles Global Chennai', type: 'private', state: 'Tamil Nadu', city: 'Chennai', address: 'Perumbakkam, Chennai - 600100', totalBeds: 450, availableBeds: 72, icuBeds: 72, availableIcu: 18, erAvailable: true, specialties: ['All Specialties', 'Transplant', 'Cardiology', 'Neurology'], phone: '+91 44 44777000', emergencyPhone: '+91 44 44777000', rating: 4.5, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT027', name: 'Sri Ramachandra Medical', type: 'private', state: 'Tamil Nadu', city: 'Chennai', address: 'Porur, Chennai - 600116', totalBeds: 750, availableBeds: 122, icuBeds: 122, availableIcu: 28, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Cardiology', 'Oncology'], phone: '+91 44 45928585', emergencyPhone: '+91 44 45928000', rating: 4.4, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT028', name: 'Seven Hills Mumbai', type: 'private', state: 'Maharashtra', city: 'Mumbai', address: 'Andheri East, Mumbai - 400059', totalBeds: 320, availableBeds: 52, icuBeds: 52, availableIcu: 13, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Cardiology', 'Neurology'], phone: '+91 22 67676767', emergencyPhone: '+91 22 67676000', rating: 4.3, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT029', name: 'P D Hinduja Hospital', type: 'private', state: 'Maharashtra', city: 'Mumbai', address: 'Mahim, Mumbai - 400016', totalBeds: 520, availableBeds: 85, icuBeds: 85, availableIcu: 21, erAvailable: true, specialties: ['All Specialties', 'Oncology', 'Cardiology', 'Neurology'], phone: '+91 22 24451515', emergencyPhone: '+91 22 24451000', rating: 4.6, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT030', name: 'Sahyadri Hospital Pune', type: 'private', state: 'Maharashtra', city: 'Pune', address: 'Deccan Gymkhana, Pune - 411004', totalBeds: 280, availableBeds: 45, icuBeds: 45, availableIcu: 11, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Cardiology', 'Orthopedics'], phone: '+91 20 67234300', emergencyPhone: '+91 20 67234000', rating: 4.3, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT031', name: 'MIOT Chennai', type: 'private', state: 'Tamil Nadu', city: 'Chennai', address: 'Manapakkam, Chennai - 600089', totalBeds: 220, availableBeds: 38, icuBeds: 38, availableIcu: 10, erAvailable: true, specialties: ['Orthopedics', 'Trauma', 'Cardiology', 'Emergency'], phone: '+91 44 42002288', emergencyPhone: '+91 44 42002000', rating: 4.5, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT032', name: 'Billroth Hospital Chennai', type: 'private', state: 'Tamil Nadu', city: 'Chennai', address: 'Vadapalani, Chennai - 600026', totalBeds: 180, availableBeds: 32, icuBeds: 32, availableIcu: 8, erAvailable: true, specialties: ['Cardiology', 'Oncology', 'Emergency', 'Surgery'], phone: '+91 44 23641313', emergencyPhone: '+91 44 23641000', rating: 4.2, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT033', name: 'PSG Hospitals Coimbatore', type: 'private', state: 'Tamil Nadu', city: 'Coimbatore', address: 'Peelamedu, Coimbatore - 641004', totalBeds: 650, availableBeds: 105, icuBeds: 105, availableIcu: 25, erAvailable: true, specialties: ['All Specialties', 'Cardiology', 'Neurology', 'Emergency'], phone: '+91 422 2570170', emergencyPhone: '+91 422 2570100', rating: 4.4, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT034', name: 'Ganga Hospital Coimbatore', type: 'private', state: 'Tamil Nadu', city: 'Coimbatore', address: 'Sathy Road, Coimbatore - 641029', totalBeds: 450, availableBeds: 72, icuBeds: 72, availableIcu: 18, erAvailable: true, specialties: ['Orthopedics', 'Trauma', 'Plastic Surgery', 'Emergency'], phone: '+91 422 2485000', emergencyPhone: '+91 422 2485000', rating: 4.5, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT035', name: 'Kovai Medical Center', type: 'private', state: 'Tamil Nadu', city: 'Coimbatore', address: 'Avinashi Road, Coimbatore - 641014', totalBeds: 300, availableBeds: 48, icuBeds: 48, availableIcu: 12, erAvailable: true, specialties: ['Cardiology', 'Neurology', 'Emergency', 'Oncology'], phone: '+91 422 4323800', emergencyPhone: '+91 422 4323800', rating: 4.3, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT036', name: 'Velammal Medical', type: 'private', state: 'Tamil Nadu', city: 'Madurai', address: 'Tirupparankundram, Madurai - 625015', totalBeds: 850, availableBeds: 138, icuBeds: 138, availableIcu: 32, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Cardiology', 'Neurology'], phone: '+91 452 7111111', emergencyPhone: '+91 452 7111100', rating: 4.4, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT037', name: 'Sri Meenakshi Hospital', type: 'private', state: 'Tamil Nadu', city: 'Madurai', address: 'K.K. Nagar, Madurai - 625020', totalBeds: 250, availableBeds: 42, icuBeds: 42, availableIcu: 11, erAvailable: true, specialties: ['Cardiology', 'Orthopedics', 'Emergency', 'General Surgery'], phone: '+91 452 2525522', emergencyPhone: '+91 452 2525500', rating: 4.2, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT038', name: 'Apollo Adlux Kochi', type: 'private', state: 'Kerala', city: 'Angamaly', address: 'Nedumbassery, Kochi - 683585', totalBeds: 350, availableBeds: 58, icuBeds: 58, availableIcu: 14, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Cardiology', 'Orthopedics'], phone: '+91 484 6699999', emergencyPhone: '+91 484 6699900', rating: 4.3, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT039', name: 'Rajagiri Hospital', type: 'private', state: 'Kerala', city: 'Aluva', address: 'Rajagiri Valley, Aluva - 683112', totalBeds: 500, availableBeds: 82, icuBeds: 82, availableIcu: 20, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Cardiology', 'Neurology'], phone: '+91 484 2909000', emergencyPhone: '+91 484 2909000', rating: 4.4, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
  { id: 'PVT040', name: 'Aster Mims Calicut', type: 'private', state: 'Kerala', city: 'Kozhikode', address: 'Mini Bypass Road, Kozhikode - 673004', totalBeds: 350, availableBeds: 58, icuBeds: 58, availableIcu: 15, erAvailable: true, specialties: ['All Specialties', 'Emergency', 'Cardiology', 'Oncology'], phone: '+91 495 2488000', emergencyPhone: '+91 495 2488000', rating: 4.3, traumaCenter: true, oxygenAvailable: true, bloodBank: true },
];

const indianStates = [
  'All States', 'Andhra Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Jammu & Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Odisha', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'
];

export default function HospitalDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('All States');
  const [hospitalType, setHospitalType] = useState<'all' | 'government' | 'private'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'beds' | 'rating'>('name');
  const [expandedHospital, setExpandedHospital] = useState<string | null>(null);

  const filteredHospitals = useMemo(() => {
    return hospitalsData.filter(hosp => {
      const matchesSearch = searchQuery === '' || 
        hosp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hosp.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hosp.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hosp.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesState = selectedState === 'All States' || hosp.state === selectedState;
      const matchesType = hospitalType === 'all' || hosp.type === hospitalType;
      
      return matchesSearch && matchesState && matchesType;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'beds') return b.availableBeds - a.availableBeds;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });
  }, [searchQuery, selectedState, hospitalType, sortBy]);

  const governmentHospitals = filteredHospitals.filter(h => h.type === 'government');
  const privateHospitals = filteredHospitals.filter(h => h.type === 'private');

  const totalBeds = hospitalsData.reduce((sum, h) => sum + h.totalBeds, 0);
  const totalAvailableBeds = hospitalsData.reduce((sum, h) => sum + h.availableBeds, 0);
  const totalIcuBeds = hospitalsData.reduce((sum, h) => sum + h.icuBeds, 0);
  const totalAvailableIcu = hospitalsData.reduce((sum, h) => sum + h.availableIcu, 0);
  const bedsFullCount = hospitalsData.filter(h => h.availableBeds === 0).length;

  const getBedStatus = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage > 30) return { color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-300', label: 'LOW' };
    if (percentage > 15) return { color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-300', label: 'MEDIUM' };
    if (percentage > 0) return { color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-300', label: 'HIGH' };
    return { color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-300', label: 'CRITICAL' };
  };

  const HospitalCard = ({ hosp, rank }: { hosp: Hospital; rank: number }) => {
    const bedStatus = getBedStatus(hosp.availableBeds, hosp.totalBeds);
    const icuStatus = getBedStatus(hosp.availableIcu, hosp.icuBeds);
    const isExpanded = expandedHospital === hosp.id;

    return (
      <div className={`group relative rounded-xl border-2 transition-all duration-300 overflow-hidden bg-white ${
        hosp.type === 'government' 
          ? 'border-blue-200 hover:border-blue-400 shadow-sm' 
          : 'border-purple-200 hover:border-purple-400 shadow-sm'
      }`}>
        {/* Rank Badge */}
        <div className={`absolute top-3 right-3 z-10 px-2 py-1 rounded-md text-[10px] font-bold ${
          rank === 1 ? 'bg-yellow-500 text-black' : rank === 2 ? 'bg-gray-400 text-black' : rank === 3 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'
        }`}>
          #{rank} NEAREST
        </div>

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${hosp.type === 'government' ? 'bg-blue-100' : 'bg-purple-100'}`}>
              <Building2 className={`w-5 h-5 ${hosp.type === 'government' ? 'text-blue-600' : 'text-purple-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-gray-900 truncate pr-16">{hosp.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-gray-500" />
                <p className="text-xs text-gray-600 truncate">{hosp.city}, {hosp.state}</p>
              </div>
            </div>
          </div>

          {/* Bed Stats */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className={`rounded-lg p-2 text-center border ${bedStatus.bg} ${bedStatus.border}`}>
              <p className="text-[9px] text-gray-500 uppercase">Beds</p>
              <p className={`text-base font-extrabold ${bedStatus.color}`}>{hosp.availableBeds}</p>
              <p className="text-[8px] text-gray-400">/{hosp.totalBeds}</p>
            </div>
            <div className={`rounded-lg p-2 text-center border ${icuStatus.bg} ${icuStatus.border}`}>
              <p className="text-[9px] text-gray-500 uppercase">ICU</p>
              <p className={`text-base font-extrabold ${icuStatus.color}`}>{hosp.availableIcu}</p>
              <p className="text-[8px] text-gray-400">/{hosp.icuBeds}</p>
            </div>
            <div className={`rounded-lg p-2 text-center border ${hosp.erAvailable ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'}`}>
              <p className="text-[9px] text-gray-500 uppercase">ER</p>
              <p className={`text-base font-extrabold ${hosp.erAvailable ? 'text-green-600' : 'text-gray-400'}`}>{hosp.erAvailable ? '24/7' : 'No'}</p>
            </div>
            <div className="rounded-lg p-2 text-center border bg-gray-100 border-gray-200">
              <p className="text-[9px] text-gray-500 uppercase">Rating</p>
              <div className="flex items-center justify-center gap-0.5">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <p className="text-base font-extrabold text-gray-900">{hosp.rating}</p>
              </div>
            </div>
          </div>

          {/* Specialties */}
          <div className="flex flex-wrap gap-1 mb-3">
            {hosp.specialties.slice(0, 4).map((spec, i) => (
              <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[9px] border border-gray-200">
                {spec}
              </span>
            ))}
          </div>

          {/* Contact */}
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-700">{hosp.phone}</span>
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
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 animate-in">
              <p className="text-xs text-gray-600"><strong className="text-gray-900">Address:</strong> {hosp.address}</p>
              <p className="text-xs text-gray-600"><strong className="text-gray-900">Emergency:</strong> {hosp.emergencyPhone}</p>
              <div className="flex flex-wrap gap-2">
                {hosp.traumaCenter && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[9px] border border-red-300">🚨 Trauma Center</span>}
                {hosp.oxygenAvailable && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] border border-blue-300">💨 Oxygen</span>}
                {hosp.bloodBank && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[9px] border border-purple-300">🩸 Blood Bank</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-[600px]">
      {/* Stats Bar */}
      <div className="px-6 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-xs text-gray-600">Government: <strong className="text-gray-900">{hospitalsData.filter(h => h.type === 'government').length}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            <span className="text-xs text-gray-600">Private: <strong className="text-gray-900">{hospitalsData.filter(h => h.type === 'private').length}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Bed className="w-3 h-3 text-green-500" />
            <span className="text-xs text-gray-600">Total Beds: <strong className="text-green-600">{totalAvailableBeds.toLocaleString()}</strong> / {totalBeds.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-blue-500" />
            <span className="text-xs text-gray-600">Total ICU: <strong className="text-blue-600">{totalAvailableIcu.toLocaleString()}</strong> / {totalIcuBeds.toLocaleString()}</span>
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
      <div className="px-6 py-4 space-y-4 bg-white border-b border-gray-200">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search hospital name, city, district, state, pincode..."
            className="w-full pl-12 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 border border-gray-200">
            <Filter className="w-3.5 h-3.5 text-gray-500 ml-2" />
            <span className="text-xs text-gray-500 pr-2">View:</span>
            <button
              onClick={() => setHospitalType('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${hospitalType === 'all' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Government + Private
            </button>
            <button
              onClick={() => setHospitalType('government')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${hospitalType === 'government' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Government Only
            </button>
            <button
              onClick={() => setHospitalType('private')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${hospitalType === 'private' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Private Only
            </button>
          </div>

          <select
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
            className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {indianStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="name">Sort: A-Z</option>
            <option value="beds">Sort: Available Beds</option>
            <option value="rating">Sort: Rating</option>
          </select>

          <button
            onClick={() => { setSearchQuery(''); setSelectedState('All States'); setHospitalType('all'); setSortBy('name'); }}
            className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
          >
            Reset
          </button>
        </div>

        {/* Results Count */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Total</span>
          <span className="font-bold text-gray-900">{filteredHospitals.length}</span>
          <span className="text-gray-500">hospitals shown</span>
          <span className="text-gray-300">|</span>
          <span className="text-blue-600">Government: <strong>{governmentHospitals.length}</strong></span>
          <span className="text-gray-300">|</span>
          <span className="text-purple-600">Private: <strong>{privateHospitals.length}</strong></span>
        </div>
      </div>

      {/* Hospital Grid */}
      <div className="px-6 py-6 bg-gray-50">
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
                <div className="text-center py-12 text-gray-500">
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
                <div className="text-center py-12 text-gray-500">
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
