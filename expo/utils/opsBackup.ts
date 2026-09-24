import { AppData, AlertLevel } from '@/types';

export const OPS_BACKUP_FORMAT = 'griddown-ops-backup';
export const OPS_BACKUP_VERSION = 1;

export interface OpsBackupFile {
  format: string;
  version: number;
  exportedAt: string;
  data: AppData;
}

const ALERT_LEVELS: AlertLevel[] = ['green', 'amber', 'red'];

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * Builds a shareable ops-kit JSON string from live app data.
 */
export function serializeOpsBackup(data: AppData): string {
  const payload: OpsBackupFile = {
    format: OPS_BACKUP_FORMAT,
    version: OPS_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Accepts either a wrapped ops-backup file or a raw AppData object.
 */
export function parseOpsBackup(raw: string): AppData | null {
  try {
    const parsed = JSON.parse(raw) as OpsBackupFile | AppData | null;
    if (!parsed || typeof parsed !== 'object') return null;

    const maybeWrapped = parsed as OpsBackupFile;
    const source: Partial<AppData> =
      maybeWrapped.format === OPS_BACKUP_FORMAT && maybeWrapped.data
        ? maybeWrapped.data
        : (parsed as AppData);

    const alertLevel = ALERT_LEVELS.includes(source.alertLevel as AlertLevel)
      ? (source.alertLevel as AlertLevel)
      : 'green';

    return {
      alertLevel,
      groupName: typeof source.groupName === 'string' && source.groupName.trim()
        ? source.groupName
        : 'My Group',
      checkInIntervalHours: typeof source.checkInIntervalHours === 'number' && source.checkInIntervalHours > 0
        ? source.checkInIntervalHours
        : 6,
      remindersEnabled: typeof source.remindersEnabled === 'boolean' ? source.remindersEnabled : false,
      members: asArray(source.members),
      supplies: asArray(source.supplies),
      checklists: asArray(source.checklists),
      pois: asArray(source.pois),
      routes: asArray(source.routes),
      commsChannels: asArray(source.commsChannels),
      commsRepeaters: asArray(source.commsRepeaters),
      kiwixLibrary: asArray(source.kiwixLibrary),
    };
  } catch {
    return null;
  }
}

export function backupCounts(data: AppData): {
  members: number;
  supplies: number;
  checklists: number;
  pois: number;
  routes: number;
  channels: number;
  repeaters: number;
} {
  return {
    members: data.members.length,
    supplies: data.supplies.length,
    checklists: data.checklists.length,
    pois: data.pois.length,
    routes: data.routes.length,
    channels: data.commsChannels.length,
    repeaters: data.commsRepeaters.length,
  };
}
