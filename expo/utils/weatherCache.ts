import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinates, WeatherData } from '@/types';

const WEATHER_CACHE_KEY = 'griddown_weather_cache';

export interface CachedWeather {
  data: WeatherData;
  savedAt: string;
  latitude: number;
  longitude: number;
}

/**
 * Persists the last successful weather fetch so the app can show
 * conditions when the network is unavailable.
 */
export async function saveWeatherCache(data: WeatherData, location: Coordinates): Promise<void> {
  try {
    const payload: CachedWeather = {
      data,
      savedAt: new Date().toISOString(),
      latitude: location.latitude,
      longitude: location.longitude,
    };
    await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.log('Failed to save weather cache:', e);
  }
}

export async function loadWeatherCache(): Promise<CachedWeather | null> {
  try {
    const raw = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedWeather;
    if (!parsed?.data || typeof parsed.data.temperature !== 'number') return null;
    return parsed;
  } catch (e) {
    console.log('Failed to load weather cache:', e);
    return null;
  }
}

/**
 * Formats a cached-weather timestamp for the stale indicator, e.g. "2:30 PM".
 */
export function formatCachedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
