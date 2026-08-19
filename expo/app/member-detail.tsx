import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { User, Phone, FileText, Trash2, Shield, Pencil, Clock, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import {
  getCheckInState,
  checkInStatusLabel,
  checkInStatusColor,
  formatTimeSince,
} from '@/utils/checkin';

const statusColors: Record<string, string> = {
  ready: Colors.statusGreen,
  unavailable: Colors.statusRed,
  unknown: Colors.statusAmber,
};

const statusLabels: Record<string, string> = {
  ready: 'Ready',
  unavailable: 'Unavailable',
  unknown: 'Unknown',
};

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { members, removeMember, updateMember, checkInMember, checkInIntervalHours } = useAppData();
  const member = members.find((m) => m.id === id);

  const handleDelete = useCallback(() => {
    if (!id) return;
    Alert.alert('Remove Member', `Remove ${member?.name} from the group?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeMember(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.back();
        },
      },
    ]);
  }, [id, member, removeMember]);

  const handleCheckIn = useCallback(() => {
    if (!id) return;
    checkInMember(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [id, checkInMember]);

  const cycleStatus = useCallback(() => {
    if (!member) return;
    const order: Array<'ready' | 'unavailable' | 'unknown'> = ['ready', 'unavailable', 'unknown'];
    const currentIdx = order.indexOf(member.status);
    const next = order[(currentIdx + 1) % order.length];
    updateMember({ ...member, status: next });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [member, updateMember]);

  if (!member) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Member not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: member.name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <User color={Colors.textPrimary} size={36} />
          </View>
          <Text style={styles.name}>{member.name}</Text>
          <Text style={styles.role}>{member.role}</Text>

          <TouchableOpacity style={styles.statusBadge} onPress={cycleStatus}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColors[member.status] },
              ]}
            />
            <Text style={styles.statusText}>
              {statusLabels[member.status]}
            </Text>
            <Text style={styles.statusHint}>(tap to change)</Text>
          </TouchableOpacity>
        </View>

        {member.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SKILLS</Text>
            <View style={styles.skillsRow}>
              {member.skills.map((skill) => (
                <View key={skill} style={styles.skillTag}>
                  <Shield color={Colors.oliveLight} size={12} />
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CHECK-IN</Text>
          <View style={styles.checkInCard}>
            <View style={styles.checkInRow}>
              <Clock color={Colors.textSecondary} size={16} />
              <View style={{ flex: 1 }}>
                <Text style={styles.checkInTime}>
                  {member.lastCheckInAt
                    ? `Last check-in ${formatTimeSince(member.lastCheckInAt)}`
                    : 'No check-in recorded'}
                </Text>
                <Text style={styles.checkInInterval}>
                  Expected every {checkInIntervalHours}h
                </Text>
              </View>
              <View
                style={[
                  styles.checkInBadge,
                  {
                    backgroundColor:
                      checkInStatusColor(getCheckInState(member, checkInIntervalHours)) + '22',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.checkInBadgeText,
                    { color: checkInStatusColor(getCheckInState(member, checkInIntervalHours)) },
                  ]}
                >
                  {checkInStatusLabel(getCheckInState(member, checkInIntervalHours))}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.checkInButton}
              onPress={handleCheckIn}
              activeOpacity={0.7}
              testID="check-in-btn"
            >
              <CheckCircle2 color={Colors.white} size={18} />
              <Text style={styles.checkInButtonText}>Check In Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {member.phone && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CONTACT</Text>
            <View style={styles.infoCard}>
              <Phone color={Colors.textSecondary} size={16} />
              <Text style={styles.infoText}>{member.phone}</Text>
            </View>
          </View>
        )}

        {member.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTES</Text>
            <View style={styles.infoCard}>
              <FileText color={Colors.textSecondary} size={16} />
              <Text style={styles.infoText}>{member.notes}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: '/add-member', params: { id: member.id } } as never);
          }}
          activeOpacity={0.7}
        >
          <Pencil color={Colors.orange} size={18} />
          <Text style={styles.editText}>Edit Member</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Trash2 color={Colors.statusRed} size={18} />
          <Text style={styles.deleteText}>Remove from Group</Text>
        </TouchableOpacity>
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
  errorText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.oliveMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800' as const,
  },
  role: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  statusHint: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skillText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  checkInCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkInRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    marginBottom: 12,
  },
  checkInTime: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  checkInInterval: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  checkInBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  checkInBadgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    letterSpacing: 0.8,
  },
  checkInButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.olive,
    borderRadius: 8,
    paddingVertical: 12,
  },
  checkInButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: {
    color: Colors.textPrimary,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  editText: {
    color: Colors.orange,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.redMuted,
    backgroundColor: Colors.redMuted,
  },
  deleteText: {
    color: Colors.statusRed,
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
