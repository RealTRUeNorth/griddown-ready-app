import { Linking, Platform } from 'react-native';
import { Coordinates } from '@/types';

/**
 * Opens turn-by-turn directions to a coordinate in the platform's native
 * maps app (Apple Maps on iOS, Google Maps on Android, Google Maps web).
 */
export async function openDirectionsTo(destination: Coordinates, label?: string): Promise<boolean> {
  const { latitude, longitude } = destination;
  const latLng = `${latitude},${longitude}`;
  const encodedLabel = encodeURIComponent(label ?? 'Destination');

  try {
    if (Platform.OS === 'web') {
      await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latLng}`);
      return true;
    }

    if (Platform.OS === 'ios') {
      const appleUrl = `maps://?daddr=${latLng}&q=${encodedLabel}`;
      if (await Linking.canOpenURL(appleUrl)) {
        await Linking.openURL(appleUrl);
        return true;
      }
      await Linking.openURL(`https://maps.apple.com/?daddr=${latLng}&q=${encodedLabel}`);
      return true;
    }

    // Android: turn-by-turn navigation intent, with geo: fallback
    const navUrl = `google.navigation:q=${latLng}`;
    if (await Linking.canOpenURL(navUrl)) {
      await Linking.openURL(navUrl);
      return true;
    }
    await Linking.openURL(`geo:${latLng}?q=${latLng}(${encodedLabel})`);
    return true;
  } catch (e) {
    console.log('Failed to open directions:', e);
    return false;
  }
}
