import { Platform, Linking } from 'react-native';

/**
 * Builds a platform-correct sms: URL. iOS separates recipients with commas
 * and takes the body after "&"; Android uses semicolons and "?body=".
 */
export function buildSmsUrl(recipients: string[], body: string): string {
  const numbers = recipients
    .map((n) => n.replace(/[^\d+]/g, ''))
    .filter(Boolean);
  const separator = Platform.OS === 'ios' ? ',' : ';';
  const connector = Platform.OS === 'ios' ? '&' : '?';
  const list = numbers.join(separator);
  const encoded = encodeURIComponent(body);
  return list
    ? `sms:${list}${connector}body=${encoded}`
    : `sms:${connector}body=${encoded}`;
}

/**
 * Opens the system messaging app with recipients and body prefilled.
 * Returns false when the platform cannot open a messaging app (e.g. iOS
 * simulator) so callers can show a friendly message.
 */
export async function openSms(recipients: string[], body: string): Promise<boolean> {
  const url = buildSmsUrl(recipients, body);
  try {
    await Linking.openURL(url);
    return true;
  } catch (e) {
    console.log('SMS open failed:', e);
    return false;
  }
}
