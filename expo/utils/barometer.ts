import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

let Barometer: any = null;
if (Platform.OS !== 'web') {
  try {
    Barometer = require('expo-sensors').Barometer;
  } catch (e) {
    console.log('expo-sensors Barometer not available:', e);
  }
}

export type PressureTrend = 'steady' | 'rising' | 'falling';

export interface BarometerReading {
  /** True when the device exposes a live barometer. */
  supported: boolean;
  /** Current ambient pressure in hPa. */
  pressure: number | null;
  trend: PressureTrend;
  /** Change in hPa per hour over the observed window (null until enough data). */
  ratePerHour: number | null;
  /** True when pressure is falling fast enough to suggest deteriorating weather. */
  stormRisk: boolean;
}

const SAMPLE_MIN_INTERVAL_MS = 5000;
const MAX_SAMPLE_AGE_MS = 30 * 60 * 1000;
const MIN_WINDOW_HOURS = 0.05; // ~3 minutes of samples before trusting the rate
const TREND_THRESHOLD = 0.5; // hPa/h before calling it rising/falling
const STORM_RATE = -1.5; // hPa/h drop suggesting deteriorating weather

const IDLE_READING: BarometerReading = {
  supported: false,
  pressure: null,
  trend: 'steady',
  ratePerHour: null,
  stormRisk: false,
};

/**
 * Streams the device barometer and derives a rolling pressure trend.
 * Falls back to `supported: false` on web, simulators, and devices
 * without a barometer so callers can hide the card gracefully.
 */
export function useBarometer(): BarometerReading {
  const [reading, setReading] = useState<BarometerReading>(IDLE_READING);
  const samples = useRef<Array<{ t: number; p: number }>>([]);
  const lastPush = useRef(0);

  useEffect(() => {
    if (Platform.OS === 'web' || !Barometer) return;
    let active = true;

    (async () => {
      try {
        const available = await Barometer.isAvailableAsync();
        if (!available || !active) return;
      } catch (e) {
        console.log('Barometer availability check failed:', e);
        return;
      }

      Barometer.setUpdateInterval(1000);
      const sub = Barometer.addListener(({ pressure }: { pressure?: number }) => {
        if (pressure == null || !active) return;
        const now = Date.now();
        if (now - lastPush.current < SAMPLE_MIN_INTERVAL_MS) return;
        lastPush.current = now;

        samples.current.push({ t: now, p: pressure });
        samples.current = samples.current.filter((s) => now - s.t <= MAX_SAMPLE_AGE_MS);
        const arr = samples.current;

        if (arr.length < 2) {
          setReading({ supported: true, pressure, trend: 'steady', ratePerHour: null, stormRisk: false });
          return;
        }

        const first = arr[0];
        const windowHours = (now - first.t) / 3600000;
        if (windowHours < MIN_WINDOW_HOURS) {
          setReading({ supported: true, pressure, trend: 'steady', ratePerHour: null, stormRisk: false });
          return;
        }

        const rate = (pressure - first.p) / windowHours;
        const trend: PressureTrend =
          rate < -TREND_THRESHOLD ? 'falling' : rate > TREND_THRESHOLD ? 'rising' : 'steady';
        setReading({
          supported: true,
          pressure,
          trend,
          ratePerHour: rate,
          stormRisk: rate <= STORM_RATE,
        });
      });
    })();

    return () => {
      active = false;
    };
  }, []);

  return reading;
}
