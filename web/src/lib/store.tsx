import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AlertLevel,
  AppData,
  AreaStudy,
  Checklist,
  ChecklistItem,
  CommsChannel,
  CommsRepeater,
  Coordinates,
  EquipmentItem,
  GroupMember,
  KiwixResource,
  POI,
  Route,
  SupplyItem,
  Threat,
} from '@/lib/types';
import { defaultMembers } from '@/lib/data/members';
import { seedSupplies, seedEquipment } from '@/lib/data/supplies';
import { defaultChecklists } from '@/lib/data/checklists';
import { defaultCommsChannels, defaultCommsRepeaters } from '@/lib/data/comms';
import { kiwixCatalog } from '@/lib/data/kiwix';
import { allSeedPois, defaultRoutes as seedRoutes, generateLocalPois, generateLocalRoutes } from '@/lib/data/pois';
import { parseOpsBackup, serializeOpsBackup } from '@/lib/opsBackup';
import { areaStudyProgress, makeEmptyAreaStudy } from '@/lib/data/areaStudy';

const STORAGE_KEY = 'griddown_app_data';
const DATA_VERSION_KEY = 'griddown_data_version';
const ONBOARDING_KEY = 'griddown_onboarding_complete';
const CURRENT_DATA_VERSION = 5;
const DEFAULT_CHECK_IN_HOURS = 6;

const defaultAppData: AppData = {
  alertLevel: 'green',
  groupName: 'My Group',
  checkInIntervalHours: DEFAULT_CHECK_IN_HOURS,
  remindersEnabled: false,
  shakeSosEnabled: true,
  members: defaultMembers,
  supplies: seedSupplies,
  checklists: defaultChecklists,
  pois: allSeedPois,
  routes: seedRoutes,
  commsChannels: defaultCommsChannels,
  commsRepeaters: defaultCommsRepeaters,
  kiwixLibrary: [],
  equipment: seedEquipment,
  threats: [],
  areaStudy: makeEmptyAreaStudy(),
};

/** One-shot location acquisition for first-launch POI seeding. */
async function acquireSeedLocation(): Promise<Coordinates | null> {
  if (!navigator.geolocation) return null;
  return new Promise<Coordinates | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => resolve(null),
      { timeout: 4000 }
    );
  });
}

interface AppContextValue {
  alertLevel: AlertLevel;
  groupName: string;
  checkInIntervalHours: number;
  remindersEnabled: boolean;
  shakeSosEnabled: boolean;
  biometricLockEnabled: boolean;
  members: GroupMember[];
  supplies: SupplyItem[];
  checklists: Checklist[];
  pois: POI[];
  routes: Route[];
  commsChannels: CommsChannel[];
  commsRepeaters: CommsRepeater[];
  kiwixLibrary: KiwixResource[];
  equipment: EquipmentItem[];
  threats: Threat[];
  areaStudy: AreaStudy;
  addEquipment: (item: EquipmentItem) => void;
  updateEquipment: (item: EquipmentItem) => void;
  removeEquipment: (id: string) => void;
  addThreat: (threat: Threat) => void;
  updateThreat: (threat: Threat) => void;
  removeThreat: (id: string) => void;
  updateAreaStudySection: (sectionId: string, content: string) => void;
  onboardingComplete: boolean;
  completeOnboarding: (groupName: string, level: AlertLevel) => void;
  updateAlertLevel: (level: AlertLevel) => void;
  updateGroupName: (name: string) => void;
  updateCheckInInterval: (hours: number) => void;
  updateRemindersEnabled: (enabled: boolean) => void;
  updateShakeSos: (enabled: boolean) => void;
  updateBiometricLock: (enabled: boolean) => void;
  checkInMember: (id: string) => void;
  addMember: (member: GroupMember) => void;
  updateMember: (member: GroupMember) => void;
  removeMember: (id: string) => void;
  updateMemberLocation: (memberId: string, location: Coordinates) => void;
  addSupply: (item: SupplyItem) => void;
  updateSupply: (item: SupplyItem) => void;
  removeSupply: (id: string) => void;
  toggleChecklistItem: (checklistId: string, itemId: string) => void;
  addChecklistItem: (checklistId: string, item: ChecklistItem) => void;
  removeChecklistItem: (checklistId: string, itemId: string) => void;
  addChecklist: (checklist: Checklist) => void;
  removeChecklist: (id: string) => void;
  addPoi: (poi: POI) => void;
  updatePoi: (poi: POI) => void;
  removePoi: (id: string) => void;
  addRoute: (route: Route) => void;
  updateRoute: (route: Route) => void;
  removeRoute: (id: string) => void;
  addCommsChannel: (channel: CommsChannel) => void;
  updateCommsChannel: (channel: CommsChannel) => void;
  removeCommsChannel: (id: string) => void;
  addCommsRepeater: (repeater: CommsRepeater) => void;
  updateCommsRepeater: (repeater: CommsRepeater) => void;
  removeCommsRepeater: (id: string) => void;
  saveKiwixResource: (resource: KiwixResource) => void;
  removeKiwixResource: (id: string) => void;
  supplyStats: { total: number; low: number; categories: number };
  checklistStats: { id: string; total: number; completed: number; percent: number }[];
  exportOpsBackup: () => string;
  importOpsBackup: (raw: string) => boolean;
  currentSnapshot: () => AppData;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [alertLevel, setAlertLevel] = useState<AlertLevel>('green');
  const [groupName, setGroupName] = useState('My Group');
  const [checkInIntervalHours, setCheckInIntervalHours] = useState(DEFAULT_CHECK_IN_HOURS);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [shakeSosEnabled, setShakeSosEnabled] = useState(true);
  const [biometricLockEnabled, setBiometricLockEnabled] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>(defaultMembers);
  const [supplies, setSupplies] = useState<SupplyItem[]>(seedSupplies);
  const [checklists, setChecklists] = useState<Checklist[]>(defaultChecklists);
  const [pois, setPois] = useState<POI[]>(allSeedPois);
  const [routes, setRoutes] = useState<Route[]>(seedRoutes);
  const [commsChannels, setCommsChannels] = useState<CommsChannel[]>(defaultCommsChannels);
  const [commsRepeaters, setCommsRepeaters] = useState<CommsRepeater[]>(defaultCommsRepeaters);
  const [kiwixLibrary, setKiwixLibrary] = useState<KiwixResource[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>(seedEquipment);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [areaStudy, setAreaStudy] = useState<AreaStudy>(makeEmptyAreaStudy());
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(() => localStorage.getItem(ONBOARDING_KEY) === 'true');
  const [loaded, setLoaded] = useState(false);

  // Load once, merging missing seed content for returning users (data versioning).
  useEffect(() => {
    (async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AppData;
          const versionStr = localStorage.getItem(DATA_VERSION_KEY);
          const savedVersion = versionStr ? parseInt(versionStr, 10) : 0;
          if (savedVersion < CURRENT_DATA_VERSION) {
            const mergeById = <T extends { id: string }>(existing: T[] | undefined, seeds: T[]): T[] => {
              const ids = new Set((existing ?? []).map((e) => e.id));
              const missing = seeds.filter((s) => !ids.has(s.id));
              return [...(existing ?? []), ...missing];
            };
            parsed.pois = mergeById(parsed.pois, allSeedPois);
            parsed.routes = mergeById(parsed.routes, seedRoutes);
            parsed.checklists = mergeById(parsed.checklists ?? [], defaultChecklists);
            parsed.supplies = mergeById(parsed.supplies ?? [], seedSupplies);
            parsed.equipment = mergeById(parsed.equipment ?? [], seedEquipment);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            localStorage.setItem(DATA_VERSION_KEY, String(CURRENT_DATA_VERSION));
          }
          applyData(parsed);
        } else {
          // First launch — seed POIs/routes around the user's actual location
          // when possible, falling back to the bundled St. Louis demo data.
          const seedData: AppData = { ...defaultAppData };
          const loc = await acquireSeedLocation();
          if (loc) {
            seedData.pois = generateLocalPois(loc);
            seedData.routes = generateLocalRoutes(loc);
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
          localStorage.setItem(DATA_VERSION_KEY, String(CURRENT_DATA_VERSION));
          applyData(seedData);
        }
      } catch (e) {
        console.log('Error loading app data:', e);
        applyData(defaultAppData);
      }
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyData = (d: AppData) => {
    setAlertLevel(d.alertLevel ?? 'green');
    setGroupName(d.groupName ?? 'My Group');
    setCheckInIntervalHours(d.checkInIntervalHours ?? DEFAULT_CHECK_IN_HOURS);
    setRemindersEnabled(d.remindersEnabled ?? false);
    setShakeSosEnabled(d.shakeSosEnabled ?? true);
    setMembers(d.members ?? defaultMembers);
    setSupplies(d.supplies ?? []);
    setChecklists(d.checklists ?? []);
    setPois(d.pois ?? []);
    setRoutes(d.routes ?? []);
    setCommsChannels(d.commsChannels ?? defaultCommsChannels);
    setCommsRepeaters(d.commsRepeaters ?? defaultCommsRepeaters);
    setKiwixLibrary(d.kiwixLibrary ?? []);
    setEquipment(d.equipment ?? []);
    setThreats(d.threats ?? []);
    setAreaStudy(d.areaStudy ?? makeEmptyAreaStudy());
  };

  const persistData = useCallback(
    (overrides: Partial<AppData>) => {
      const data: AppData = {
        alertLevel,
        groupName,
        checkInIntervalHours,
        remindersEnabled,
        shakeSosEnabled,
        members,
        supplies,
        checklists,
        pois,
        routes,
        commsChannels,
        commsRepeaters,
        kiwixLibrary,
        equipment,
        threats,
        areaStudy,
        ...overrides,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.log('Failed to persist data:', e);
      }
    },
    [alertLevel, groupName, checkInIntervalHours, remindersEnabled, shakeSosEnabled, members, supplies, checklists, pois, routes, commsChannels, commsRepeaters, kiwixLibrary, equipment, threats, areaStudy]
  );

  const updateAlertLevel = useCallback((level: AlertLevel) => {
    setAlertLevel(level);
    persistData({ alertLevel: level });
  }, [persistData]);

  const updateGroupName = useCallback((name: string) => {
    setGroupName(name);
    persistData({ groupName: name });
  }, [persistData]);

  const updateCheckInInterval = useCallback((hours: number) => {
    setCheckInIntervalHours(hours);
    persistData({ checkInIntervalHours: hours });
  }, [persistData]);

  const updateRemindersEnabled = useCallback((enabled: boolean) => {
    setRemindersEnabled(enabled);
    persistData({ remindersEnabled: enabled });
  }, [persistData]);

  const updateShakeSos = useCallback((enabled: boolean) => {
    setShakeSosEnabled(enabled);
    persistData({ shakeSosEnabled: enabled });
  }, [persistData]);

  const updateBiometricLock = useCallback((enabled: boolean) => {
    setBiometricLockEnabled(enabled);
    persistData({ biometricLockEnabled: enabled });
  }, [persistData]);

  const checkInMember = useCallback((id: string) => {
    const now = new Date().toISOString();
    const updated = members.map((m) => (m.id === id ? { ...m, lastCheckInAt: now } : m));
    setMembers(updated);
    persistData({ members: updated });
  }, [members, persistData]);

  const addMember = useCallback((member: GroupMember) => {
    const updated = [...members, member];
    setMembers(updated);
    persistData({ members: updated });
  }, [members, persistData]);

  const updateMember = useCallback((member: GroupMember) => {
    const updated = members.map((m) => (m.id === member.id ? member : m));
    setMembers(updated);
    persistData({ members: updated });
  }, [members, persistData]);

  const removeMember = useCallback((id: string) => {
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    persistData({ members: updated });
  }, [members, persistData]);

  const updateMemberLocation = useCallback((memberId: string, location: Coordinates) => {
    const updated = members.map((m) =>
      m.id === memberId ? { ...m, location, locationUpdatedAt: new Date().toISOString() } : m
    );
    setMembers(updated);
    persistData({ members: updated });
  }, [members, persistData]);

  const addSupply = useCallback((item: SupplyItem) => {
    const updated = [...supplies, item];
    setSupplies(updated);
    persistData({ supplies: updated });
  }, [supplies, persistData]);

  const updateSupply = useCallback((item: SupplyItem) => {
    const updated = supplies.map((s) => (s.id === item.id ? item : s));
    setSupplies(updated);
    persistData({ supplies: updated });
  }, [supplies, persistData]);

  const removeSupply = useCallback((id: string) => {
    const updated = supplies.filter((s) => s.id !== id);
    setSupplies(updated);
    persistData({ supplies: updated });
  }, [supplies, persistData]);

  const toggleChecklistItem = useCallback((checklistId: string, itemId: string) => {
    const updated = checklists.map((cl) => {
      if (cl.id === checklistId) {
        return {
          ...cl,
          lastUpdated: new Date().toISOString(),
          items: cl.items.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        };
      }
      return cl;
    });
    setChecklists(updated);
    persistData({ checklists: updated });
  }, [checklists, persistData]);

  const addChecklistItem = useCallback((checklistId: string, item: ChecklistItem) => {
    const updated = checklists.map((cl) => {
      if (cl.id === checklistId) {
        return { ...cl, lastUpdated: new Date().toISOString(), items: [...cl.items, item] };
      }
      return cl;
    });
    setChecklists(updated);
    persistData({ checklists: updated });
  }, [checklists, persistData]);

  const removeChecklistItem = useCallback((checklistId: string, itemId: string) => {
    const updated = checklists.map((cl) => {
      if (cl.id === checklistId) {
        return { ...cl, lastUpdated: new Date().toISOString(), items: cl.items.filter((item) => item.id !== itemId) };
      }
      return cl;
    });
    setChecklists(updated);
    persistData({ checklists: updated });
  }, [checklists, persistData]);

  const addChecklist = useCallback((checklist: Checklist) => {
    const updated = [...checklists, checklist];
    setChecklists(updated);
    persistData({ checklists: updated });
  }, [checklists, persistData]);

  const removeChecklist = useCallback((id: string) => {
    const updated = checklists.filter((cl) => cl.id !== id);
    setChecklists(updated);
    persistData({ checklists: updated });
  }, [checklists, persistData]);

  const addPoi = useCallback((poi: POI) => {
    const updated = [...pois, poi];
    setPois(updated);
    persistData({ pois: updated });
  }, [pois, persistData]);

  const updatePoi = useCallback((poi: POI) => {
    const updated = pois.map((p) => (p.id === poi.id ? poi : p));
    setPois(updated);
    persistData({ pois: updated });
  }, [pois, persistData]);

  const removePoi = useCallback((id: string) => {
    const updated = pois.filter((p) => p.id !== id);
    setPois(updated);
    persistData({ pois: updated });
  }, [pois, persistData]);

  const addRoute = useCallback((route: Route) => {
    const updated = [...routes, route];
    setRoutes(updated);
    persistData({ routes: updated });
  }, [routes, persistData]);

  const updateRoute = useCallback((route: Route) => {
    const updated = routes.map((r) => (r.id === route.id ? route : r));
    setRoutes(updated);
    persistData({ routes: updated });
  }, [routes, persistData]);

  const removeRoute = useCallback((id: string) => {
    const updated = routes.filter((r) => r.id !== id);
    setRoutes(updated);
    persistData({ routes: updated });
  }, [routes, persistData]);

  const addCommsChannel = useCallback((channel: CommsChannel) => {
    const updated = [...commsChannels, channel];
    setCommsChannels(updated);
    persistData({ commsChannels: updated });
  }, [commsChannels, persistData]);

  const updateCommsChannel = useCallback((channel: CommsChannel) => {
    const updated = commsChannels.map((c) => (c.id === channel.id ? channel : c));
    setCommsChannels(updated);
    persistData({ commsChannels: updated });
  }, [commsChannels, persistData]);

  const removeCommsChannel = useCallback((id: string) => {
    const updated = commsChannels.filter((c) => c.id !== id);
    setCommsChannels(updated);
    persistData({ commsChannels: updated });
  }, [commsChannels, persistData]);

  const addCommsRepeater = useCallback((repeater: CommsRepeater) => {
    const updated = [...commsRepeaters, repeater];
    setCommsRepeaters(updated);
    persistData({ commsRepeaters: updated });
  }, [commsRepeaters, persistData]);

  const updateCommsRepeater = useCallback((repeater: CommsRepeater) => {
    const updated = commsRepeaters.map((r) => (r.id === repeater.id ? repeater : r));
    setCommsRepeaters(updated);
    persistData({ commsRepeaters: updated });
  }, [commsRepeaters, persistData]);

  const removeCommsRepeater = useCallback((id: string) => {
    const updated = commsRepeaters.filter((r) => r.id !== id);
    setCommsRepeaters(updated);
    persistData({ commsRepeaters: updated });
  }, [commsRepeaters, persistData]);

  const saveKiwixResource = useCallback((resource: KiwixResource) => {
    const exists = kiwixLibrary.find((r) => r.id === resource.id);
    if (exists) return;
    const saved: KiwixResource = { ...resource, status: 'saved', savedAt: new Date().toISOString() };
    const updated = [...kiwixLibrary, saved];
    setKiwixLibrary(updated);
    persistData({ kiwixLibrary: updated });
  }, [kiwixLibrary, persistData]);

  const removeKiwixResource = useCallback((id: string) => {
    const updated = kiwixLibrary.filter((r) => r.id !== id);
    setKiwixLibrary(updated);
    persistData({ kiwixLibrary: updated });
  }, [kiwixLibrary, persistData]);

  const addEquipment = useCallback((item: EquipmentItem) => {
    const updated = [...equipment, item];
    setEquipment(updated);
    persistData({ equipment: updated });
  }, [equipment, persistData]);

  const updateEquipment = useCallback((item: EquipmentItem) => {
    const updated = equipment.map((e) => (e.id === item.id ? item : e));
    setEquipment(updated);
    persistData({ equipment: updated });
  }, [equipment, persistData]);

  const removeEquipment = useCallback((id: string) => {
    const updated = equipment.filter((e) => e.id !== id);
    setEquipment(updated);
    persistData({ equipment: updated });
  }, [equipment, persistData]);

  const addThreat = useCallback((threat: Threat) => {
    const updated = [...threats, threat];
    setThreats(updated);
    persistData({ threats: updated });
  }, [threats, persistData]);

  const updateThreat = useCallback((threat: Threat) => {
    const updated = threats.map((t) => (t.id === threat.id ? threat : t));
    setThreats(updated);
    persistData({ threats: updated });
  }, [threats, persistData]);

  const removeThreat = useCallback((id: string) => {
    const updated = threats.filter((t) => t.id !== id);
    setThreats(updated);
    persistData({ threats: updated });
  }, [threats, persistData]);

  const updateAreaStudySection = useCallback((sectionId: string, content: string) => {
    setAreaStudy((prev) => {
      const sections = [...prev.sections];
      const idx = sections.findIndex((s) => s.id === sectionId);
      const updated: AreaStudy = {
        sections: idx >= 0 ? sections.map((s, i) => (i === idx ? { ...s, content } : s)) : [...sections, { id: sectionId, content }],
        updatedAt: new Date().toISOString(),
      };
      try {
        const data: AppData = {
          alertLevel,
          groupName,
          checkInIntervalHours,
          remindersEnabled,
          shakeSosEnabled,
          members,
          supplies,
          checklists,
          pois,
          routes,
          commsChannels,
          commsRepeaters,
          kiwixLibrary,
          equipment,
          threats,
          areaStudy: updated,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.log('Failed to persist area study:', e);
      }
      return updated;
    });
  }, [alertLevel, groupName, checkInIntervalHours, remindersEnabled, shakeSosEnabled, members, supplies, checklists, pois, routes, commsChannels, commsRepeaters, kiwixLibrary, equipment, threats]);

  const supplyStats = useMemo(() => {
    const total = supplies.length;
    const low = supplies.filter((s) => s.quantity <= s.minimumQuantity).length;
    const categories = [...new Set(supplies.map((s) => s.category))].length;
    return { total, low, categories };
  }, [supplies]);

  const checklistStats = useMemo(() => {
    return checklists.map((cl) => {
      const total = cl.items.length;
      const completed = cl.items.filter((i) => i.completed).length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { id: cl.id, total, completed, percent };
    });
  }, [checklists]);

  const currentSnapshot = useCallback((): AppData => ({
    alertLevel,
    groupName,
    checkInIntervalHours,
    remindersEnabled,
    shakeSosEnabled,
    members,
    supplies,
    checklists,
    pois,
    routes,
    commsChannels,
    commsRepeaters,
    kiwixLibrary,
    equipment,
    threats,
    areaStudy,
  }), [alertLevel, groupName, checkInIntervalHours, remindersEnabled, shakeSosEnabled, members, supplies, checklists, pois, routes, commsChannels, commsRepeaters, kiwixLibrary, equipment, threats, areaStudy]);

  const exportOpsBackup = useCallback(() => serializeOpsBackup(currentSnapshot()), [currentSnapshot]);

  const importOpsBackup = useCallback((raw: string): boolean => {
    const parsed = parseOpsBackup(raw);
    if (!parsed) return false;
    applyData(parsed);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      localStorage.setItem(DATA_VERSION_KEY, String(CURRENT_DATA_VERSION));
    } catch (e) {
      console.log('Failed to persist import:', e);
    }
    return true;
  }, []);

  const completeOnboarding = useCallback((name: string, level: AlertLevel) => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboardingComplete(true);
    if (name.trim()) updateGroupName(name.trim());
    updateAlertLevel(level);
  }, [updateGroupName, updateAlertLevel]);

  const value: AppContextValue = {
    alertLevel,
    groupName,
    checkInIntervalHours,
    remindersEnabled,
    shakeSosEnabled,
    biometricLockEnabled,
    members,
    supplies,
    checklists,
    pois,
    routes,
    commsChannels,
    commsRepeaters,
    kiwixLibrary,
    equipment,
    threats,
    areaStudy,
    addEquipment,
    updateEquipment,
    removeEquipment,
    addThreat,
    updateThreat,
    removeThreat,
    updateAreaStudySection,
    onboardingComplete,
    completeOnboarding,
    updateAlertLevel,
    updateGroupName,
    updateCheckInInterval,
    updateRemindersEnabled,
    updateShakeSos,
    updateBiometricLock,
    checkInMember,
    addMember,
    updateMember,
    removeMember,
    updateMemberLocation,
    addSupply,
    updateSupply,
    removeSupply,
    toggleChecklistItem,
    addChecklistItem,
    removeChecklistItem,
    addChecklist,
    removeChecklist,
    addPoi,
    updatePoi,
    removePoi,
    addRoute,
    updateRoute,
    removeRoute,
    addCommsChannel,
    updateCommsChannel,
    removeCommsChannel,
    addCommsRepeater,
    updateCommsRepeater,
    removeCommsRepeater,
    saveKiwixResource,
    removeKiwixResource,
    supplyStats,
    checklistStats,
    exportOpsBackup,
    importOpsBackup,
    currentSnapshot,
  };

  return <AppContext.Provider value={value}>{loaded ? children : <Splash />}</AppContext.Provider>;
}

function Splash() {
  return (
    <div className="min-h-screen bg-[#1A1D1A] gd-grid-bg flex items-center justify-center">
      <div className="text-center animate-pulse">
        <div className="text-[10px] gd-label text-[#6A6860] tracking-[0.3em]">GRIDDOWN</div>
        <div className="text-[10px] text-[#4A504A] mt-2">INITIALIZING…</div>
      </div>
    </div>
  );
}

export function useAppData(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppData must be used within AppProvider');
  return ctx;
}
