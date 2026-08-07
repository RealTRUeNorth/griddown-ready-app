import { POI, Route } from '@/types';

/**
 * Default infrastructure POIs — emergency services, utilities, and tactical
 * locations pre-loaded on every fresh install. Centered on the St. Louis
 * metro area as a representative urban environment.
 */
export const defaultInfrastructurePois: POI[] = [
  // ── Gas Stations ──────────────────────────────────────────
  {
    id: 'infra-gas-1',
    name: 'QuikTrip Gas Station',
    category: 'gas_station',
    coordinates: { latitude: 38.6270, longitude: -90.1994 },
    notes: '24hr fuel, propane exchange available',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'infra-gas-2',
    name: "Casey's General Store",
    category: 'gas_station',
    coordinates: { latitude: 38.6350, longitude: -90.2050 },
    notes: 'Diesel and regular fuel, convenience store',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'infra-gas-3',
    name: 'Shell Station — Hwy 44',
    category: 'gas_station',
    coordinates: { latitude: 38.6170, longitude: -90.2150 },
    notes: 'Diesel, kerosene, air pump. Trucks welcome.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },

  // ── Hospitals & Medical ───────────────────────────────────
  {
    id: 'infra-hosp-1',
    name: 'Regional Medical Center',
    category: 'hospital',
    coordinates: { latitude: 38.6310, longitude: -90.1920 },
    notes: 'Level II trauma center, ER open 24/7',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'infra-hosp-2',
    name: 'Community Health Clinic',
    category: 'hospital',
    coordinates: { latitude: 38.6220, longitude: -90.2100 },
    notes: 'Urgent care, Mon-Sat 8am-8pm',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'infra-hosp-3',
    name: 'St. Louis Children\'s Hospital',
    category: 'hospital',
    coordinates: { latitude: 38.6360, longitude: -90.2630 },
    notes: 'Pediatric emergency, NICU, 24/7',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'infra-med-1',
    name: 'VA Medical Center',
    category: 'medical',
    coordinates: { latitude: 38.6420, longitude: -90.2640 },
    notes: 'Veterans health, emergency and mental health services',
    createdAt: '2024-01-01T00:00:00.000Z',
  },

  // ── Pharmacies ────────────────────────────────────────────
  {
    id: 'infra-pharm-1',
    name: 'Walgreens Pharmacy',
    category: 'pharmacy',
    coordinates: { latitude: 38.6290, longitude: -90.2030 },
    notes: 'Prescription meds, first aid supplies, OTC stock',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'infra-pharm-2',
    name: 'CVS Pharmacy',
    category: 'pharmacy',
    coordinates: { latitude: 38.6340, longitude: -90.1950 },
    notes: 'Drive-through pharmacy, 24hr location',
    createdAt: '2024-01-01T00:00:00.000Z',
  },

  // ── Police ────────────────────────────────────────────────
  {
    id: 'infra-police-1',
    name: 'City Police Department',
    category: 'police',
    coordinates: { latitude: 38.6240, longitude: -90.1960 },
    notes: 'Main precinct, dispatch center',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'infra-police-2',
    name: 'County Sheriff Substation',
    category: 'police',
    coordinates: { latitude: 38.6480, longitude: -90.2300 },
    notes: 'Patrol dispatch, evidence storage, holding cells',
    createdAt: '2024-01-01T00:00:00.000Z',
  },

  // ── Fire Stations ─────────────────────────────────────────
  {
    id: 'infra-fire-1',
    name: 'Fire Station #3',
    category: 'fire_station',
    coordinates: { latitude: 38.6330, longitude: -90.1890 },
    notes: 'Engine and ladder company, EMS response',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'infra-fire-2',
    name: 'Fire Station #7',
    category: 'fire_station',
    coordinates: { latitude: 38.6180, longitude: -90.2080 },
    notes: 'Rescue squad, hazmat team',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'infra-fire-3',
    name: 'Fire Station #12',
    category: 'fire_station',
    coordinates: { latitude: 38.6550, longitude: -90.2410 },
    notes: 'Wildland-urban interface unit, water tender',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

/**
 * Tactical POIs — rally points, water sources, shelters, supply caches,
 * comms points, and other operational locations for group coordination.
 */
export const defaultTacticalPois: POI[] = [
  // ── Rally Points (cohort meetup spots) ────────────────────
  {
    id: 'tac-rally-1',
    name: 'Rally Point Alpha',
    category: 'rally_point',
    coordinates: { latitude: 38.6280, longitude: -90.1980 },
    notes: 'Primary meetup — Forest Park southeast parking lot. Open area, multiple access roads, visible landmarks.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tac-rally-2',
    name: 'Rally Point Bravo',
    category: 'rally_point',
    coordinates: { latitude: 38.6410, longitude: -90.2250 },
    notes: 'Alternate meetup — Tower Grove Park pavilion. Covered shelter, secondary egress via side streets.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tac-rally-3',
    name: 'Rally Point Charlie',
    category: 'rally_point',
    coordinates: { latitude: 38.6150, longitude: -90.2300 },
    notes: 'Emergency fallback — Carondelet Park south entrance. Low traffic, concealed from main roads.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tac-rally-4',
    name: 'Bug-Out Staging Area',
    category: 'rally_point',
    coordinates: { latitude: 38.6600, longitude: -90.2500 },
    notes: 'Final muster before evacuation — I-44 on-ramp lot. Load vehicles, distribute supplies, headcount.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },

  // ── Water Sources ─────────────────────────────────────────
  {
    id: 'tac-water-1',
    name: 'Mississippi River Intake',
    category: 'water',
    coordinates: { latitude: 38.6200, longitude: -90.1800 },
    notes: 'River access point. Water MUST be filtered and purified. Sand pre-filter recommended. High volume.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tac-water-2',
    name: 'Forest Park Lake',
    category: 'water',
    coordinates: { latitude: 38.6295, longitude: -90.2010 },
    notes: 'Surface water lake. Boil or filter before drinking. Fishing possible. Rain-fed, seasonal levels.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tac-water-3',
    name: 'Artesian Well — City Park',
    category: 'water',
    coordinates: { latitude: 38.6370, longitude: -90.2380 },
    notes: 'Natural spring-fed well. Historically potable but test before drinking. Bring containers.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tac-water-4',
    name: 'Water Treatment Plant',
    category: 'water',
    coordinates: { latitude: 38.6100, longitude: -90.1900 },
    notes: 'Municipal water plant. May have emergency potable water during early stages of grid-down. Secure perimeter likely.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tac-water-5',
    name: 'Rainwater Collection Rooftop',
    category: 'water',
    coordinates: { latitude: 38.6315, longitude: -90.2150 },
    notes: 'Pre-identified flat rooftop with gutter system. Deploy tarps and collection barrels. Best after 10 min of rain (avoids debris).',
    createdAt: '2024-01-01T00:00:00.000Z',
  },

  // ── Shelters ──────────────────────────────────────────────
  {
    id: 'tac-shelter-1',
    name: 'Community Center Shelter',
    category: 'shelter',
    coordinates: { latitude: 38.6260, longitude: -90.2180 },
    notes: 'Designated emergency shelter. Capacity ~200. Backup generator. Kitchen facilities. Red Cross affiliated.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tac-shelter-2',
    name: 'St. Mark\'s Church',
    category: 'shelter',
    coordinates: { latitude: 38.6390, longitude: -90.2310 },
    notes: 'Basement shelter, reinforced. Capacity ~80. Has well water access and emergency radio.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tac-shelter-3',
    name: 'School Gymnasium — Jefferson',
    category: 'shelter',
    coordinates: { latitude: 38.6190, longitude: -90.2240 },
    notes: 'Gym with showers and locker rooms. Fenced perimeter. Capacity ~150. Adjacent sports field for tent expansion.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },

  // ── Supply Caches ─────────────────────────────────────────
  {
    id: 'tac-cache-1',
    name: 'Cache Alpha — Buried',
    category: 'supply_cache',
    coordinates: { latitude: 38.6275, longitude: -90.2045 },
    notes: 'PVC pipe cache, 3ft deep. Contents: 5 gal water, MREs (7-day), ammo, medical kit, fire starter. GPS only — no surface markers.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tac-cache-2',
    name: 'Cache Bravo — Attic',
    category: 'supply_cache',
    coordinates: { latitude: 38.6430, longitude: -90.2190 },
    notes: 'Residential attic stash. Contents: radio batteries, cash ($500 small bills), documents copies, maps, spare medication (rotated quarterly).',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tac-cache-3',
    name: 'Cache Charlie — Vehicle',
    category: 'supply_cache',
    coordinates: { latitude: 38.6300, longitude: -90.2100 },
    notes: 'Truck-mounted go-bag. Contents: 72-hr food/water, change of clothes, trauma kit, tool kit, tarp, cordage, multi-tool.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },

  // ── Comms Points (elevated / good propagation) ───────────
  {
    id: 'tac-comms-1',
    name: 'Comms Relay — Hilltop',
    category: 'comms',
    coordinates: { latitude: 38.6600, longitude: -90.2000 },
    notes: 'Highest elevation in area (~450ft). VHF/UHF line-of-sight to most of metro. Deploy portable mast here for extended range.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tac-comms-2',
    name: 'Comms Relay — Water Tower',
    category: 'comms',
    coordinates: { latitude: 38.6320, longitude: -90.2450 },
    notes: 'Base of water tower. Good ground plane for HF vertical antenna. Power line nearby for optional battery charging.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tac-comms-3',
    name: 'Dead Drop — Bridge Abutment',
    category: 'comms',
    coordinates: { latitude: 38.6210, longitude: -90.2280 },
    notes: 'Pre-arranged message drop point. Waterproof container under bridge. Check schedule: every 48hrs at 0600.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },

  // ── Hazards ───────────────────────────────────────────────
  {
    id: 'tac-hazard-1',
    name: 'Chemical Plant — Evacuation Zone',
    category: 'hazard',
    coordinates: { latitude: 38.6050, longitude: -90.1750 },
    notes: 'Industrial chemical storage. Downwind hazard if breached. Maintain 1-mile buffer. Avoid during Amber/Red alerts.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tac-hazard-2',
    name: 'Flood-Prone Underpass',
    category: 'hazard',
    coordinates: { latitude: 38.6180, longitude: -90.2000 },
    notes: 'Low-lying underpass. Impassable during heavy rain (2+ inches). Plan alternate route. Standing water hazard.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

/**
 * Default routes — pre-planned evacuation, supply, and patrol routes
 * with waypoints for immediate operational use.
 */
export const defaultRoutes: Route[] = [
  {
    id: 'route-default-evac-1',
    name: 'Bug-Out Route Alpha (West)',
    color: '#D4822A',
    waypoints: [
      { latitude: 38.6280, longitude: -90.1980 },
      { latitude: 38.6300, longitude: -90.2100 },
      { latitude: 38.6400, longitude: -90.2400 },
      { latitude: 38.6600, longitude: -90.2500 },
      { latitude: 38.6800, longitude: -90.2700 },
    ],
    notes: 'Primary evacuation west via I-44. Avoids downtown and chemical plant zone. Ends at rural staging area.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'route-default-evac-2',
    name: 'Bug-Out Route Bravo (South)',
    color: '#4A90D9',
    waypoints: [
      { latitude: 38.6280, longitude: -90.1980 },
      { latitude: 38.6150, longitude: -90.2050 },
      { latitude: 38.6000, longitude: -90.2150 },
      { latitude: 38.5800, longitude: -90.2300 },
      { latitude: 38.5500, longitude: -90.2500 },
    ],
    notes: 'Alternate evacuation south via I-55. Use if I-44 is compromised. Passes near water source intake.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'route-default-supply-1',
    name: 'Supply Run — Medical & Pharmacy',
    color: '#CC3333',
    waypoints: [
      { latitude: 38.6280, longitude: -90.1980 },
      { latitude: 38.6310, longitude: -90.1920 },
      { latitude: 38.6290, longitude: -90.2030 },
      { latitude: 38.6340, longitude: -90.1950 },
      { latitude: 38.6280, longitude: -90.1980 },
    ],
    notes: 'Loop route: Rally Alpha → Hospital → Walgreens → CVS → back. Total ~6 miles. Scouted for fuel and med resupply.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'route-default-recon-1',
    name: 'Recon Patrol — Perimeter',
    color: '#4CAF50',
    waypoints: [
      { latitude: 38.6280, longitude: -90.1980 },
      { latitude: 38.6480, longitude: -90.1900 },
      { latitude: 38.6500, longitude: -90.2200 },
      { latitude: 38.6400, longitude: -90.2450 },
      { latitude: 38.6200, longitude: -90.2400 },
      { latitude: 38.6100, longitude: -90.2100 },
      { latitude: 38.6280, longitude: -90.1980 },
    ],
    notes: '7-point perimeter patrol covering key infrastructure and observation points. ~18 miles. 2-person team recommended.',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

/** All seed POIs combined for AppProvider initialization */
export const allSeedPois: POI[] = [...defaultInfrastructurePois, ...defaultTacticalPois];

