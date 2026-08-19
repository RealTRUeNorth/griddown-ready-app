import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import { Download, X, CheckCircle2, AlertTriangle, RotateCcw, Trash2, ExternalLink } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { KiwixResource } from '@/types';
import { useDownloads, formatBytes } from '@/providers/DownloadProvider';

const LARGE_DOWNLOAD_BYTES = 1024 * 1024 * 1024; // 1 GB

/**
 * Download control for a Kiwix resource. Renders the appropriate action for
 * the current download state: start (with size confirmation for large files),
 * live progress with cancel, completed (open/delete), error retry, or
 * canceled restart. On web, hands off to the browser's download manager.
 */
export default function KiwixDownloadControl({ resource }: { resource: KiwixResource }) {
  const { downloads, startDownload, cancelDownload, deleteDownload } = useDownloads();
  const record = downloads[resource.id];
  const status = record?.status;

  const handleStart = useCallback(() => {
    const sizeBytes = resource.sizeBytes ?? 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (sizeBytes >= LARGE_DOWNLOAD_BYTES) {
      Alert.alert(
        'Large Download',
        `${resource.title} is ${formatBytes(sizeBytes)}. Make sure you have enough free storage and a stable connection.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download', onPress: () => void startDownload(resource) },
        ]
      );
    } else {
      void startDownload(resource);
    }
  }, [resource, startDownload]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Download',
      `Remove the downloaded ${resource.title} file from this device?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            void deleteDownload(resource.id);
          },
        },
      ]
    );
  }, [resource, deleteDownload]);

  const handleOpen = useCallback(async () => {
    if (!record?.fileUri) return;
    try {
      const Sharing = require('expo-sharing');
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(record.fileUri, {
          mimeType: 'application/octet-stream',
          dialogTitle: `Open ${resource.title}`,
        });
      } else {
        Alert.alert('Not Available', 'Sharing is not available on this device.');
      }
    } catch (e) {
      console.log('Open/share error:', e);
    }
  }, [record, resource.title]);

  if (Platform.OS === 'web') {
    return (
      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={() => void Linking.openURL(resource.downloadUrl)}
        activeOpacity={0.7}
        testID={`download-${resource.id}`}
      >
        <Download color={Colors.orange} size={16} />
        <Text style={styles.downloadBtnText}>Download · {resource.sizeLabel}</Text>
      </TouchableOpacity>
    );
  }

  if (status === 'downloading' && record) {
    const pct = record.totalBytes > 0 ? Math.round(record.progress * 100) : 0;
    return (
      <View style={styles.progressWrap}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {record.totalBytes > 0
              ? `${formatBytes(record.bytesWritten)} / ${formatBytes(record.totalBytes)}`
              : formatBytes(record.bytesWritten)}
          </Text>
          <Text style={styles.progressPct}>{pct}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
        </View>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            void cancelDownload(resource.id);
          }}
          activeOpacity={0.7}
          testID={`cancel-${resource.id}`}
        >
          <X color={Colors.textSecondary} size={14} />
          <Text style={styles.cancelBtnText}>Cancel Download</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'completed' && record) {
    return (
      <View style={styles.completedWrap}>
        <View style={styles.completedRow}>
          <CheckCircle2 color={Colors.statusGreen} size={16} />
          <Text style={styles.completedText}>
            On device · {formatBytes(record.totalBytes)}
          </Text>
        </View>
        <View style={styles.completedActions}>
          <TouchableOpacity style={styles.openBtn} onPress={handleOpen} activeOpacity={0.7}>
            <ExternalLink color={Colors.white} size={14} />
            <Text style={styles.openBtnText}>Open With…</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.7}>
            <Trash2 color={Colors.statusRed} size={14} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.errorWrap}>
        <View style={styles.errorRow}>
          <AlertTriangle color={Colors.statusRed} size={14} />
          <Text style={styles.errorText} numberOfLines={1}>
            {record?.error ?? 'Download failed'}
          </Text>
        </View>
        <TouchableOpacity style={styles.retryBtn} onPress={handleStart} activeOpacity={0.7}>
          <RotateCcw color={Colors.orange} size={14} />
          <Text style={styles.retryBtnText}>Retry · {resource.sizeLabel}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.idleWrap}>
      {status === 'canceled' && (
        <Text style={styles.canceledText}>Download canceled</Text>
      )}
      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={handleStart}
        activeOpacity={0.7}
        testID={`download-${resource.id}`}
      >
        <Download color={Colors.orange} size={16} />
        <Text style={styles.downloadBtnText}>
          {status === 'canceled' ? 'Restart' : 'Download'} · {resource.sizeLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  idleWrap: {
    gap: 6,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.orangeMuted,
    backgroundColor: Colors.orangeMuted + '25',
  },
  downloadBtnText: {
    color: Colors.orange,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  canceledText: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  progressWrap: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600' as const,
  },
  progressPct: {
    color: Colors.orange,
    fontSize: 11,
    fontWeight: '800' as const,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.bgElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.orange,
    borderRadius: 3,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: Colors.bgElevated,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  completedWrap: {
    gap: 8,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedText: {
    color: Colors.statusGreen,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  completedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  openBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.olive,
    borderRadius: 8,
    paddingVertical: 9,
  },
  openBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  deleteBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.redMuted,
    backgroundColor: Colors.redMuted + '25',
  },
  errorWrap: {
    gap: 8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    color: Colors.statusRed,
    fontSize: 11,
    fontWeight: '600' as const,
    flex: 1,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.orangeMuted,
    backgroundColor: Colors.orangeMuted + '25',
  },
  retryBtnText: {
    color: Colors.orange,
    fontSize: 13,
    fontWeight: '700' as const,
  },
});
