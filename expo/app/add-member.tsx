import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { UserPlus, Pencil, Contact, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { GroupMember } from '@/types';
import {
  fetchContacts,
  isContactsSupported,
  type ContactEntry,
} from '@/utils/deviceServices';

const statusOptions: GroupMember['status'][] = ['ready', 'unavailable', 'unknown'];
const statusLabels: Record<string, string> = {
  ready: 'Ready',
  unavailable: 'Unavailable',
  unknown: 'Unknown',
};
const statusColors: Record<string, string> = {
  ready: Colors.statusGreen,
  unavailable: Colors.statusRed,
  unknown: Colors.statusAmber,
};

export default function AddMemberScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { members, addMember, updateMember } = useAppData();
  const existing = id ? members.find((m) => m.id === id) : undefined;
  const isEditing = Boolean(existing);

  const [name, setName] = useState(existing?.name ?? '');
  const [role, setRole] = useState(existing?.role ?? '');
  const [status, setStatus] = useState<GroupMember['status']>(existing?.status ?? 'unknown');
  const [skillsText, setSkillsText] = useState(existing?.skills.join(', ') ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [showContacts, setShowContacts] = useState(false);
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const handleOpenContacts = useCallback(async () => {
    if (!isContactsSupported()) {
      Alert.alert('Not Available', 'Contact import works on the mobile apps.');
      return;
    }
    setShowContacts(true);
    setLoadingContacts(true);
    setContactError(null);
    const list = await fetchContacts();
    setLoadingContacts(false);
    if (list.length === 0) {
      setContactError(
        'No contacts found. Check that GRIDDOWN has contacts permission in system settings.'
      );
    }
    setContacts(list);
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a name');
      return;
    }

    const member: GroupMember = {
      id: existing?.id ?? `m_${Date.now()}`,
      name: name.trim(),
      role: role.trim() || 'Member',
      status,
      skills: skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      location: existing?.location,
      locationUpdatedAt: existing?.locationUpdatedAt,
    };

    if (existing) {
      updateMember(member);
    } else {
      addMember(member);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [name, role, status, skillsText, phone, notes, addMember, updateMember, existing]);

  return (
    <>
      <Stack.Screen options={{ title: isEditing ? 'Edit Member' : 'Add Member' }} />
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            {isEditing ? (
              <Pencil color={Colors.orange} size={24} />
            ) : (
              <UserPlus color={Colors.orange} size={24} />
            )}
          </View>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Group Member' : 'Add Group Member'}</Text>
          <TouchableOpacity
            style={styles.contactsBtn}
            onPress={() => void handleOpenContacts()}
            activeOpacity={0.7}
            testID="import-contacts-btn"
          >
            <Contact color={Colors.oliveLight} size={15} />
            <Text style={styles.contactsBtnText}>Import from Contacts</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>NAME *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Member name or callsign"
          placeholderTextColor={Colors.textMuted}
          testID="member-name-input"
        />

        <Text style={styles.label}>ROLE</Text>
        <TextInput
          style={styles.input}
          value={role}
          onChangeText={setRole}
          placeholder="e.g. Medic, Scout, Leader"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>STATUS</Text>
        <View style={styles.statusRow}>
          {statusOptions.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.statusOption,
                status === opt && {
                  borderColor: statusColors[opt],
                  backgroundColor: `${statusColors[opt]}22`,
                },
              ]}
              onPress={() => setStatus(opt)}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColors[opt] }]}
              />
              <Text
                style={[
                  styles.statusText,
                  status === opt && { color: Colors.textPrimary },
                ]}
              >
                {statusLabels[opt]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>SKILLS</Text>
        <TextInput
          style={styles.input}
          value={skillsText}
          onChangeText={setSkillsText}
          placeholder="Comma-separated (e.g. First Aid, Navigation)"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>PHONE</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Optional"
          placeholderTextColor={Colors.textMuted}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>NOTES</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional notes"
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.8}
          testID="save-member-btn"
        >
          <Text style={styles.saveButtonText}>{isEditing ? 'SAVE CHANGES' : 'ADD MEMBER'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>

    <Modal
      visible={showContacts}
      animationType="slide"
      onRequestClose={() => setShowContacts(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Choose a Contact</Text>
          <TouchableOpacity
            onPress={() => setShowContacts(false)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            testID="close-contacts-btn"
          >
            <X color={Colors.textMuted} size={20} />
          </TouchableOpacity>
        </View>
        {loadingContacts ? (
          <ActivityIndicator style={styles.modalLoader} color={Colors.orange} />
        ) : contactError ? (
          <Text style={styles.modalError}>{contactError}</Text>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => {
                  setName(item.name);
                  if (item.phone) setPhone(item.phone);
                  setShowContacts(false);
                }}
              >
                <Text style={styles.contactName}>{item.name}</Text>
                {item.phone ? <Text style={styles.contactPhone}>{item.phone}</Text> : null}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.orangeMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  contactsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 2,
  },
  contactsBtnText: {
    color: Colors.oliveLight,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700' as const,
  },
  modalLoader: {
    marginTop: 40,
  },
  modalError: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contactName: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
  },
  contactPhone: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  saveButton: {
    backgroundColor: Colors.orange,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800' as const,
    letterSpacing: 1.5,
  },
});
