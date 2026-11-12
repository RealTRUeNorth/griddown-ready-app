import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Plus,
  Layers,
  MapPin,
  Trash2,
  Package,
  Crosshair,
  Download,
  HardDriveDownload,
  Compass,
  Navigation,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppData } from '@/lib/store';
import { POI, POICategory, Route, Coordinates } from '@/lib/types';
import { POI_CATEGORY_CONFIG, ROUTE_COLORS } from '@/lib/mapHelpers';
import { useCompass, useGeolocation } from '@/lib/device';
import { MapPack, prepareMapPack, listMapPacks, deleteMapPack, formatBytes } from '@/lib/offlineTiles';
import { MapBounds } from '@/lib/tileMath';
import { TCard, SectionTitle, Chip, ProgressBar } from '@/components/tactical';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Field } from '@/pages/Prep';
import { cn } from '@/lib/utils';

function poiMarkerIcon(color: string, emoji: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50%;
      background: ${color}2E; border: 2px solid ${color};
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; box-shadow: 0 0 8px ${color}55;
    ">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const CATEGORY_ICONS: Record<POICategory, string> = {
  water: '💧',
  shelter: '🏠',
  medical: '✚',
  supply_cache: '📦',
  rally_point: '⚑',
  hazard: '⚠',
  comms: '📡',
  gas_station: '⛽',
  hospital: '🏥',
  pharmacy: '💊',
  police: '🛡',
  fire_station: '🚒',
  weather_resource: '🌧',
  other: '📍',
};

/** Tile layer that prefers offline-cached tiles, falling back to the network. */
class CachedTileLayer extends L.TileLayer {
  async loadTile(url: string): Promise<Blob | null> {
    try {
      const cache = await caches.open('griddown-map-tiles');
      const hit = await cache.match(url);
      if (hit) return await hit.blob();
      const resp = await fetch(url, { mode: 'cors' });
      if (resp.ok) {
        const blob = await resp.blob();
        void cache.put(url, new Response(blob));
        return blob;
      }
    } catch {
      // Offline — fall through
    }
    return null;
  }

  createTile(coords: L.Coords, done: (error?: Error, tile?: HTMLElement) => void): HTMLElement {
    const tile = document.createElement('img');
    tile.className = 'gd-tile-loading';
    L.DomEvent.on(tile, 'load', () => {
      tile.classList.remove('gd-tile-loading');
      done(undefined, tile);
    });
    L.DomEvent.on(tile, 'error', () => {
      tile.classList.remove('gd-tile-loading');
      done(undefined, tile);
    });
    const url = this.getTileUrl(coords);
    void this.loadTile(url).then((blob) => {
      if (blob) tile.src = URL.createObjectURL(blob);
      else tile.src = url;
    });
    return tile;
  }
}

export default function MapPage() {
  const { pois, routes, addPoi, removePoi, removeRoute, updateRoute, members } = useAppData();
  const mapRef = useRef<L.Map | null>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const compass = useCompass();
  const geo = useGeolocation();
  const [packs, setPacks] = useState<MapPack[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [packDialog, setPackDialog] = useState(false);
  const [packName, setPackName] = useState('My Area');
  const [prepProgress, setPrepProgress] = useState<{ downloaded: number; total: number; running: boolean }>({ downloaded: 0, total: 0, running: false });
  const [poiDialog, setPoiDialog] = useState(false);
  const [paceRoute, setPaceRoute] = useState<Route | null>(null);
  const [filter, setFilter] = useState<'all' | 'tactical' | 'infrastructure'>('all');

  const center: [number, number] = useMemo(() => {
    if (pois.length > 0) return [pois[0].coordinates.latitude, pois[0].coordinates.longitude];
    return [38.627, -90.1994];
  }, [pois]);

  useEffect(() => {
    setPacks(listMapPacks());
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;
    const map = L.map(mapDivRef.current, {
      center,
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });
    const tileLayer = new CachedTileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '© OpenStreetMap contributors',
    });
    tileLayer.addTo(map);
    tileRef.current = tileLayer;
    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render POIs and routes
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();

    for (const route of routes) {
      const latlngs = route.waypoints.map((w) => [w.latitude, w.longitude] as [number, number]);
      if (latlngs.length >= 2) {
        L.polyline(latlngs, {
          color: route.color,
          weight: 3,
          opacity: 0.85,
          dashArray: route.id.includes('recon') ? '8 6' : undefined,
        })
          .bindPopup(`<b>${route.name}</b><br/><span style="color:#9A9890">${route.notes ?? ''}</span>`)
          .addTo(layer);
      }
    }

    const filteredPois = pois.filter((p) => {
      if (filter === 'all') return true;
      const tac: POICategory[] = ['rally_point', 'water', 'shelter', 'supply_cache', 'comms', 'hazard'];
      return filter === 'tactical' ? tac.includes(p.category) : !tac.includes(p.category);
    });

    for (const poi of filteredPois) {
      const config = POI_CATEGORY_CONFIG[poi.category];
      L.marker([poi.coordinates.latitude, poi.coordinates.longitude], {
        icon: poiMarkerIcon(config.color, CATEGORY_ICONS[poi.category] ?? '📍'),
      })
        .bindPopup(
          `<b>${poi.name}</b><br/><span style="color:#9A9890">${config.label}</span><br/><span style="color:#9A9890">${poi.notes ?? ''}</span>`
        )
        .addTo(layer);
    }
  }, [pois, routes, filter]);

  const recenter = () => {
    geo.locate();
  };

  useEffect(() => {
    if (geo.coords && mapRef.current) {
      mapRef.current.setView([geo.coords.latitude, geo.coords.longitude], 14);
      L.circleMarker([geo.coords.latitude, geo.coords.longitude], {
        color: '#4CAF50',
        fillColor: '#4CAF50',
        fillOpacity: 0.4,
        radius: 8,
      })
        .bindPopup('Your position')
        .addTo(mapRef.current);
    }
  }, [geo.coords]);

  const currentBounds = (): MapBounds | null => {
    const map = mapRef.current;
    if (!map) return null;
    const b = map.getBounds();
    return { minLat: b.getSouth(), maxLat: b.getNorth(), minLng: b.getWest(), maxLng: b.getEast() };
  };

  const preparePack = async () => {
    const bounds = currentBounds();
    if (!bounds) return;
    setPrepProgress({ downloaded: 0, total: 0, running: true });
    try {
      const pack = await prepareMapPack(packName.trim() || 'My Area', bounds, (downloaded, total) =>
        setPrepProgress({ downloaded, total, running: true })
      );
      setPacks(listMapPacks());
      toast.success(`Prepared "${pack.name}" — ${pack.tileCount} tiles (${formatBytes(pack.sizeBytes)})`);
      setPackDialog(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Pack preparation failed');
    } finally {
      setPrepProgress({ downloaded: 0, total: 0, running: false });
    }
  };

  const removePack = async (id: string) => {
    await deleteMapPack(id);
    setPacks(listMapPacks());
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg gd-label text-[#E8E4DC]">MAP</h1>
        <div className="flex gap-2">
          <button
            onClick={recenter}
            className="p-2 rounded-lg bg-[#242824] border border-[#3A3F3A] text-[#9A9890] hover:text-[#4CAF50] transition-colors"
            aria-label="Center on my position"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className={cn(
              'p-2 rounded-lg border transition-colors',
              panelOpen
                ? 'bg-[#333833] border-[#4A504A] text-[#E8A04A]'
                : 'bg-[#242824] border-[#3A3F3A] text-[#9A9890] hover:text-[#E8A04A]'
            )}
            aria-label="Map tools"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-[#3A3F3A]">
        <div ref={mapDivRef} className="w-full h-[52vh] min-h-72 z-0" data-testid="map-canvas" />
        {compass.info.heading != null && (
          <div className="absolute top-3 left-3 z-[1000] bg-[#1E221E]/90 border border-[#3A3F3A] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] gd-label text-[#E8E4DC]">
            <Compass className="w-3.5 h-3.5 text-[#E8A04A]" style={{ transform: `rotate(${-compass.info.heading}deg)` }} />
            {Math.round(compass.info.heading)}°
          </div>
        )}
        {!compass.info.supported && (
          <div className="absolute bottom-3 left-3 z-[1000] text-[9px] gd-label text-[#6A6860] bg-[#1E221E]/80 px-2 py-1 rounded">
            NO COMPASS SENSOR
          </div>
        )}
      </div>

      {panelOpen && (
        <TCard className="p-4 mt-3">
          <div className="flex items-center gap-2 mb-3">
            <HardDriveDownload className="w-4 h-4 text-[#E8A04A]" />
            <span className="text-xs gd-label text-[#E8E4DC]">OFFLINE MAP PACKS · {packs.length}</span>
          </div>
          <p className="text-[11px] text-[#9A9890] mb-3 leading-relaxed">
            Position the view over your area and prepare a pack — those tiles are cached
            so the map still renders with no connectivity.
          </p>
          {prepProgress.running ? (
            <div>
              <div className="text-[11px] text-[#9A9890] mb-2">
                Downloading tiles… {prepProgress.downloaded}/{prepProgress.total || '?'}
              </div>
              <ProgressBar percent={prepProgress.total ? (prepProgress.downloaded / prepProgress.total) * 100 : 0} />
            </div>
          ) : (
            <Button
              onClick={() => setPackDialog(true)}
              className="w-full bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] font-bold gd-label text-xs gap-2"
              data-testid="prepare-pack"
            >
              <Download className="w-4 h-4" /> PREPARE PACK FOR THIS VIEW
            </Button>
          )}

          {packs.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {packs.map((p) => (
                <div key={p.id} className="flex items-center gap-2 bg-[#1E221E] border border-[#3A3F3A] rounded-lg px-3 py-2">
                  <MapPin className="w-3.5 h-3.5 text-[#8B9A6A] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#E8E4DC] truncate">{p.name}</div>
                    <div className="text-[10px] text-[#6A6860]">{p.tileCount} tiles · ~{formatBytes(p.sizeBytes)} · zooms {p.zooms.join('-')}</div>
                  </div>
                  <button onClick={() => removePack(p.id)} className="p-1.5 text-[#6A6860] hover:text-[#F44336] transition-colors" aria-label="Delete pack">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TCard>
      )}

      <div className="flex gap-1.5 mt-3 mb-2">
        {(['all', 'tactical', 'infrastructure'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'flex-1 text-[9px] gd-label rounded-lg py-2 border transition-colors',
              filter === f ? 'bg-[#333833] border-[#4A504A] text-[#E8A04A]' : 'bg-[#242824] border-[#3A3F3A] text-[#9A9890]'
            )}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <SectionTitle>MAP ITEMS · {pois.length}</SectionTitle>
      <div className="space-y-2">
        <TCard onClick={() => setPoiDialog(true)} className="p-3.5 flex items-center justify-center gap-2 border-dashed" testId="add-poi">
          <Plus className="w-4 h-4 text-[#D4822A]" />
          <span className="text-xs gd-label text-[#D4822A]">ADD MAP POINT</span>
        </TCard>
        {pois.map((poi) => {
          const config = POI_CATEGORY_CONFIG[poi.category];
          return (
            <TCard key={poi.id} className="p-3 flex items-center gap-2.5" testId={`poi-${poi.id}`}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm" style={{ backgroundColor: `${config.color}22` }}>
                {CATEGORY_ICONS[poi.category] ?? '📍'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#E8E4DC] truncate">{poi.name}</div>
                <div className="text-[10px] text-[#6A6860] truncate">{config.label} · {poi.coordinates.latitude.toFixed(4)}, {poi.coordinates.longitude.toFixed(4)}</div>
              </div>
              <button
                onClick={() => removePoi(poi.id)}
                className="p-1.5 text-[#6A6860] hover:text-[#F44336] transition-colors shrink-0"
                aria-label="Delete point"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </TCard>
          );
        })}
        {routes.map((route) => (
          <TCard key={route.id} className="p-3 flex items-start gap-2.5">
            <Navigation className="w-4 h-4 shrink-0 mt-0.5" style={{ color: route.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-[#E8E4DC] truncate">{route.name}</div>
              <div className="text-[10px] text-[#6A6860] truncate">{route.waypoints.length} waypoints · {route.notes ?? ''}</div>
              {route.pace && [route.pace.primary, route.pace.alternate, route.pace.contingency, route.pace.emergency].some((p) => p?.trim()) && (
                <div className="mt-2 bg-[#1E221E] border border-[#3A3F3A] rounded-lg p-2 space-y-0.5">
                  <div className="text-[8px] gd-label text-[#E8A04A]">PACE PLAN</div>
                  {([
                    ['P — Primary', route.pace.primary],
                    ['A — Alternate', route.pace.alternate],
                    ['C — Contingency', route.pace.contingency],
                    ['E — Emergency', route.pace.emergency],
                  ] as [string, string | undefined][])
                    .filter(([, v]) => v && v.trim())
                    .map(([label, v]) => (
                      <div key={label} className="text-[10px] text-[#9A9890] leading-snug">
                        <span className="gd-label text-[#E8A04A] mr-1.5">{label}</span>
                        {v}
                      </div>
                    ))}
                </div>
              )}
              <button
                onClick={() => setPaceRoute(route)}
                className="mt-2 text-[9px] gd-label font-bold text-[#E8A04A] hover:text-[#FFC107] transition-colors"
              >
                {route.pace?.primary?.trim() ? 'EDIT PACE' : '+ SET PACE PLAN'}
              </button>
            </div>
            <button
              onClick={() => removeRoute(route.id)}
              className="p-1.5 text-[#6A6860] hover:text-[#F44336] transition-colors shrink-0"
              aria-label="Delete route"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </TCard>
        ))}
      </div>

      {/* PACE plan dialog */}
      <PaceDialog route={paceRoute} onClose={() => setPaceRoute(null)} onSave={updateRoute} />

      {/* Pack name dialog */}
      <Dialog open={packDialog} onOpenChange={setPackDialog}>
        <DialogContent className="bg-[#242824] border-[#3A3F3A] text-[#E8E4DC]">
          <DialogHeader>
            <DialogTitle className="gd-label text-sm">PREPARE MAP PACK</DialogTitle>
          </DialogHeader>
          <p className="text-[12px] text-[#9A9890]">
            Tiles for the current view (zooms 12-15) will be cached on this device for
            offline use.
          </p>
          <Field label="PACK NAME">
            <Input value={packName} onChange={(e) => setPackName(e.target.value)} className="bg-[#1E221E] border-[#3A3F3A]" />
          </Field>
          <Button onClick={preparePack} className="w-full bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] font-bold gd-label text-xs">
            START DOWNLOAD
          </Button>
        </DialogContent>
      </Dialog>

      {/* Add POI dialog */}
      <AddPoiDialog open={poiDialog} onClose={() => setPoiDialog(false)} onSave={addPoi} mapCenter={center} />
    </div>
  );
}

function PaceDialog({ route, onClose, onSave }: {
  route: Route | null;
  onClose: () => void;
  onSave: (r: Route) => void;
}) {
  const [primary, setPrimary] = useState('');
  const [alternate, setAlternate] = useState('');
  const [contingency, setContingency] = useState('');
  const [emergency, setEmergency] = useState('');

  React.useEffect(() => {
    if (route) {
      setPrimary(route.pace?.primary ?? '');
      setAlternate(route.pace?.alternate ?? '');
      setContingency(route.pace?.contingency ?? '');
      setEmergency(route.pace?.emergency ?? '');
    }
  }, [route]);

  if (!route) return null;

  const pace = { primary: primary.trim(), alternate: alternate.trim(), contingency: contingency.trim(), emergency: emergency.trim() };
  const hasContent = Object.values(pace).some((v) => v);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#242824] border-[#3A3F3A] text-[#E8E4DC]">
        <DialogHeader>
          <DialogTitle className="gd-label text-sm">PACE PLAN — {route.name.toUpperCase()}</DialogTitle>
        </DialogHeader>
        <p className="text-[12px] text-[#9A9890]">
          Primary, Alternate, Contingency, Emergency — how the group moves if each layer fails.
        </p>
        <Field label="PRIMARY">
          <Textarea value={primary} onChange={(e) => setPrimary(e.target.value)} placeholder="The planned route" className="bg-[#1E221E] border-[#3A3F3A] min-h-[56px] text-[13px]" />
        </Field>
        <Field label="ALTERNATE">
          <Textarea value={alternate} onChange={(e) => setAlternate(e.target.value)} placeholder="If primary is blocked" className="bg-[#1E221E] border-[#3A3F3A] min-h-[56px] text-[13px]" />
        </Field>
        <Field label="CONTINGENCY">
          <Textarea value={contingency} onChange={(e) => setContingency(e.target.value)} placeholder="If alternate fails" className="bg-[#1E221E] border-[#3A3F3A] min-h-[56px] text-[13px]" />
        </Field>
        <Field label="EMERGENCY">
          <Textarea value={emergency} onChange={(e) => setEmergency(e.target.value)} placeholder="Last-resort movement" className="bg-[#1E221E] border-[#3A3F3A] min-h-[56px] text-[13px]" />
        </Field>
        <Button
          onClick={() => {
            onSave({ ...route, pace: hasContent ? pace : undefined });
            onClose();
          }}
          className="w-full bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] font-bold gd-label text-xs"
        >
          SAVE PACE PLAN
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function AddPoiDialog({ open, onClose, onSave, mapCenter }: {
  open: boolean;
  onClose: () => void;
  onSave: (p: POI) => void;
  mapCenter: [number, number];
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<POICategory>('rally_point');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [notes, setNotes] = useState('');
  const geo = useGeolocation();

  React.useEffect(() => {
    if (open) {
      setName('');
      setCategory('rally_point');
      setLat(mapCenter[0].toFixed(5));
      setLng(mapCenter[1].toFixed(5));
      setNotes('');
    }
  }, [open, mapCenter]);

  const useMyLocation = () => {
    geo.locate();
  };

  React.useEffect(() => {
    if (geo.coords) {
      setLat(geo.coords.latitude.toFixed(5));
      setLng(geo.coords.longitude.toFixed(5));
    }
  }, [geo.coords]);

  const categories: POICategory[] = ['rally_point', 'water', 'shelter', 'supply_cache', 'comms', 'hazard', 'gas_station', 'hospital', 'pharmacy', 'police', 'fire_station', 'other'];

  const save = () => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (!name.trim()) return toast.error('Name is required');
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return toast.error('Valid coordinates required');
    onSave({
      id: `poi-${Date.now()}`,
      name: name.trim(),
      category,
      coordinates: { latitude, longitude },
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#242824] border-[#3A3F3A] text-[#E8E4DC] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gd-label text-sm">ADD MAP POINT</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="NAME">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rally Point Delta" className="bg-[#1E221E] border-[#3A3F3A]" />
          </Field>
          <Field label="CATEGORY">
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    'text-[9px] gd-label rounded-full px-2.5 py-1.5 border transition-colors',
                    category === c ? 'bg-[#8B5A1A] border-[#D4822A] text-[#E8A04A]' : 'bg-[#1E221E] border-[#3A3F3A] text-[#9A9890]'
                  )}
                >
                  {POI_CATEGORY_CONFIG[c].label.toUpperCase()}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="LATITUDE">
              <Input value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" className="bg-[#1E221E] border-[#3A3F3A]" />
            </Field>
            <Field label="LONGITUDE">
              <Input value={lng} onChange={(e) => setLng(e.target.value)} inputMode="decimal" className="bg-[#1E221E] border-[#3A3F3A]" />
            </Field>
          </div>
          <button
            onClick={useMyLocation}
            disabled={geo.loading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#1E221E] border border-[#3A3F3A] text-[10px] gd-label text-[#9A9890] hover:text-[#4CAF50] transition-colors disabled:opacity-50"
          >
            <Crosshair className="w-3.5 h-3.5" />
            {geo.loading ? 'LOCATING…' : geo.coords ? 'CAPTURED — USE AGAIN' : 'USE MY CURRENT POSITION'}
          </button>
          <Field label="NOTES (OPTIONAL)">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Access notes, capacity…" className="bg-[#1E221E] border-[#3A3F3A]" />
          </Field>
          <Button onClick={save} className="w-full bg-[#D4822A] hover:bg-[#E8A04A] text-[#1A1D1A] font-bold gd-label text-xs" data-testid="save-poi">
            SAVE POINT
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
