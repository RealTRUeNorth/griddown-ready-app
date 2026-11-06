import { MapBounds, TileRange, tileRangesForBounds, countTiles, tileUrl, MAX_TILES_PER_PACK, AVG_TILE_BYTES, OFFLINE_MAP_ZOOMS } from '@/lib/tileMath';

/**
 * Offline map packs on web. Tiles are standard OSM PNGs stored in the
 * Cache API so the map still renders with no connectivity — the browser
 * equivalent of the native offline map-pack download.
 */

const CACHE_NAME = 'griddown-map-tiles';
const PACKS_KEY = 'griddown_map_packs';

export interface MapPack {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  bounds: MapBounds;
  zooms: number[];
  tileCount: number;
  /** Approximate storage size in bytes. */
  sizeBytes: number;
  createdAt: string;
}

export interface PrepareProgress {
  pack: MapPack | null;
  downloaded: number;
  total: number;
  running: boolean;
  error: string;
}

export function listMapPacks(): MapPack[] {
  try {
    const raw = localStorage.getItem(PACKS_KEY);
    if (!raw) return [];
    const packs = JSON.parse(raw) as MapPack[];
    return Array.isArray(packs) ? packs : [];
  } catch {
    return [];
  }
}

function savePacks(packs: MapPack[]): void {
  localStorage.setItem(PACKS_KEY, JSON.stringify(packs));
}

export function tileRanges(bounds: MapBounds, zooms: number[] = OFFLINE_MAP_ZOOMS): TileRange[] {
  return tileRangesForBounds(bounds, zooms);
}

/**
 * Downloads every tile for the bounds into the Cache API. Reports progress
 * through the `onProgress` callback; tolerates individual tile failures.
 */
export async function prepareMapPack(
  name: string,
  bounds: MapBounds,
  onProgress: (downloaded: number, total: number) => void
): Promise<MapPack> {
  const ranges = tileRanges(bounds);
  const total = countTiles(ranges);
  if (total > MAX_TILES_PER_PACK) {
    throw new Error(`Too many tiles (${total}). Zoom out or pick a smaller area.`);
  }

  const cache = await caches.open(CACHE_NAME);
  let downloaded = 0;

  for (const range of ranges) {
    for (let x = range.xMin; x <= range.xMax; x++) {
      for (let y = range.yMin; y <= range.yMax; y++) {
        const url = tileUrl(range.z, x, y);
        try {
          const hit = await cache.match(url);
          if (!hit) {
            const resp = await fetch(url, { mode: 'cors' });
            if (resp.ok) {
              await cache.put(url, resp.clone());
            } else if (resp.status !== 404) {
              console.log(`Tile ${url} returned ${resp.status}`);
            }
          }
        } catch {
          // Skip unreachable tiles; cached portions still work offline.
        }
        downloaded++;
        if (downloaded % 10 === 0 || downloaded === total) onProgress(downloaded, total);
      }
    }
  }

  const pack: MapPack = {
    id: `pack-${Date.now()}`,
    name,
    centerLat: (bounds.minLat + bounds.maxLat) / 2,
    centerLng: (bounds.minLng + bounds.maxLng) / 2,
    bounds,
    zooms: OFFLINE_MAP_ZOOMS,
    tileCount: total,
    sizeBytes: total * AVG_TILE_BYTES,
    createdAt: new Date().toISOString(),
  };
  savePacks([...listMapPacks(), pack]);
  return pack;
}

export async function deleteMapPack(id: string): Promise<void> {
  const packs = listMapPacks();
  const pack = packs.find((p) => p.id === id);
  if (!pack) return;
  const cache = await caches.open(CACHE_NAME);
  const ranges = tileRanges(pack.bounds, pack.zooms);
  const urls: string[] = [];
  for (const range of ranges) {
    for (let x = range.xMin; x <= range.xMax; x++) {
      for (let y = range.yMin; y <= range.yMax; y++) {
        urls.push(tileUrl(range.z, x, y));
      }
    }
  }
  await Promise.all(urls.map((u) => cache.delete(u)));
  savePacks(packs.filter((p) => p.id !== id));
}

/** Returns a cached tile body if the pack covers it (offline support). */
export async function getCachedTile(url: string): Promise<Response | undefined> {
  try {
    const cache = await caches.open(CACHE_NAME);
    return await cache.match(url);
  } catch {
    return undefined;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}
