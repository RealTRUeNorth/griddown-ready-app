import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MapBounds,
  MapRegion,
  TileRange,
  OFFLINE_MAP_ZOOMS,
  MAX_TILES_PER_PACK,
  AVG_TILE_BYTES,
  regionToBounds,
  tileRangesForBounds,
  countTiles,
  tileFileName,
  tileUrl,
} from '@/utils/tileMath';

const PACKS_KEY = 'griddown_map_packs';
const MAPS_DIR = 'maps/';

export interface MapPack {
  id: string;
  name: string;
  center: { latitude: number; longitude: number };
  bounds: MapBounds;
  minZ: number;
  maxZ: number;
  tileCount: number;
  sizeBytes: number;
  downloadedAt: string;
}

export interface PackProgress {
  tilesDone: number;
  tilesTotal: number;
  sizeBytes: number;
}

export interface PackEstimate {
  tileCount: number;
  sizeBytes: number;
  ranges: TileRange[];
  bounds: MapBounds;
}

/** Runs async work over items with a fixed concurrency limit. */
async function runPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const i = index++;
      await fn(items[i]);
    }
  });
  await Promise.all(workers);
}

/**
 * Manages offline map tile packs: bounded-region downloads of standard
 * web-mercator PNG tiles, stored on-device and rendered by the offline
 * tile map when signal is gone. Records persist across launches and
 * missing directories are pruned on load.
 */
export const [MapPacksProvider, useMapPacks] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [packs, setPacks] = useState<MapPack[]>([]);
  const [activeDownloads, setActiveDownloads] = useState<Record<string, PackProgress>>({});
  const cancelRef = useRef<Set<string>>(new Set());
  const lastProgressPushRef = useRef<number>(0);

  const loadQuery = useQuery({
    queryKey: ['mapPacks'],
    queryFn: async (): Promise<MapPack[]> => {
      if (Platform.OS === 'web') return [];
      try {
        const raw = await AsyncStorage.getItem(PACKS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as MapPack[];
        const FileSystem = require('expo-file-system/legacy');
        const verified: MapPack[] = [];
        for (const pack of parsed) {
          const dir = FileSystem.documentDirectory + MAPS_DIR + pack.id;
          const info = await FileSystem.getInfoAsync(dir);
          if (info.exists) verified.push(pack);
        }
        return verified;
      } catch (e) {
        console.log('Failed to load map packs:', e);
        return [];
      }
    },
  });

  useEffect(() => {
    if (loadQuery.data) {
      setPacks(loadQuery.data);
    }
  }, [loadQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (next: MapPack[]) => {
      await AsyncStorage.setItem(PACKS_KEY, JSON.stringify(next));
      return next;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mapPacks'] });
    },
  });

  const setProgress = useCallback((packId: string, progress: PackProgress | null) => {
    setActiveDownloads((prev) => {
      const next = { ...prev };
      if (progress) {
        next[packId] = progress;
      } else {
        delete next[packId];
      }
      return next;
    });
  }, []);

  /** Tile count + size estimate for preparing a pack from the current region. */
  const estimatePack = useCallback((region: MapRegion): PackEstimate => {
    const bounds = regionToBounds(region);
    const ranges = tileRangesForBounds(bounds, OFFLINE_MAP_ZOOMS);
    const tileCount = countTiles(ranges);
    return { tileCount, sizeBytes: tileCount * AVG_TILE_BYTES, ranges, bounds };
  }, []);

  const downloadPack = useCallback(
    async (name: string, region: MapRegion): Promise<MapPack | null> => {
      if (Platform.OS === 'web') return null;
      const FileSystem = require('expo-file-system/legacy');
      const estimate = estimatePack(region);
      if (estimate.tileCount === 0) return null;
      if (estimate.tileCount > MAX_TILES_PER_PACK) {
        throw new Error(
          `Area too large (${estimate.tileCount} tiles). Zoom in closer and try again.`
        );
      }

      const packId = `pack-${Date.now()}`;
      const dir = FileSystem.documentDirectory + MAPS_DIR + packId;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});

      cancelRef.current.add(packId);
      const total = estimate.ranges.reduce(
        (sum, r) => {
          const tiles: [number, number, number][] = [];
          for (let x = r.xMin; x <= r.xMax; x++) {
            for (let y = r.yMin; y <= r.yMax; y++) {
              tiles.push([r.z, x, y]);
            }
          }
          return sum.concat(tiles);
        },
        [] as [number, number, number][]
      );

      setProgress(packId, { tilesDone: 0, tilesTotal: total.length, sizeBytes: 0 });

      let done = 0;
      let sizeBytes = 0;
      let canceled = false;
      let failures = 0;

      try {
        await runPool(total, 4, async ([z, x, y]) => {
          if (canceled) return;
          const targetUri = `${dir}/${tileFileName(z, x, y)}`;
          try {
            const result = await FileSystem.downloadAsync(tileUrl(z, x, y), targetUri, {
              headers: { 'User-Agent': 'GRIDDOWN/1.0 (offline map pack)' },
            });
            const len =
              result.headers && result.headers['Content-Length']
                ? parseInt(result.headers['Content-Length'] as string, 10)
                : 0;
            sizeBytes += Number.isFinite(len) && len > 0 ? len : AVG_TILE_BYTES;
          } catch {
            failures++;
          }
          done++;
          const now = Date.now();
          if (now - lastProgressPushRef.current > 250 || done === total.length) {
            lastProgressPushRef.current = now;
            setProgress(packId, {
              tilesDone: done,
              tilesTotal: total.length,
              sizeBytes,
            });
          }
        });
        if (cancelRef.current.has(packId)) {
          canceled = true;
        }
      } finally {
        cancelRef.current.delete(packId);
      }

      if (canceled) {
        await FileSystem.deleteAsync(dir, { idempotent: true }).catch(() => {});
        setProgress(packId, null);
        return null;
      }

      if (done === 0 || done - failures <= 0) {
        await FileSystem.deleteAsync(dir, { idempotent: true }).catch(() => {});
        setProgress(packId, null);
        throw new Error('Could not download map tiles. Check your connection.');
      }

      const pack: MapPack = {
        id: packId,
        name,
        center: { latitude: region.latitude, longitude: region.longitude },
        bounds: estimate.bounds,
        minZ: OFFLINE_MAP_ZOOMS[0],
        maxZ: OFFLINE_MAP_ZOOMS[OFFLINE_MAP_ZOOMS.length - 1],
        tileCount: done - failures,
        sizeBytes,
        downloadedAt: new Date().toISOString(),
      };

      setPacks((prev) => {
        const next = [...prev, pack];
        saveMutation.mutate(next);
        return next;
      });
      setProgress(packId, null);
      return pack;
    },
    [estimatePack, saveMutation, setProgress]
  );

  const cancelDownload = useCallback(
    (packId: string) => {
      cancelRef.current.add(packId);
    },
    []
  );

  const deletePack = useCallback(
    async (packId: string) => {
      if (Platform.OS !== 'web') {
        try {
          const FileSystem = require('expo-file-system/legacy');
          await FileSystem.deleteAsync(
            FileSystem.documentDirectory + MAPS_DIR + packId,
            { idempotent: true }
          );
        } catch (e) {
          console.log('Failed to delete map pack:', e);
        }
      }
      setPacks((prev) => {
        const next = prev.filter((p) => p.id !== packId);
        saveMutation.mutate(next);
        return next;
      });
    },
    [saveMutation]
  );

  /** The completed pack covering a coordinate, if any. */
  const packCovering = useCallback(
    (latitude: number, longitude: number): MapPack | null => {
      return (
        packs.find(
          (p) =>
            latitude >= p.bounds.minLat &&
            latitude <= p.bounds.maxLat &&
            longitude >= p.bounds.minLng &&
            longitude <= p.bounds.maxLng
        ) ?? null
      );
    },
    [packs]
  );

  const totalPackBytes = useMemo(
    () => packs.reduce((sum, p) => sum + p.sizeBytes, 0),
    [packs]
  );

  return useMemo(
    () => ({
      packs,
      activeDownloads,
      isLoading: loadQuery.isLoading,
      estimatePack,
      downloadPack,
      cancelDownload,
      deletePack,
      packCovering,
      totalPackBytes,
    }),
    [
      packs,
      activeDownloads,
      loadQuery.isLoading,
      estimatePack,
      downloadPack,
      cancelDownload,
      deletePack,
      packCovering,
      totalPackBytes,
    ]
  );
});
