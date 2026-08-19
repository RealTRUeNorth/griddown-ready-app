import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { defaultChecklists } from '@/mocks/checklists';
import { defaultMembers } from '@/mocks/members';
import {
  AlertLevel,
  GroupMember,
  SupplyItem,
  Checklist,
  ChecklistItem,
  AppData,
  POI,
  Route,
  Coordinates,
  CommsChannel,
  CommsRepeater,
  KiwixResource,
} from '@/types';
import { defaultCommsChannels, defaultCommsRepeaters } from '@/mocks/comms';
import { kiwixCatalog } from '@/mocks/kiwix';
import { allSeedPois, defaultRoutes as seedRoutes } from '@/mocks/pois';
import { seedSupplies } from '@/mocks/supplies';
import { parseOpsBackup, serializeOpsBackup } from '@/utils/opsBackup';

const STORAGE_KEY = 'griddown_app_data';
const DATA_VERSION_KEY = 'griddown_data_version';
const CURRENT_DATA_VERSION = 3; // Bumped when seed supplies added
const DEFAULT_CHECK_IN_HOURS = 6;

const defaultAppData: AppData = {
  alertLevel: 'green',
  groupName: 'My Group',
  checkInIntervalHours: DEFAULT_CHECK_IN_HOURS,
  members: defaultMembers,
  supplies: seedSupplies,
  checklists: defaultChecklists,
  pois: allSeedPois,
  routes: seedRoutes,
  commsChannels: defaultCommsChannels,
  commsRepeaters: defaultCommsRepeaters,
  kiwixLibrary: [],
};

export const [AppProvider, useAppData] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [alertLevel, setAlertLevel] = useState<AlertLevel>('green');
  const [groupName, setGroupName] = useState<string>('My Group');
  const [checkInIntervalHours, setCheckInIntervalHours] = useState<number>(DEFAULT_CHECK_IN_HOURS);
  const [members, setMembers] = useState<GroupMember[]>(defaultMembers);
  const [supplies, setSupplies] = useState<SupplyItem[]>(seedSupplies);
  const [checklists, setChecklists] = useState<Checklist[]>(defaultChecklists);
  const [pois, setPois] = useState<POI[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [commsChannels, setCommsChannels] = useState<CommsChannel[]>(defaultCommsChannels);
  const [commsRepeaters, setCommsRepeaters] = useState<CommsRepeater[]>(defaultCommsRepeaters);
  const [kiwixLibrary, setKiwixLibrary] = useState<KiwixResource[]>([]);

  const dataQuery = useQuery({
    queryKey: ['appData'],
    queryFn: async (): Promise<AppData> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AppData;
          // Merge any missing seed POIs and routes into saved data
          // This ensures new seed data appears even if the user has existing data
          const versionStr = await AsyncStorage.getItem(DATA_VERSION_KEY);
          const savedVersion = versionStr ? parseInt(versionStr, 10) : 0;
          if (savedVersion < CURRENT_DATA_VERSION) {
            const existingPoiIds = new Set(parsed.pois.map((p) => p.id));
            const missingPois = allSeedPois.filter((p) => !existingPoiIds.has(p.id));
            if (missingPois.length > 0) {
              parsed.pois = [...parsed.pois, ...missingPois];
            }
            const existingRouteIds = new Set(parsed.routes.map((r) => r.id));
            const missingRoutes = seedRoutes.filter((r) => !existingRouteIds.has(r.id));
            if (missingRoutes.length > 0) {
              parsed.routes = [...parsed.routes, ...missingRoutes];
            }
            if (!parsed.supplies || parsed.supplies.length === 0) {
              parsed.supplies = seedSupplies;
            }
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            await AsyncStorage.setItem(DATA_VERSION_KEY, String(CURRENT_DATA_VERSION));
          }
          return parsed;
        }
        // No saved data — write defaults and version
        await AsyncStorage.setItem(DATA_VERSION_KEY, String(CURRENT_DATA_VERSION));
      } catch (e) {
        console.log('Error loading app data:', e);
      }
      return defaultAppData;
    },
  });

  useEffect(() => {
    if (dataQuery.data) {
      setAlertLevel(dataQuery.data.alertLevel);
      setGroupName(dataQuery.data.groupName);
      setCheckInIntervalHours(dataQuery.data.checkInIntervalHours ?? DEFAULT_CHECK_IN_HOURS);
      setMembers(dataQuery.data.members);
      setSupplies(dataQuery.data.supplies);
      setChecklists(dataQuery.data.checklists);
      setPois(dataQuery.data.pois ?? []);
      setRoutes(dataQuery.data.routes ?? []);
      setCommsChannels(dataQuery.data.commsChannels ?? defaultCommsChannels);
      setCommsRepeaters(dataQuery.data.commsRepeaters ?? defaultCommsRepeaters);
      setKiwixLibrary(dataQuery.data.kiwixLibrary ?? []);
    }
  }, [dataQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (data: AppData) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appData'] });
    },
  });

  const persistData = useCallback(
    (overrides: Partial<AppData>) => {
      const data: AppData = {
        alertLevel,
        groupName,
        checkInIntervalHours,
        members,
        supplies,
        checklists,
        pois,
        routes,
        commsChannels,
        commsRepeaters,
        kiwixLibrary,
        ...overrides,
      };
      saveMutation.mutate(data);
    },
    [alertLevel, groupName, checkInIntervalHours, members, supplies, checklists, pois, routes, commsChannels, commsRepeaters, kiwixLibrary, saveMutation]
  );

  const updateAlertLevel = useCallback(
    (level: AlertLevel) => {
      setAlertLevel(level);
      persistData({ alertLevel: level });
    },
    [persistData]
  );

  const updateGroupName = useCallback(
    (name: string) => {
      setGroupName(name);
      persistData({ groupName: name });
    },
    [persistData]
  );

  const updateCheckInInterval = useCallback(
    (hours: number) => {
      setCheckInIntervalHours(hours);
      persistData({ checkInIntervalHours: hours });
    },
    [persistData]
  );

  const checkInMember = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      const updated = members.map((m) => (m.id === id ? { ...m, lastCheckInAt: now } : m));
      setMembers(updated);
      persistData({ members: updated });
    },
    [members, persistData]
  );

  const addMember = useCallback(
    (member: GroupMember) => {
      const updated = [...members, member];
      setMembers(updated);
      persistData({ members: updated });
    },
    [members, persistData]
  );

  const updateMember = useCallback(
    (member: GroupMember) => {
      const updated = members.map((m) => (m.id === member.id ? member : m));
      setMembers(updated);
      persistData({ members: updated });
    },
    [members, persistData]
  );

  const removeMember = useCallback(
    (id: string) => {
      const updated = members.filter((m) => m.id !== id);
      setMembers(updated);
      persistData({ members: updated });
    },
    [members, persistData]
  );

  const addSupply = useCallback(
    (item: SupplyItem) => {
      const updated = [...supplies, item];
      setSupplies(updated);
      persistData({ supplies: updated });
    },
    [supplies, persistData]
  );

  const updateSupply = useCallback(
    (item: SupplyItem) => {
      const updated = supplies.map((s) => (s.id === item.id ? item : s));
      setSupplies(updated);
      persistData({ supplies: updated });
    },
    [supplies, persistData]
  );

  const removeSupply = useCallback(
    (id: string) => {
      const updated = supplies.filter((s) => s.id !== id);
      setSupplies(updated);
      persistData({ supplies: updated });
    },
    [supplies, persistData]
  );

  const toggleChecklistItem = useCallback(
    (checklistId: string, itemId: string) => {
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
    },
    [checklists, persistData]
  );

  const addChecklistItem = useCallback(
    (checklistId: string, item: ChecklistItem) => {
      const updated = checklists.map((cl) => {
        if (cl.id === checklistId) {
          return {
            ...cl,
            lastUpdated: new Date().toISOString(),
            items: [...cl.items, item],
          };
        }
        return cl;
      });
      setChecklists(updated);
      persistData({ checklists: updated });
    },
    [checklists, persistData]
  );

  const removeChecklistItem = useCallback(
    (checklistId: string, itemId: string) => {
      const updated = checklists.map((cl) => {
        if (cl.id === checklistId) {
          return {
            ...cl,
            lastUpdated: new Date().toISOString(),
            items: cl.items.filter((item) => item.id !== itemId),
          };
        }
        return cl;
      });
      setChecklists(updated);
      persistData({ checklists: updated });
    },
    [checklists, persistData]
  );

  const updateMemberLocation = useCallback(
    (memberId: string, location: Coordinates) => {
      const updated = members.map((m) =>
        m.id === memberId
          ? { ...m, location, locationUpdatedAt: new Date().toISOString() }
          : m
      );
      setMembers(updated);
      persistData({ members: updated });
    },
    [members, persistData]
  );

  const addPoi = useCallback(
    (poi: POI) => {
      const updated = [...pois, poi];
      setPois(updated);
      persistData({ pois: updated });
    },
    [pois, persistData]
  );

  const updatePoi = useCallback(
    (poi: POI) => {
      const updated = pois.map((p) => (p.id === poi.id ? poi : p));
      setPois(updated);
      persistData({ pois: updated });
    },
    [pois, persistData]
  );

  const removePoi = useCallback(
    (id: string) => {
      const updated = pois.filter((p) => p.id !== id);
      setPois(updated);
      persistData({ pois: updated });
    },
    [pois, persistData]
  );

  const addRoute = useCallback(
    (route: Route) => {
      const updated = [...routes, route];
      setRoutes(updated);
      persistData({ routes: updated });
    },
    [routes, persistData]
  );

  const updateRoute = useCallback(
    (route: Route) => {
      const updated = routes.map((r) => (r.id === route.id ? route : r));
      setRoutes(updated);
      persistData({ routes: updated });
    },
    [routes, persistData]
  );

  const removeRoute = useCallback(
    (id: string) => {
      const updated = routes.filter((r) => r.id !== id);
      setRoutes(updated);
      persistData({ routes: updated });
    },
    [routes, persistData]
  );

  const addCommsChannel = useCallback(
    (channel: CommsChannel) => {
      const updated = [...commsChannels, channel];
      setCommsChannels(updated);
      persistData({ commsChannels: updated });
    },
    [commsChannels, persistData]
  );

  const updateCommsChannel = useCallback(
    (channel: CommsChannel) => {
      const updated = commsChannels.map((c) => (c.id === channel.id ? channel : c));
      setCommsChannels(updated);
      persistData({ commsChannels: updated });
    },
    [commsChannels, persistData]
  );

  const removeCommsChannel = useCallback(
    (id: string) => {
      const updated = commsChannels.filter((c) => c.id !== id);
      setCommsChannels(updated);
      persistData({ commsChannels: updated });
    },
    [commsChannels, persistData]
  );

  const addCommsRepeater = useCallback(
    (repeater: CommsRepeater) => {
      const updated = [...commsRepeaters, repeater];
      setCommsRepeaters(updated);
      persistData({ commsRepeaters: updated });
    },
    [commsRepeaters, persistData]
  );

  const updateCommsRepeater = useCallback(
    (repeater: CommsRepeater) => {
      const updated = commsRepeaters.map((r) => (r.id === repeater.id ? repeater : r));
      setCommsRepeaters(updated);
      persistData({ commsRepeaters: updated });
    },
    [commsRepeaters, persistData]
  );

  const removeCommsRepeater = useCallback(
    (id: string) => {
      const updated = commsRepeaters.filter((r) => r.id !== id);
      setCommsRepeaters(updated);
      persistData({ commsRepeaters: updated });
    },
    [commsRepeaters, persistData]
  );

  const addChecklist = useCallback(
    (checklist: Checklist) => {
      const updated = [...checklists, checklist];
      setChecklists(updated);
      persistData({ checklists: updated });
    },
    [checklists, persistData]
  );

  const saveKiwixResource = useCallback(
    (resource: KiwixResource) => {
      const exists = kiwixLibrary.find((r) => r.id === resource.id);
      if (exists) return;
      const saved: KiwixResource = { ...resource, status: 'saved', savedAt: new Date().toISOString() };
      const updated = [...kiwixLibrary, saved];
      setKiwixLibrary(updated);
      persistData({ kiwixLibrary: updated });
    },
    [kiwixLibrary, persistData]
  );

  const updateKiwixResource = useCallback(
    (resource: KiwixResource) => {
      const updated = kiwixLibrary.map((r) => (r.id === resource.id ? resource : r));
      setKiwixLibrary(updated);
      persistData({ kiwixLibrary: updated });
    },
    [kiwixLibrary, persistData]
  );

  const removeKiwixResource = useCallback(
    (id: string) => {
      const updated = kiwixLibrary.filter((r) => r.id !== id);
      setKiwixLibrary(updated);
      persistData({ kiwixLibrary: updated });
    },
    [kiwixLibrary, persistData]
  );

  const importKiwixLibrary = useCallback(
    (resources: KiwixResource[]) => {
      const merged = [...kiwixLibrary];
      for (const res of resources) {
        if (!merged.find((r) => r.id === res.id)) {
          merged.push({ ...res, savedAt: new Date().toISOString() });
        }
      }
      setKiwixLibrary(merged);
      persistData({ kiwixLibrary: merged });
    },
    [kiwixLibrary, persistData]
  );

  const exportKiwixLibrary = useCallback(() => {
    return JSON.stringify(kiwixLibrary, null, 2);
  }, [kiwixLibrary]);

  const currentSnapshot = useCallback((): AppData => ({
    alertLevel,
    groupName,
    checkInIntervalHours,
    members,
    supplies,
    checklists,
    pois,
    routes,
    commsChannels,
    commsRepeaters,
    kiwixLibrary,
  }), [alertLevel, groupName, checkInIntervalHours, members, supplies, checklists, pois, routes, commsChannels, commsRepeaters, kiwixLibrary]);

  const exportOpsBackup = useCallback(() => {
    return serializeOpsBackup(currentSnapshot());
  }, [currentSnapshot]);

  const replaceAllData = useCallback(
    (incoming: AppData) => {
      setAlertLevel(incoming.alertLevel);
      setGroupName(incoming.groupName);
      setCheckInIntervalHours(incoming.checkInIntervalHours ?? DEFAULT_CHECK_IN_HOURS);
      setMembers(incoming.members);
      setSupplies(incoming.supplies);
      setChecklists(incoming.checklists);
      setPois(incoming.pois);
      setRoutes(incoming.routes);
      setCommsChannels(incoming.commsChannels);
      setCommsRepeaters(incoming.commsRepeaters);
      setKiwixLibrary(incoming.kiwixLibrary);
      saveMutation.mutate(incoming);
    },
    [saveMutation]
  );

  const importOpsBackup = useCallback(
    (raw: string): boolean => {
      const parsed = parseOpsBackup(raw);
      if (!parsed) return false;
      replaceAllData(parsed);
      return true;
    },
    [replaceAllData]
  );

  const removeChecklist = useCallback(
    (id: string) => {
      const updated = checklists.filter((cl) => cl.id !== id);
      setChecklists(updated);
      persistData({ checklists: updated });
    },
    [checklists, persistData]
  );

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

  return {
    alertLevel,
    groupName,
    checkInIntervalHours,
    members,
    supplies,
    checklists,
    pois,
    routes,
    isLoading: dataQuery.isLoading,
    updateAlertLevel,
    updateGroupName,
    updateCheckInInterval,
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
    commsChannels,
    commsRepeaters,
    addCommsChannel,
    updateCommsChannel,
    removeCommsChannel,
    addCommsRepeater,
    updateCommsRepeater,
    removeCommsRepeater,
    supplyStats,
    checklistStats,
    kiwixLibrary,
    saveKiwixResource,
    updateKiwixResource,
    removeKiwixResource,
    importKiwixLibrary,
    exportKiwixLibrary,
    exportOpsBackup,
    importOpsBackup,
    replaceAllData,
    currentSnapshot,
  };
});
