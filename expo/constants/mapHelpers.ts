import { POICategory } from '@/types';
import Colors from '@/constants/colors';

export const POI_CATEGORY_CONFIG: Record<POICategory, { label: string; color: string; icon: string }> = {
  water: { label: 'Water Source', color: '#4A90D9', icon: 'droplets' },
  shelter: { label: 'Shelter', color: '#8B6914', icon: 'home' },
  medical: { label: 'Medical', color: '#CC3333', icon: 'heart-pulse' },
  supply_cache: { label: 'Supply Cache', color: Colors.orange, icon: 'package' },
  rally_point: { label: 'Rally Point', color: Colors.statusGreen, icon: 'flag' },
  hazard: { label: 'Hazard', color: Colors.statusRed, icon: 'alert-triangle' },
  comms: { label: 'Comms Point', color: '#9B59B6', icon: 'radio' },
  gas_station: { label: 'Gas Station', color: '#E88A3A', icon: 'fuel' },
  hospital: { label: 'Hospital', color: '#E53935', icon: 'building-2' },
  pharmacy: { label: 'Pharmacy', color: '#43A047', icon: 'pill' },
  police: { label: 'Police Station', color: '#1E88E5', icon: 'shield-alert' },
  fire_station: { label: 'Fire Station', color: '#D32F2F', icon: 'flame' },
  other: { label: 'Other', color: Colors.textSecondary, icon: 'map-pin' },
};

export const ROUTE_COLORS = [
  '#D4822A',
  '#4A90D9',
  '#CC3333',
  '#4CAF50',
  '#9B59B6',
  '#E8A04A',
  '#00BCD4',
  '#FF5722',
];

export const DEFAULT_REGION = {
  latitude: 39.8283,
  longitude: -98.5795,
  latitudeDelta: 40,
  longitudeDelta: 40,
};

export const MEMBER_STATUS_COLORS: Record<string, string> = {
  ready: Colors.statusGreen,
  unavailable: Colors.statusRed,
  unknown: Colors.statusAmber,
};
