import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { Users, Clock, Database, Check, Bell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { CHECK_IN_INTERVAL_OPTIONS } from '@/utils/checkin';
import { backupCounts } from '@/utils/opsBackup';
import { ensureNotificationPermission, isNotificationsSupported } from '@/utils/notifications';

export default function SettingsScreen() {
  const {
    groupName,
    updateGroupName,
    checkInIntervalHours,
    updateCheckInInterval,
    remindersEnabled,
    updateRemindersEnabled,
    currentSnapshot,
  } = useAppData();

  const [nameDraft, setNameDraft] = useState<string>(groupName);

  const handleToggleReminders = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'web' || !isNotificationsSupported()) {
      Alert.alert('Not Available', 'Reminders work on the mobile apps.');
      return;
    }
    if (!remindersEnabled) {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permission Needed',
          'Enable notifications for GRIDDOWN in system settings to use reminders.'
        );
        return;
      }
    }
    updateRemindersEnabled(!remindersEnabled);
  }, [remindersEnabled, updateRemindersEnabled]);

  const handleSaveName = useCallback(() => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === groupName) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateGroupName(trimmed);
  }, [nameDraft, groupName, updateGroupName]);

  const counts = backupCounts(currentSnapshot());

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>GROUP</Text>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Users color={Colors.oliveLight} size={16} />
            <Text style={styles.cardTitle}>Group Name</Text>
          </View>
          <TextInput
            style={styles.nameInput}
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="My Group"
            placeholderTextColor={Colors.textMuted}
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={handleSaveName}
            testID="group-name-input"
          />
          <TouchableOpacity
            style={[
              styles.saveBtn,
              nameDraft.trim() && nameDraft.trim() !== groupName
                ? styles.saveBtnActive
                : styles.saveBtnDisabled,
            ]}
            onPress={handleSaveName}
            disabled={!nameDraft.trim() || nameDraft.trim() === groupName}
            activeOpacity={0.7}
            testID="save-group-name"
          >
            <Check color={Colors.white} size={16} />
            <Text style={styles.saveBtnText}>Save Name</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>
            Shown at the top of the Group Roster and included in ops backups.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>CHECK-IN CADENCE</Text>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Clock color={Colors.orangeLight} size={16} />
            <Text style={styles.cardTitle}>Expected Check-In Interval</Text>
          </View>
          <Text style={styles.hint}>
            Members are marked overdue if they haven't checked in within this window.
          </Text>
          <View style={styles.chipGrid}>
            {CHECK_IN_INTERVAL_OPTIONS.map((hours) => {
              const isActive = checkInIntervalHours === hours;
              return (
                <TouchableOpacity
                  key={hours}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateCheckInInterval(hours);
                  }}
                  activeOpacity={0.7}
                  testID={`interval-${hours}`}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {hours}h
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionLabel}>REMINDERS</Text>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Bell color={Colors.orangeLight} size={16} />
            <Text style={styles.cardTitle}>Check-In & Expiry Alerts</Text>
          </View>
          <Text style={styles.hint}>
            A repeating check-in reminder follows your cadence above. Supply alerts fire 30 days
            before expiration dates. All notifications are local — nothing leaves this device.
          </Text>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => void handleToggleReminders()}
            activeOpacity={0.7}
            testID="reminders-toggle"
          >
            <Text style={[styles.toggleLabel, !remindersEnabled && styles.toggleLabelOff]}>
              {remindersEnabled ? 'Reminders On' : 'Reminders Off'}
            </Text>
            <View style={[styles.toggleDot, remindersEnabled && styles.toggleDotActive]} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Database color={Colors.textSecondary} size={16} />
            <Text style={styles.cardTitle}>Local Data</Text>
          </View>
          <Text style={styles.aboutLine}>
            {counts.members} members · {counts.supplies} supplies · {counts.checklists} checklists ·{' '}
            {counts.pois} POIs · {counts.routes} routes · {counts.channels} channels ·{' '}
            {counts.repeaters} repeaters
          </Text>
          <Text style={styles.hint}>
            GRIDDOWN stores everything on this device. Export an ops backup from the Intel tab to
            share or safeguard your data.
          </Text>
        </View>
      </ScrollView>
    </>
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
    marginTop: 8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  nameInput: {
    backgroundColor: Colors.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600' as const,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 11,
  },
  saveBtnActive: {
    backgroundColor: Colors.olive,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.bgElevated,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  hint: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  chipTextActive: {
    color: Colors.white,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  toggleLabel: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  toggleLabelOff: {
    color: Colors.textMuted,
  },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleDotActive: {
    backgroundColor: Colors.statusGreen,
    borderColor: Colors.statusGreen,
  },
  aboutLine: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
