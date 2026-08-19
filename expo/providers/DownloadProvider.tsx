import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KiwixResource } from '@/types';

const DOWNLOADS_KEY = 'griddown_kiwix_downloads';
const KIWIX_DIR = 'kiwix/';

export type DownloadStatus = 'downloading' | 'completed' | 'error' | 'canceled';

export interface DownloadRecord {
  resourceId: string;
  fileName: string;
  status: DownloadStatus;
  progress: number;
  bytesWritten: number;
  totalBytes: number;
  fileUri?: string;
  error?: string;
  updatedAt: string;
}

interface DownloadResumableLike {
  downloadAsync: () => Promise<{ uri: string } | undefined>;
  cancelAsync: () => Promise<void>;
}

/**
 * Formats a byte count as a human-readable string, e.g. "412 MB".
 */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${Math.round(mb)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function fileNameFor(resource: KiwixResource): string {
  const fromUrl = resource.downloadUrl.split('/').pop();
  if (fromUrl && fromUrl.endsWith('.zim')) return fromUrl;
  return `${resource.id}.zim`;
}

/**
 * Manages real Kiwix ZIM file downloads with progress, cancellation, and
 * on-disk verification. Records persist across launches; interrupted
 * downloads are marked canceled and completed files are re-verified.
 */
export const [DownloadProvider, useDownloads] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [downloads, setDownloads] = useState<Record<string, DownloadRecord>>({});
  const resumablesRef = useRef<Map<string, DownloadResumableLike>>(new Map());
  const lastProgressPushRef = useRef<Map<string, number>>(new Map());

  const loadQuery = useQuery({
    queryKey: ['kiwixDownloads'],
    queryFn: async (): Promise<Record<string, DownloadRecord>> => {
      if (Platform.OS === 'web') return {};
      try {
        const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as Record<string, DownloadRecord>;
        const FileSystem = require('expo-file-system/legacy');
        const verified: Record<string, DownloadRecord> = {};
        for (const [id, rec] of Object.entries(parsed)) {
          if (rec.status === 'downloading') {
            // Interrupted by app restart — clean up any partial file
            if (rec.fileUri) {
              await FileSystem.deleteAsync(rec.fileUri, { idempotent: true }).catch(() => {});
            }
            verified[id] = { ...rec, status: 'canceled', updatedAt: new Date().toISOString() };
            continue;
          }
          if (rec.status === 'completed' && rec.fileUri) {
            const info = await FileSystem.getInfoAsync(rec.fileUri);
            if (info.exists) {
              verified[id] = rec;
            }
            // File vanished from disk — drop the record entirely
            continue;
          }
          verified[id] = rec;
        }
        return verified;
      } catch (e) {
        console.log('Failed to load download records:', e);
        return {};
      }
    },
  });

  useEffect(() => {
    if (loadQuery.data) {
      setDownloads(loadQuery.data);
    }
  }, [loadQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (records: Record<string, DownloadRecord>) => {
      await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(records));
      return records;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kiwixDownloads'] });
    },
  });

  const setRecord = useCallback(
    (id: string, record: DownloadRecord) => {
      setDownloads((prev) => {
        const next = { ...prev, [id]: record };
        saveMutation.mutate(next);
        return next;
      });
    },
    [saveMutation]
  );

  const pushProgress = useCallback((id: string, bytesWritten: number, totalBytes: number) => {
    const now = Date.now();
    const lastPush = lastProgressPushRef.current.get(id) ?? 0;
    const progress = totalBytes > 0 ? bytesWritten / totalBytes : 0;
    // Throttle UI updates to ~4/sec; always push 100%
    if (now - lastPush < 250 && progress < 1) return;
    lastProgressPushRef.current.set(id, now);
    setDownloads((prev) => {
      const existing = prev[id];
      if (!existing || existing.status !== 'downloading') return prev;
      return { ...prev, [id]: { ...existing, bytesWritten, totalBytes, progress, updatedAt: new Date().toISOString() } };
    });
  }, []);

  const startDownload = useCallback(
    async (resource: KiwixResource) => {
      if (Platform.OS === 'web') {
        // No persistent filesystem on web — hand off to the browser
        await Linking.openURL(resource.downloadUrl);
        return;
      }
      const existing = downloads[resource.id];
      if (existing?.status === 'downloading') return;
      if (existing?.status === 'completed') return;

      const fileName = fileNameFor(resource);
      const initial: DownloadRecord = {
        resourceId: resource.id,
        fileName,
        status: 'downloading',
        progress: 0,
        bytesWritten: 0,
        totalBytes: resource.sizeBytes ?? 0,
        updatedAt: new Date().toISOString(),
      };
      setRecord(resource.id, initial);

      try {
        const FileSystem = require('expo-file-system/legacy');
        const dir = FileSystem.documentDirectory + KIWIX_DIR;
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
        const targetUri = dir + fileName;
        // Clear any stale partial from a previous attempt
        await FileSystem.deleteAsync(targetUri, { idempotent: true }).catch(() => {});

        const resumable: DownloadResumableLike = FileSystem.createDownloadResumable(
          resource.downloadUrl,
          targetUri,
          {},
          (p: { totalBytesWritten: number; totalBytesExpectedToWrite: number }) => {
            pushProgress(resource.id, p.totalBytesWritten, p.totalBytesExpectedToWrite);
          }
        );
        resumablesRef.current.set(resource.id, resumable);

        const result = await resumable.downloadAsync();
        resumablesRef.current.delete(resource.id);

        if (!result?.uri) {
          // Canceled mid-flight
          const canceled: DownloadRecord = {
            ...initial,
            status: 'canceled',
            updatedAt: new Date().toISOString(),
          };
          setRecord(resource.id, canceled);
          return;
        }

        const info = await FileSystem.getInfoAsync(result.uri);
        const finalBytes = info.exists && typeof info.size === 'number' && info.size > 0
          ? info.size
          : (resource.sizeBytes ?? 0);

        setRecord(resource.id, {
          ...initial,
          status: 'completed',
          progress: 1,
          bytesWritten: finalBytes,
          totalBytes: finalBytes,
          fileUri: result.uri,
          updatedAt: new Date().toISOString(),
        });
        console.log('Kiwix download complete:', resource.id, formatBytes(finalBytes));
      } catch (e) {
        resumablesRef.current.delete(resource.id);
        const message = e instanceof Error ? e.message : 'Download failed';
        // cancelAsync() rejects the download promise — don't overwrite a canceled record
        setDownloads((prev) => {
          const current = prev[resource.id];
          if (current?.status === 'canceled') return prev;
          const failed: DownloadRecord = {
            ...initial,
            status: 'error',
            error: message,
            updatedAt: new Date().toISOString(),
          };
          const next = { ...prev, [resource.id]: failed };
          saveMutation.mutate(next);
          return next;
        });
        console.log('Kiwix download error:', resource.id, message);
      }
    },
    [downloads, setRecord, pushProgress, saveMutation]
  );

  const cancelDownload = useCallback(
    async (resourceId: string) => {
      const resumable = resumablesRef.current.get(resourceId);
      resumablesRef.current.delete(resourceId);
      const existing = downloads[resourceId];
      if (resumable) {
        await resumable.cancelAsync().catch(() => {});
      }
      if (existing?.fileUri && Platform.OS !== 'web') {
        try {
          const FileSystem = require('expo-file-system/legacy');
          await FileSystem.deleteAsync(existing.fileUri, { idempotent: true });
        } catch {}
      }
      if (existing) {
        setRecord(resourceId, { ...existing, status: 'canceled', updatedAt: new Date().toISOString() });
      }
    },
    [downloads, setRecord]
  );

  const deleteDownload = useCallback(
    async (resourceId: string) => {
      const existing = downloads[resourceId];
      if (existing?.status === 'downloading') {
        await cancelDownload(resourceId);
      }
      if (existing?.fileUri && Platform.OS !== 'web') {
        try {
          const FileSystem = require('expo-file-system/legacy');
          await FileSystem.deleteAsync(existing.fileUri, { idempotent: true });
        } catch (e) {
          console.log('Failed to delete download:', e);
        }
      }
      setDownloads((prev) => {
        const next = { ...prev };
        delete next[resourceId];
        saveMutation.mutate(next);
        return next;
      });
    },
    [downloads, cancelDownload, saveMutation]
  );

  const totalDownloadedBytes = useMemo(() => {
    return Object.values(downloads)
      .filter((d) => d.status === 'completed')
      .reduce((sum, d) => sum + d.totalBytes, 0);
  }, [downloads]);

  return useMemo(
    () => ({
      downloads,
      isLoading: loadQuery.isLoading,
      startDownload,
      cancelDownload,
      deleteDownload,
      totalDownloadedBytes,
    }),
    [downloads, loadQuery.isLoading, startDownload, cancelDownload, deleteDownload, totalDownloadedBytes]
  );
});
