export type AlertLevel = 'green' | 'amber' | 'red';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GroupMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  status: 'ready' | 'unavailable' | 'unknown';
  phone?: string;
  notes?: string;
  location?: Coordinates;
  locationUpdatedAt?: string;
  lastCheckInAt?: string;
}

export interface SupplyItem {
  id: string;
  name: string;
  category: SupplyCategory;
  quantity: number;
  unit: string;
  minimumQuantity: number;
  expirationDate?: string;
  notes?: string;
}

export type SupplyCategory = 'water' | 'food' | 'medical' | 'tools' | 'comms' | 'shelter' | 'clothing' | 'documents' | 'other';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  description: string;
  icon: string;
  items: ChecklistItem[];
  lastUpdated: string;
}

export interface GuideSection {
  title: string;
  content: string;
}

export interface Guide {
  id: string;
  title: string;
  category: string;
  icon: string;
  summary: string;
  sections: GuideSection[];
}

export type POICategory = 'water' | 'shelter' | 'medical' | 'supply_cache' | 'rally_point' | 'hazard' | 'comms' | 'gas_station' | 'hospital' | 'pharmacy' | 'police' | 'fire_station' | 'weather_resource' | 'other';

export interface POI {
  id: string;
  name: string;
  category: POICategory;
  coordinates: Coordinates;
  notes?: string;
  icon?: string;
  createdAt: string;
}

export interface Route {
  id: string;
  name: string;
  color: string;
  waypoints: Coordinates[];
  notes?: string;
  createdAt: string;
}

export type CommsBand = 'FRS' | 'GMRS' | 'MURS' | 'CB' | 'VHF_Marine' | 'HAM_VHF' | 'HAM_UHF' | 'HF' | 'Custom';

export type CommsMode = 'simplex' | 'duplex' | 'mesh' | 'repeater';

export interface CommsChannel {
  id: string;
  name: string;
  band: CommsBand;
  frequency: string;
  mode: CommsMode;
  purpose: string;
  ctcssTone?: string;
  power?: string;
  notes?: string;
  isPrimary?: boolean;
}

export interface CommsRepeater {
  id: string;
  name: string;
  inputFreq: string;
  outputFreq: string;
  offset: string;
  ctcssTone: string;
  location?: string;
  coordinates?: Coordinates;
  range?: string;
  notes?: string;
}

export interface CommsProtocol {
  id: string;
  title: string;
  description: string;
  steps: string[];
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  precipitation: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  isDay: boolean;
  updatedAt: string;
}

export interface WeatherForecastHour {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitation: number;
  windSpeed: number;
}

export interface WeatherForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  precipSum: number;
  windMax: number;
  sunrise: string;
  sunset: string;
}

export type KiwixCategory = 'medical' | 'survival' | 'homesteading' | 'comms' | 'engineering' | 'reference' | 'agriculture' | 'security' | 'other';

export type KiwixStatus = 'available' | 'saved' | 'downloaded';

export interface KiwixResource {
  id: string;
  title: string;
  category: KiwixCategory;
  description: string;
  sizeLabel: string;
  downloadUrl: string;
  language: string;
  lastUpdated: string;
  tags: string[];
  status: KiwixStatus;
  savedAt?: string;
  sizeBytes?: number;
  infoUrl?: string;
}

export interface AppData {
  alertLevel: AlertLevel;
  groupName: string;
  checkInIntervalHours?: number;
  remindersEnabled?: boolean;
  members: GroupMember[];
  supplies: SupplyItem[];
  checklists: Checklist[];
  pois: POI[];
  routes: Route[];
  commsChannels: CommsChannel[];
  commsRepeaters: CommsRepeater[];
  kiwixLibrary: KiwixResource[];
}
