import { Platform } from 'react-native';
import { SupplyItem } from '@/types';

let Notifications: any = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch (e) {
    console.log('expo-notifications not available:', e);
  }
}

const CHECK_IN_REMINDER_ID = 'griddown-checkin-reminder';
const SUPPLY_NOTIFICATION_PREFIX = 'griddown-supply-';
const EXPIRY_WINDOW_DAYS = 30;

/** True when local notifications can be used on this platform. */
export function isNotificationsSupported(): boolean {
  return Notifications != null;
}

/** Shows notifications while the app is in the foreground. */
export function configureNotificationHandler(): void {
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Requests notification permission. Returns false if denied or unsupported. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    if (!settings.canAskAgain) return false;
    const request = await Notifications.requestPermissionsAsync();
    return !!request.granted;
  } catch (e) {
    console.log('Notification permission error:', e);
    return false;
  }
}

/**
 * Schedules a repeating check-in reminder aligned to the group's cadence.
 * Cancels any previous reminder first; no-op when reminders are disabled.
 */
export async function scheduleCheckInReminder(intervalHours: number): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(CHECK_IN_REMINDER_ID);
  } catch {
    // Nothing scheduled yet — safe to ignore
  }
  if (intervalHours <= 0) return;
  const seconds = Math.max(60, intervalHours * 60 * 60);
  await Notifications.scheduleNotificationAsync({
    identifier: CHECK_IN_REMINDER_ID,
    content: {
      title: 'Check-In Due',
      body: 'Log check-ins for your group so everyone stays marked ready.',
      sound: false,
    },
    trigger: { seconds, repeats: true, type: 'timeInterval' },
  });
}

/** Cancels the repeating check-in reminder. */
export async function cancelCheckInReminder(): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(CHECK_IN_REMINDER_ID);
  } catch {
    // Nothing scheduled — safe to ignore
  }
}

/** Parses supply expiration strings: "YYYY-MM-DD" or "YYYY-MM" (end of month). */
function parseExpiry(raw: string): Date | null {
  const dayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (dayMatch) {
    const d = new Date(Number(dayMatch[1]), Number(dayMatch[2]) - 1, Number(dayMatch[3]), 9, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(raw.trim());
  if (monthMatch) {
    // First day of the following month = the month is fully expired then
    const d = new Date(Number(monthMatch[1]), Number(monthMatch[2]), 1, 9, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Schedules one alert per dated supply item, fired 30 days before expiry
 * (immediately if already inside the window). Past dates are skipped.
 */
export async function rescheduleSupplyExpiryNotifications(supplies: SupplyItem[]): Promise<void> {
  if (!Notifications) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const staleIds = scheduled
      .map((n: { identifier: string }) => n.identifier)
      .filter((id: string) => id.startsWith(SUPPLY_NOTIFICATION_PREFIX));
    await Promise.all(
      staleIds.map((id: string) => Notifications.cancelScheduledNotificationAsync(id))
    );
  } catch (e) {
    console.log('Could not clear old supply notifications:', e);
  }

  const now = Date.now();
  for (const item of supplies) {
    if (!item.expirationDate) continue;
    const expiry = parseExpiry(item.expirationDate);
    if (!expiry || expiry.getTime() <= now) continue;
    const remindAt = new Date(
      Math.max(expiry.getTime() - EXPIRY_WINDOW_DAYS * 24 * 60 * 60 * 1000, now + 60_000)
    );
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `${SUPPLY_NOTIFICATION_PREFIX}${item.id}`,
        content: {
          title: 'Supply Expiring',
          body: `${item.name} expires ${item.expirationDate}. Rotate or restock soon.`,
          sound: false,
        },
        trigger: { date: remindAt, type: 'calendar' },
      });
    } catch (e) {
      console.log('Could not schedule supply notification:', e);
    }
  }
}

/** Cancels every GRIDDOWN reminder (check-in + supply expiry). */
export async function cancelAllReminders(): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.log('Could not cancel notifications:', e);
  }
}
