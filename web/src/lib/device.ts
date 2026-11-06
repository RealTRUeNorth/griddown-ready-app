import { useEffect, useState } from 'react';
import { Coordinates } from '@/lib/types';

/**
 * Web device services — browser equivalents of the native device APIs.
 * Each hook degrades gracefully when the capability is unavailable.
 */

export interface BatteryInfo {
  /** -1 when unsupported */
  levelPercent: number;
  isCharging: boolean;
  supported: boolean;
}

interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
}

/** navigator.getBattery() — Chrome/Edge only; unsupported elsewhere. */
export function useBattery(): BatteryInfo {
  const [info, setInfo] = useState<BatteryInfo>({ levelPercent: -1, isCharging: false, supported: false });

  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManager> };
    if (typeof nav.getBattery !== 'function') return;
    let battery: BatteryManager | null = null;
    const update = () => {
      if (!battery) return;
      setInfo({
        levelPercent: Math.round(battery.level * 100),
        isCharging: battery.charging,
        supported: true,
      });
    };
    void nav
      .getBattery()
      .then((b) => {
        battery = b;
        update();
        b.addEventListener('levelchange', update);
        b.addEventListener('chargingchange', update);
      })
      .catch(() => setInfo({ levelPercent: -1, isCharging: false, supported: false }));
    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', update);
        battery.removeEventListener('chargingchange', update);
      }
    };
  }, []);

  return info;
}

/** navigator.onLine + live online/offline events. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

export interface CompassInfo {
  supported: boolean;
  /** Degrees 0-359, 0 = north; null when unavailable */
  heading: number | null;
}

/** DeviceOrientationEvent compass — iOS requires explicit permission request. */
export function useCompass(): { info: CompassInfo; request: () => void } {
  const [info, setInfo] = useState<CompassInfo>({ supported: isCompassSupported(), heading: null });

  useEffect(() => {
    if (!info.supported) return;
    const handler = (e: DeviceOrientationEvent) => {
      const webkit = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
      const heading =
        typeof webkit.webkitCompassHeading === 'number'
          ? webkit.webkitCompassHeading
          : e.alpha != null
          ? 360 - e.alpha
          : null;
      if (heading != null) setInfo({ supported: true, heading });
    };
    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info.supported]);

  const request = () => {
    const doe = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof doe?.requestPermission === 'function') {
      void doe.requestPermission().then(() => setInfo({ supported: true, heading: null }));
    }
  };

  return { info, request };
}

export function isCompassSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
}

export function isVibrateSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/** Short haptic-style feedback where supported. */
export function vibrate(pattern: number | number[] = 30): void {
  if (isVibrateSupported()) navigator.vibrate(pattern);
}

/** SOS pattern for the Lantern screen. */
export function vibrateSos(): void {
  if (!isVibrateSupported()) return;
  navigator.vibrate([120, 80, 120, 80, 120, 300, 240, 80, 240, 80, 240, 300, 120, 80, 120, 80, 120]);
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showNotification(title: string, body: string): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/icon.png', tag: 'griddown' });
  } catch (e) {
    console.log('Notification failed:', e);
  }
}

export interface GeolocationResult {
  coords: Coordinates | null;
  error: string;
  loading: boolean;
}

export function useGeolocation(): GeolocationResult & { locate: () => void } {
  const [result, setResult] = useState<GeolocationResult>({ coords: null, error: '', loading: false });

  const locate = () => {
    if (!navigator.geolocation) {
      setResult({ coords: null, error: 'Geolocation unavailable', loading: false });
      return;
    }
    setResult((r) => ({ ...r, loading: true }));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setResult({
          coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          error: '',
          loading: false,
        }),
      (err) => setResult({ coords: null, error: err.message || 'Location denied', loading: false }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return { ...result, locate };
}
