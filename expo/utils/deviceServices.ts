/**
 * Device utility helpers: compass heading, battery state, network reachability,
 * pedometer, text-to-speech, biometric auth, and contacts import. Each module
 * degrades gracefully on web or unsupported hardware.
 */

import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Coordinates } from '@/types';

// ── Compass ─────────────────────────────────────────────────────────────────

export interface CompassReading {
  /** Degrees 0-360 (true heading when available, otherwise magnetic). */
  heading: number | null;
  available: boolean;
}

/** Streams device heading from the magnetometer via expo-location. */
export function useHeading(): CompassReading {
  const [reading, setReading] = useState<CompassReading>({ heading: null, available: false });

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let Location: any;
    try {
      Location = require('expo-location');
    } catch (e) {
      console.log('expo-location not available:', e);
      return;
    }
    let subscription: any = null;
    let cancelled = false;
    Location.watchHeadingAsync((heading: any) => {
      // trueHeading is -1 when location is unavailable (e.g. Android)
      const value = heading.trueHeading >= 0 ? heading.trueHeading : heading.magneticHeading;
      setReading({ heading: value, available: true });
    })
      .then((sub: any) => {
        if (cancelled) {
          sub.remove();
          return;
        }
        subscription = sub;
      })
      .catch(() => setReading({ heading: null, available: false }));
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return reading;
}

/** Cardinal abbreviation for a heading in degrees (N, NNE, ...). */
export function cardinalFor(degrees: number): string {
  const names = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const normalized = ((degrees % 360) + 360) % 360;
  return names[Math.floor(((normalized + 11.25) % 360) / 22.5)];
}

/** Initial bearing in degrees from point A to point B. */
export function bearingBetween(from: Coordinates, to: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const y = Math.sin(toRad(to.longitude - from.longitude)) * Math.cos(toRad(to.latitude));
  const x =
    Math.cos(toRad(from.latitude)) * Math.sin(toRad(to.latitude)) -
    Math.sin(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.cos(toRad(to.longitude - from.longitude));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// ── Battery ──────────────────────────────────────────────────────────────────

export interface BatteryReading {
  /** Percent 0-100, or -1 when unknown. */
  levelPercent: number;
  isCharging: boolean;
  available: boolean;
}

/** Live battery level and charging state via expo-battery. */
export function useBattery(): BatteryReading {
  const [reading, setReading] = useState<BatteryReading>({
    levelPercent: -1,
    isCharging: false,
    available: false,
  });

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let Battery: any;
    try {
      Battery = require('expo-battery');
    } catch (e) {
      console.log('expo-battery not available:', e);
      return;
    }
    let cancelled = false;
    const subs: Array<{ remove?: () => void }> = [];
    (async () => {
      try {
        const [level, state] = await Promise.all([
          Battery.getBatteryLevelAsync(),
          Battery.getBatteryStateAsync(),
        ]);
        if (cancelled) return;
        setReading({
          levelPercent: level >= 0 ? Math.round(level * 100) : -1,
          isCharging: state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL,
          available: level >= 0,
        });
      } catch (e) {
        console.log('Battery read failed:', e);
      }
    })();
    try {
      subs.push(
        Battery.addBatteryLevelListener((event: { batteryLevel: number }) => {
          setReading((r: BatteryReading) => ({
            ...r,
            levelPercent: event.batteryLevel >= 0 ? Math.round(event.batteryLevel * 100) : -1,
            available: event.batteryLevel >= 0,
          }));
        })
      );
      subs.push(
        Battery.addBatteryStateListener((event: { batteryState: number }) => {
          setReading((r: BatteryReading) => ({
            ...r,
            isCharging:
              event.batteryState === Battery.BatteryState.CHARGING ||
              event.batteryState === Battery.BatteryState.FULL,
          }));
        })
      );
    } catch (e) {
      console.log('Battery listeners unavailable:', e);
    }
    return () => {
      cancelled = true;
      subs.forEach((s) => s?.remove?.());
    };
  }, []);

  return reading;
}

// ── Network ──────────────────────────────────────────────────────────────────

/** True when the device has connectivity (null reachability counts as online). */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let NetInfo: any;
    try {
      NetInfo = require('@react-native-community/netinfo');
    } catch (e) {
      console.log('netinfo not available:', e);
      return;
    }
    const unsubscribe = NetInfo.addEventListener((state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => {
      setIsOnline(!!state.isConnected && state.isInternetReachable !== false);
    });
    void NetInfo.fetch()
      .then((state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => {
        setIsOnline(!!state.isConnected && state.isInternetReachable !== false);
      })
      .catch(() => {});
    return () => unsubscribe?.();
  }, []);

  return isOnline;
}

// ── Pedometer ────────────────────────────────────────────────────────────────

export interface PedometerReading {
  steps: number;
  meters: number;
  available: boolean;
}

/** Today's steps and walking distance via the motion coprocessor. */
export function usePedometer(): PedometerReading {
  const [reading, setReading] = useState<PedometerReading>({ steps: 0, meters: 0, available: false });

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let Pedometer: any;
    try {
      Pedometer = require('expo-sensors').Pedometer;
    } catch (e) {
      console.log('Pedometer not available:', e);
      return;
    }
    let cancelled = false;
    let subscription: { remove?: () => void } | null = null;
    (async () => {
      try {
        const available = await Pedometer.isAvailableAsync();
        if (cancelled) return;
        if (!available) {
          setReading({ steps: 0, meters: 0, available: false });
          return;
        }
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const result = await Pedometer.getStepCountAsync(start, new Date());
        if (cancelled) return;
        setReading({ steps: result.steps ?? 0, meters: result.distance ?? 0, available: true });
        subscription = Pedometer.watchStepCount((res: { steps: number }) => {
          setReading((r: PedometerReading) => ({ ...r, steps: r.steps + (res.steps ?? 0) }));
        });
      } catch (e) {
        console.log('Pedometer unavailable:', e);
      }
    })();
    return () => {
      cancelled = true;
      subscription?.remove?.();
    };
  }, []);

  return reading;
}

// ── Speech ───────────────────────────────────────────────────────────────────

let Speech: any = null;
if (Platform.OS !== 'web') {
  try {
    Speech = require('expo-speech');
  } catch (e) {
    console.log('expo-speech not available:', e);
  }
}

/** Reads paragraphs aloud hands-free via the system speech synthesizer. */
export function useSpeech(): { isSpeaking: boolean; speak: (paragraphs: string[]) => void; stop: () => void } {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const cancelledRef = useRef(false);

  const stop = useRef(() => {
    cancelledRef.current = true;
    try {
      Speech?.stop();
    } catch {
      // Nothing speaking — safe to ignore
    }
    setIsSpeaking(false);
  }).current;

  const speak = useRef((paragraphs: string[]) => {
    stop();
    const queue = paragraphs.map((p) => p.trim()).filter(Boolean);
    if (!Speech || queue.length === 0) return;
    cancelledRef.current = false;
    setIsSpeaking(true);
    const speakNext = (index: number) => {
      if (cancelledRef.current) {
        setIsSpeaking(false);
        return;
      }
      if (index >= queue.length) {
        setIsSpeaking(false);
        return;
      }
      Speech.speak(queue[index], {
        rate: 1.0,
        onDone: () => speakNext(index + 1),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    };
    speakNext(0);
  }).current;

  useEffect(() => stop, [stop]);

  return { isSpeaking, speak, stop };
}

// ── Biometrics ───────────────────────────────────────────────────────────────

let LocalAuthentication: any = null;
if (Platform.OS !== 'web') {
  try {
    LocalAuthentication = require('expo-local-authentication');
  } catch (e) {
    console.log('expo-local-authentication not available:', e);
  }
}

/** True when the device has enrolled biometric hardware. */
export async function hasBiometricCapability(): Promise<boolean> {
  if (!LocalAuthentication) return false;
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
}

/**
 * Prompts the system auth UI (biometrics with passcode fallback).
 * Returns true when the user is authenticated.
 */
export async function authenticateUser(reason: string): Promise<boolean> {
  if (!LocalAuthentication) return false;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return !!result.success;
  } catch (e) {
    console.log('Authentication failed:', e);
    return false;
  }
}

// ── Contacts ─────────────────────────────────────────────────────────────────

export interface ContactEntry {
  id: string;
  name: string;
  phone?: string;
}

/** Contact import is supported on native platforms only. */
export function isContactsSupported(): boolean {
  return Platform.OS !== 'web';
}

/**
 * Requests contacts permission and returns a name/phone list for the
 * in-app picker. Returns an empty list on denial or error.
 */
export async function fetchContacts(): Promise<ContactEntry[]> {
  if (Platform.OS === 'web') return [];
  let Contacts: any;
  try {
    Contacts = require('expo-contacts');
  } catch (e) {
    console.log('expo-contacts not available:', e);
    return [];
  }
  try {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') return [];
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      sort: Contacts.SortTypes.UserFirstName,
      pageSize: 500,
    });
    return data
      .filter((c: { name?: string }) => !!c.name)
      .map((c: { id: string; name: string; phoneNumbers?: Array<{ number?: string }> }) => ({
        id: c.id,
        name: c.name,
        phone: c.phoneNumbers?.[0]?.number?.replace(/ /g, ''),
      }));
  } catch (e) {
    console.log('Contacts fetch failed:', e);
    return [];
  }
}
