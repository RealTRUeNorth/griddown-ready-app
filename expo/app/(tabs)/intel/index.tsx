import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { router, Href } from 'expo-router';
import {
  Users,
  BookMarked,
  BookOpen,
  ChevronRight,
  Heart,
  Upload,
  Download,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { defaultGuides } from '@/mocks/guides';
import { parseOpsBackup, backupCounts } from '@/utils/opsBackup';

function NavCard({
  icon,
  iconBg,
  title,
  description,
  badge,
  badgeColor,
  extra,
  onPress,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  extra?: React.ReactNode;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.cardIcon, { backgroundColor: iconBg }]}>{icon}</View>
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{title}</Text>
            {badge ? (
              <View style={[styles.cardBadge, { backgroundColor: (badgeColor ?? Colors.olive) + '22' }]}>
                <Text style={[styles.cardBadgeText, { color: badgeColor ?? Colors.olive }]}>{badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.cardDesc}>{description}</Text>
          {extra}
        </View>
        <ChevronRight color={Colors.textMuted} size={18} />
      </Animated.View>
    </Pressable>
  );
}

export default function IntelHubScreen() {
  const { members, kiwixLibrary, exportOpsBackup, importOpsBackup, currentSnapshot } = useAppData();

  const readyMembers = members.filter((m) => m.status === 'ready').length;

  const handleExportBackup = useCallback(async () => {
    const json = exportOpsBackup();
    const counts = backupCounts(currentSnapshot());
    const countsText = `${counts.members} members · ${counts.supplies} supplies · ${counts.pois} POIs · ${counts.routes} routes · ${counts.channels} channels · ${counts.repeaters} repeaters`;

    // Prefer the system share sheet so the backup can go anywhere — Files,
    // Messages, AirDrop, mail. Dismissing falls through to clipboard.
    if (Platform.OS !== 'web') {
      try {
        const result = await Share.share({
          title: 'GRIDDOWN Ops Backup',
          message: json,
        });
        if (result.action !== Share.dismissedAction) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return;
      } catch (e) {
        console.log('Share-sheet export failed, falling back to clipboard:', e);
      }
    }

    // Fallback: clipboard copy (web, or sharing unavailable)
    try {
      await Clipboard.setStringAsync(json);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Ops Backup Copied',
        `Full ops kit copied to clipboard:\n\n${countsText}\n\nPaste it into a note, message, or another device to store it.`
      );
    } catch (e) {
      console.log('Export backup failed:', e);
      Alert.alert('Export Failed', 'Could not copy the backup to clipboard.');
    }
  }, [exportOpsBackup, currentSnapshot]);

  const handleImportBackup = useCallback(async () => {
    try {
      const raw = await Clipboard.getStringAsync();
      if (!raw || !raw.trim()) {
        Alert.alert('Nothing to Import', 'Copy a GRIDDOWN ops backup to your clipboard first.');
        return;
      }
      const parsed = parseOpsBackup(raw);
      if (!parsed) {
        Alert.alert('Invalid Backup', 'Clipboard contents are not a valid GRIDDOWN ops backup.');
        return;
      }
      const counts = backupCounts(parsed);
      Alert.alert(
        'Replace All Data?',
        `This will overwrite everything with the backup:\n\n${counts.members} members · ${counts.supplies} supplies · ${counts.pois} POIs · ${counts.routes} routes · ${counts.channels} channels · ${counts.repeaters} repeaters`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: () => {
              const ok = importOpsBackup(raw);
              if (ok) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Import Complete', 'Ops kit restored from backup.');
              } else {
                Alert.alert('Import Failed', 'Could not restore from this backup.');
              }
            },
          },
        ]
      );
    } catch (e) {
      console.log('Import backup failed:', e);
      Alert.alert('Import Failed', 'Could not read the clipboard.');
    }
  }, [importOpsBackup]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>PERSONNEL & RESOURCES</Text>

      <NavCard
        icon={<Users color={Colors.oliveLight} size={24} />}
        iconBg={Colors.oliveMuted}
        title="Group Roster"
        description={`${members.length} member${members.length !== 1 ? 's' : ''} registered`}
        badge={`${readyMembers} READY`}
        badgeColor={readyMembers === members.length ? Colors.statusGreen : Colors.statusAmber}
        extra={
          <View style={styles.memberStatusRow}>
            {members.slice(0, 4).map((m) => (
              <View key={m.id} style={styles.memberDot}>
                <View
                  style={[
                    styles.memberStatusDot,
                    {
                      backgroundColor:
                        m.status === 'ready'
                          ? Colors.statusGreen
                          : m.status === 'unavailable'
                          ? Colors.statusRed
                          : Colors.statusAmber,
                    },
                  ]}
                />
                <Text style={styles.memberDotName} numberOfLines={1}>{m.name.split(' ')[0]}</Text>
              </View>
            ))}
            {members.length > 4 && (
              <View style={styles.memberMore}>
                <Text style={styles.memberMoreText}>+{members.length - 4}</Text>
              </View>
            )}
          </View>
        }
        onPress={() => router.push('/intel/group' as Href)}
      />

      <NavCard
        icon={<BookMarked color={Colors.amberLight} size={24} />}
        iconBg="rgba(232, 192, 74, 0.15)"
        title="Kiwix Offline Library"
        description="Downloadable reference files for offline preparedness"
        badge={kiwixLibrary.length > 0 ? `${kiwixLibrary.length} SAVED` : undefined}
        badgeColor={Colors.green}
        extra={
          kiwixLibrary.length > 0 ? (
            <View style={styles.savedRow}>
              <Heart color={Colors.green} size={12} fill={Colors.green} />
              <Text style={styles.savedText}>{kiwixLibrary.length} resource{kiwixLibrary.length !== 1 ? 's' : ''} in your library</Text>
            </View>
          ) : null
        }
        onPress={() => router.push('/intel/library' as Href)}
      />

      <NavCard
        icon={<BookOpen color={Colors.orangeLight} size={24} />}
        iconBg={Colors.orangeMuted}
        title="Field Guides"
        description="Offline reference cards for emergency scenarios"
        badge={`${defaultGuides.length}`}
        badgeColor={Colors.olive}
        onPress={() => router.push('/intel/guides' as Href)}
      />

      <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>DATA & BACKUP</Text>

      <NavCard
        icon={<Upload color={Colors.greenLight} size={24} />}
        iconBg="rgba(76, 175, 80, 0.15)"
        title="Export Ops Backup"
        description="Copy your full ops kit as JSON to the clipboard"
        onPress={handleExportBackup}
      />

      <NavCard
        icon={<Download color={Colors.amberLight} size={24} />}
        iconBg="rgba(232, 192, 74, 0.15)"
        title="Import Ops Backup"
        description="Restore an ops kit from clipboard JSON"
        onPress={handleImportBackup}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 2,
    marginBottom: 14,
  },
  sectionLabelSpaced: {
    marginTop: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardBody: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  cardBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  cardDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  memberStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  memberDot: {
    alignItems: 'center',
    gap: 3,
  },
  memberStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  memberDotName: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '600' as const,
    maxWidth: 48,
  },
  memberMore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberMoreText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700' as const,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  savedText: {
    color: Colors.green,
    fontSize: 11,
    fontWeight: '600' as const,
  },
});
