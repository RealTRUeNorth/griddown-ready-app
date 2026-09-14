/**
 * Slippy-map tile math for offline map packs. Tiles are standard
 * web-mercator PNGs (256×256) named `${z}_${x}_${y}.png`, matching
 * https://tile.openstreetmap.org/{z}/{x}/{y}.png.
 */

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface TileRange {
  z: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export const OFFLINE_MAP_ZOOMS = [12, 13, 14, 15];
export const MAX_TILES_PER_PACK = 6000;
/** Rough average size of an OSM 256px PNG tile, used for size estimates. */
export const AVG_TILE_BYTES = 20 * 1024;

/**
 * Converts a react-native-maps region into geographic bounds, optionally
 * expanded by a margin so the pack covers panning slightly past the viewport.
 */
export function regionToBounds(region: MapRegion, margin = 1.4): MapBounds {
  const latDelta = (Math.abs(region.latitudeDelta) * margin) / 2;
  const lngDelta = (Math.abs(region.longitudeDelta) * margin) / 2;
  return {
    minLat: Math.max(-85.0511, region.latitude - latDelta),
    maxLat: Math.min(85.0511, region.latitude + latDelta),
    minLng: Math.max(-180, region.longitude - lngDelta),
    maxLng: Math.min(180, region.longitude + lngDelta),
  };
}

export function lngToTileX(lng: number, z: number): number {
  return Math.floor(((lng + 180) / 360) * Math.pow(2, z));
}

export function latToTileY(lat: number, z: number): number {
  const clamped = Math.max(-85.0511, Math.min(85.0511, lat));
  const rad = (clamped * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, z)
  );
}

export function tileRangesForBounds(bounds: MapBounds, zooms: number[]): TileRange[] {
  return zooms.map((z) => {
    const n = Math.pow(2, z);
    return {
      z,
      xMin: Math.max(0, lngToTileX(bounds.minLng, z)),
      xMax: Math.min(n - 1, lngToTileX(bounds.maxLng, z)),
      yMin: Math.max(0, latToTileY(bounds.maxLat, z)),
      yMax: Math.min(n - 1, latToTileY(bounds.minLat, z)),
    };
  });
}

export function countTiles(ranges: TileRange[]): number {
  return ranges.reduce(
    (sum, r) => sum + (r.xMax - r.xMin + 1) * (r.yMax - r.yMin + 1),
    0
  );
}

export function tileFileName(z: number, x: number, y: number): string {
  return `${z}_${x}_${y}.png`;
}

export function tileUrl(z: number, x: number, y: number): string {
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
}
