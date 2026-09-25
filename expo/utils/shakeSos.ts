import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

let Accelerometer: any = null;
if (Platform.OS !== 'web') {
  try {
    Accelerometer = require('expo-sensors').Accelerometer;
  } catch (e) {
    console.log('expo-sensors not available:', e);
  }
}

const SHAKE_THRESHOLD = 2.6; // total acceleration in g
const REQUIRED_HITS = 3; // consecutive over-threshold samples
const COOLDOWN_MS = 5000;

/**
 * Detects a firm shake via the accelerometer and invokes `onShake`.
 * Requires several consecutive strong samples plus a cooldown so bumps
 * and normal handling do not trigger it. No-op on web or when disabled.
 */
export function useShakeSos(enabled: boolean, onShake: () => void): void {
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;

  useEffect(() => {
    if (!enabled || Platform.OS === 'web' || !Accelerometer) return;
    let hits = 0;
    let lastFire = 0;
    let active = true;

    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener(({ x, y, z }: { x: number; y: number; z: number }) => {
      if (!active) return;
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude > SHAKE_THRESHOLD) {
        hits += 1;
      } else {
        hits = Math.max(0, hits - 1);
      }
      if (hits >= REQUIRED_HITS) {
        hits = 0;
        const now = Date.now();
        if (now - lastFire < COOLDOWN_MS) return;
        lastFire = now;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        onShakeRef.current();
      }
    });

    return () => {
      active = false;
      sub.remove();
    };
  }, [enabled]);
}
