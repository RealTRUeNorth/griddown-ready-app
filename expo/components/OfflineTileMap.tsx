import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  PanResponder,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Plus, Minus, MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { POI_CATEGORY_CONFIG } from '@/constants/mapHelpers';
import { Coordinates, POI } from '@/types';
import type { MapPack } from '@/providers/MapPacksProvider';
import { tileFileName } from '@/utils/tileMath';

const TILE = 256;

let FileSystem: any = null;
if (Platform.OS !== 'web') {
  FileSystem = require('expo-file-system/legacy');
}

/** Fractional world-pixel X for a longitude at zoom z (web mercator). */
function lngToPxX(lng: number, z: number): number {
  return ((lng + 180) / 360) * TILE * Math.pow(2, z);
}

/** Fractional world-pixel Y for a latitude at zoom z (web mercator). */
function latToPxY(lat: number, z: number): number {
  const clamped = Math.max(-85.0511, Math.min(85.0511, lat));
  const rad = (clamped * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    TILE *
    Math.pow(2, z);
  return y;
}

function pxXToLng(px: number, z: number): number {
  return (px / (TILE * Math.pow(2, z))) * 360 - 180;
}

function pxYToLat(px: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * px) / (TILE * Math.pow(2, z));
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

interface OfflineTileMapProps {
  pack: MapPack;
  pois: POI[];
  userLocation: Coordinates | null;
  onPoiPress: (poi: POI) => void;
}

/**
 * Fully offline slippy map: renders downloaded map-pack tiles from local
 * storage in a pan/zoom image grid, with POI markers and the user location.
 * No network is used at render time — everything comes from the pack.
 */
export default function OfflineTileMap({ pack, pois, userLocation, onPoiPress }: OfflineTileMapProps) {
  const [center, setCenter] = useState<Coordinates>({
    latitude: pack.center.latitude,
    longitude: pack.center.longitude,
  });
  const [zoom, setZoom] = useState<number>(
    Math.min(Math.max(13, pack.minZ), pack.maxZ)
  );
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const centerRef = useRef(center);
  centerRef.current = center;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const lastTapRef = useRef<number>(0);
  const gestureStartRef = useRef<{ px: { x: number; y: number } } | null>(null);

  const dirUri = useMemo(() => {
    if (Platform.OS === 'web' || !FileSystem) return '';
    return `${FileSystem.documentDirectory}maps/${pack.id}/`;
  }, [pack.id]);

  const clampCenter = useCallback((lat: number, lng: number): Coordinates => {
    const padLat = (pack.bounds.maxLat - pack.bounds.minLat) * 0.05;
    const padLng = (pack.bounds.maxLng - pack.bounds.minLng) * 0.05;
    return {
      latitude: Math.min(pack.bounds.maxLat + padLat, Math.max(pack.bounds.minLat - padLat, lat)),
      longitude: Math.min(pack.bounds.maxLng + padLng, Math.max(pack.bounds.minLng - padLng, lng)),
    };
  }, [pack.bounds]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,
      onPanResponderGrant: () => {
        const now = Date.now();
        if (now - lastTapRef.current < 300 && zoomRef.current < pack.maxZ) {
          setZoom((z) => Math.min(pack.maxZ, z + 1));
          lastTapRef.current = 0;
          gestureStartRef.current = null;
          return;
        }
        lastTapRef.current = now;
        gestureStartRef.current = {
          px: {
            x: lngToPxX(centerRef.current.longitude, zoomRef.current),
            y: latToPxY(centerRef.current.latitude, zoomRef.current),
          },
        };
      },
      onPanResponderMove: (_e, g) => {
        const start = gestureStartRef.current;
        if (!start) return;
        const next = clampCenter(
          pxYToLat(start.px.y - g.dy, zoomRef.current),
          pxXToLng(start.px.x - g.dx, zoomRef.current)
        );
        setCenter(next);
      },
      onPanResponderRelease: () => {
        gestureStartRef.current = null;
      },
    })
  ).current;

  const { tiles, cx, cy } = useMemo(() => {
    if (size.width === 0) return { tiles: [], cx: 0, cy: 0 };
    const halfW = size.width / 2;
    const halfH = size.height / 2;
    const cx = lngToPxX(center.longitude, zoom);
    const cy = latToPxY(center.latitude, zoom);
    const n = Math.pow(2, zoom);
    const x0 = Math.floor((cx - halfW) / TILE);
    const x1 = Math.floor((cx + halfW) / TILE);
    const y0 = Math.floor((cy - halfH) / TILE);
    const y1 = Math.floor((cy + halfH) / TILE);
    const out: { key: string; uri: string; left: number; top: number }[] = [];
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        if (y < 0 || y > n - 1) continue;
        const wx = ((x % n) + n) % n;
        out.push({
          key: `${zoom}_${x}_${y}`,
          uri: `${dirUri}${tileFileName(zoom, wx, y)}`,
          left: x * TILE - cx + halfW,
          top: y * TILE - cy + halfH,
        });
      }
    }
    return { tiles: out, cx, cy };
  }, [size, center, zoom, dirUri]);

  const toScreen = useCallback(
    (lat: number, lng: number): { left: number; top: number } | null => {
      if (size.width === 0) return null;
      const halfW = size.width / 2;
      const halfH = size.height / 2;
      const left = lngToPxX(lng, zoom) - cx + halfW;
      const top = latToPxY(lat, zoom) - cy + halfH;
      if (left < -30 || top < -30 || left > size.width + 30 || top > size.height + 30) return null;
      return { left, top };
    },
    [size, cx, cy, zoom]
  );

  const changeZoom = useCallback((delta: number) => {
    setZoom((z) => Math.min(pack.maxZ, Math.max(pack.minZ, z + delta)));
  }, [pack.minZ, pack.maxZ]);

  return (
    <View
      style={styles.container}
      {...panResponder.panHandlers}
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      {tiles.map((t) => (
        <Image
          key={t.key}
          source={{ uri: t.uri }}
          style={[styles.tile, { left: t.left, top: t.top }]}
          resizeMode="cover"
        />
      ))}

      {userLocation && toScreen(userLocation.latitude, userLocation.longitude) && (
        <View
          style={[
            styles.userDotOuter,
            {
              left: (toScreen(userLocation.latitude, userLocation.longitude) as { left: number }).left - 16,
              top: (toScreen(userLocation.latitude, userLocation.longitude) as { top: number }).top - 16,
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.userDot} />
        </View>
      )}

      {pois.map((poi) => {
        const pos = toScreen(poi.coordinates.latitude, poi.coordinates.longitude);
        if (!pos) return null;
        const config = POI_CATEGORY_CONFIG[poi.category];
        return (
          <TouchableOpacity
            key={poi.id}
            style={[styles.poiMarker, { left: pos.left - 14, top: pos.top - 14 }]}
            onPress={() => onPoiPress(poi)}
            activeOpacity={0.8}
          >
            <MapPin color={Colors.white} size={13} />
          </TouchableOpacity>
        );
      })}

      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomBtn} onPress={() => changeZoom(1)} activeOpacity={0.7}>
          <Plus color={Colors.white} size={18} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomBtn} onPress={() => changeZoom(-1)} activeOpacity={0.7}>
          <Minus color={Colors.white} size={18} />
        </TouchableOpacity>
      </View>

      <View style={styles.mapInfoChip} pointerEvents="none">
        <Text style={styles.mapInfoText}>OFFLINE · Z{zoom}</Text>
      </View>

      <Text style={styles.attribution} pointerEvents="none">
        © OpenStreetMap contributors
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#141712',
    overflow: 'hidden',
  },
  tile: {
    position: 'absolute',
    width: 256,
    height: 256,
  },
  poiMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.orange,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  userDotOuter: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 136, 229, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1E88E5',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  zoomControls: {
    position: 'absolute',
    left: 12,
    bottom: 24,
    gap: 8,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  mapInfoChip: {
    position: 'absolute',
    right: 12,
    bottom: 24,
    backgroundColor: 'rgba(26, 29, 26, 0.92)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  mapInfoText: {
    color: Colors.statusGreen,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  attribution: {
    position: 'absolute',
    left: 12,
    bottom: 8,
    color: 'rgba(232, 228, 220, 0.55)',
    fontSize: 9,
  },
});
