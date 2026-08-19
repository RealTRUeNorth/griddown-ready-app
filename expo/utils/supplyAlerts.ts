import { SupplyItem } from '@/types';

const SOON_DAYS = 30;

/**
 * Parses expiration strings like "2026-12", "2026-12-15", or ISO dates.
 * Month-only values are treated as the last day of that month.
 */
export function parseExpirationDate(raw?: string): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const monthOnly = /^(\d{4})-(\d{1,2})$/.exec(trimmed);
  if (monthOnly) {
    const year = parseInt(monthOnly[1], 10);
    const month = parseInt(monthOnly[2], 10);
    if (month < 1 || month > 12) return null;
    return new Date(year, month, 0, 23, 59, 59, 999);
  }

  const dayOnly = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (dayOnly) {
    const year = parseInt(dayOnly[1], 10);
    const month = parseInt(dayOnly[2], 10);
    const day = parseInt(dayOnly[3], 10);
    const date = new Date(year, month - 1, day, 23, 59, 59, 999);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isSupplyLow(item: SupplyItem): boolean {
  return item.quantity <= item.minimumQuantity;
}

export function getExpirationStatus(
  item: SupplyItem,
  now: Date = new Date()
): 'expired' | 'soon' | 'ok' | 'none' {
  const date = parseExpirationDate(item.expirationDate);
  if (!date) return 'none';
  if (date.getTime() < now.getTime()) return 'expired';
  const soon = new Date(now);
  soon.setDate(soon.getDate() + SOON_DAYS);
  if (date.getTime() <= soon.getTime()) return 'soon';
  return 'ok';
}

export interface InventoryAlertSummary {
  low: SupplyItem[];
  expired: SupplyItem[];
  expiringSoon: SupplyItem[];
}

export function getInventoryAlerts(
  supplies: SupplyItem[],
  now: Date = new Date()
): InventoryAlertSummary {
  const low: SupplyItem[] = [];
  const expired: SupplyItem[] = [];
  const expiringSoon: SupplyItem[] = [];

  for (const item of supplies) {
    if (isSupplyLow(item)) low.push(item);
    const status = getExpirationStatus(item, now);
    if (status === 'expired') expired.push(item);
    if (status === 'soon') expiringSoon.push(item);
  }

  return { low, expired, expiringSoon };
}
