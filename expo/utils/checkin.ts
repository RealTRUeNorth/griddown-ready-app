import { GroupMember } from '@/types';
import Colors from '@/constants/colors';

export type CheckInState = 'never' | 'current' | 'dueSoon' | 'overdue';

export const DEFAULT_CHECK_IN_INTERVAL_HOURS = 6;
export const CHECK_IN_INTERVAL_OPTIONS = [2, 4, 6, 8, 12, 24];

/**
 * Computes the check-in state for a member given the group's check-in cadence.
 * A member is "dueSoon" once 75% of the interval has elapsed, and "overdue"
 * once the full interval has passed without a check-in.
 */
export function getCheckInState(
  member: GroupMember,
  intervalHours: number,
  now: Date = new Date()
): CheckInState {
  if (!member.lastCheckInAt) return 'never';
  const last = new Date(member.lastCheckInAt);
  if (Number.isNaN(last.getTime())) return 'never';
  const elapsedMs = now.getTime() - last.getTime();
  const intervalMs = intervalHours * 60 * 60 * 1000;
  if (elapsedMs >= intervalMs) return 'overdue';
  if (elapsedMs >= intervalMs * 0.75) return 'dueSoon';
  return 'current';
}

export function checkInStatusLabel(state: CheckInState): string {
  switch (state) {
    case 'never': return 'NO CHECK-IN';
    case 'current': return 'CURRENT';
    case 'dueSoon': return 'DUE SOON';
    case 'overdue': return 'OVERDUE';
  }
}

export function checkInStatusColor(state: CheckInState): string {
  switch (state) {
    case 'never': return Colors.textMuted;
    case 'current': return Colors.statusGreen;
    case 'dueSoon': return Colors.statusAmber;
    case 'overdue': return Colors.statusRed;
  }
}

/**
 * Formats an ISO timestamp as a short relative string, e.g. "25m ago", "3h ago", "2d ago".
 */
export function formatTimeSince(iso?: string, now: Date = new Date()): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Never';
  const ms = now.getTime() - date.getTime();
  if (ms < 0) return 'Just now';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Returns how long a member is past their expected check-in, or null if not overdue.
 */
export function overdueBy(member: GroupMember, intervalHours: number, now: Date = new Date()): string | null {
  if (!member.lastCheckInAt) return null;
  const last = new Date(member.lastCheckInAt);
  if (Number.isNaN(last.getTime())) return null;
  const overdueMs = now.getTime() - last.getTime() - intervalHours * 60 * 60 * 1000;
  if (overdueMs <= 0) return null;
  const minutes = Math.floor(overdueMs / 60000);
  if (minutes < 60) return `${minutes}m overdue`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h overdue`;
  return `${Math.floor(hours / 24)}d overdue`;
}
