import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { router, Href } from 'expo-router';
import { Plus, User, Users, ChevronRight, Search, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { GroupMember } from '@/types';
import SwipeableRow from '@/components/SwipeableRow';

const statusColors: Record<string, string> = {
  ready: Colors.statusGreen,
  unavailable: Colors.statusRed,
  unknown: Colors.statusAmber,
};

export default function GroupScreen() {
  const { members, groupName, removeMember } = useAppData();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const confirmDelete = useCallback((member: GroupMember) => {
    Alert.alert('Remove Member', `Remove ${member.name} from the group?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeMember(member.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }, [removeMember]);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [members, searchQuery]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupName}>{groupName}</Text>
          <Text style={styles.memberCount}>
            {members.length} member{members.length !== 1 ? 's' : ''} ·{' '}
            {members.filter((m) => m.status === 'ready').length} ready
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Search color={Colors.textMuted} size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members by name..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color={Colors.textMuted} size={18} />
            </TouchableOpacity>
          )}
        </View>

        {filteredMembers.map((member) => (
          <SwipeableRow key={member.id} onDelete={() => confirmDelete(member)}>
          <TouchableOpacity
            style={styles.memberCard}
            onPress={() =>
              router.push({ pathname: '/member-detail', params: { id: member.id } } as unknown as Href)
            }
            activeOpacity={0.7}
          >
            <View style={styles.memberAvatar}>
              <User color={Colors.textPrimary} size={20} />
            </View>
            <View style={styles.memberInfo}>
              <View style={styles.memberNameRow}>
                <Text style={styles.memberName}>{member.name}</Text>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: statusColors[member.status] ?? Colors.textMuted },
                  ]}
                />
              </View>
              <Text style={styles.memberRole}>{member.role}</Text>
              {member.skills.length > 0 && (
                <View style={styles.skillsRow}>
                  {member.skills.slice(0, 3).map((skill) => (
                    <View key={skill} style={styles.skillTag}>
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <ChevronRight color={Colors.textMuted} size={18} />
          </TouchableOpacity>
          </SwipeableRow>
        ))}

        {filteredMembers.length === 0 && members.length > 0 && (
          <View style={styles.emptyState}>
            <Search color={Colors.textMuted} size={48} />
            <Text style={styles.emptyTitle}>No members found</Text>
            <Text style={styles.emptySubtitle}>
              Try a different search term
            </Text>
          </View>
        )}

        {members.length === 0 && (
          <View style={styles.emptyState}>
            <Users color={Colors.textMuted} size={48} />
            <Text style={styles.emptyTitle}>No members yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your group members to track readiness
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-member' as Href)}
        activeOpacity={0.8}
        testID="add-member-btn"
      >
        <Plus color={Colors.white} size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  groupHeader: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
  },
  groupName: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800' as const,
  },
  memberCount: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.oliveMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  memberRole: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  skillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  skillTag: {
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  skillText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
