import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { PackageSearch, Check, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { EquipmentCategory, EquipmentCondition } from '@/types';

const CATEGORIES: { id: EquipmentCategory; label: string }[] = [
  { id: 'firearms', label: 'Firearms' },
  { id: 'ammunition', label: 'Ammunition' },
  { id: 'optics', label: 'Optics' },
  { id: 'medical', label: 'Medical' },
  { id: 'comms', label: 'Comms' },
  { id: 'tools', label: 'Tools' },
  { id: 'protective', label: 'Protective' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'other', label: 'Other' },
];

const CONDITIONS: { id: EquipmentCondition; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'good', label: 'Good' },
  { id: 'fair', label: 'Fair' },
  { id: 'poor', label: 'Poor' },
];

export default function AddEquipmentScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { equipment, addEquipment, updateEquipment, removeEquipment } = useAppData();
  const existing = id ? equipment.find((e) => e.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [category, setCategory] = useState<EquipmentCategory>(existing?.category ?? 'tools');
  const [quantity, setQuantity] = useState(existing ? String(existing.quantity) : '1');
  const [serial, setSerial] = useState(existing?.serial ?? '');
  const [condition, setCondition] = useState<EquipmentCondition>(existing?.condition ?? 'good');
  const [assignedTo, setAssignedTo] = useState(existing?.assignedTo ?? '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const canSave = name.trim().length > 0;

  const handleDelete = useCallback(() => {
    if (!existing) return;
    removeEquipment(existing.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [existing, removeEquipment]);

  const handleSave = useCallback(() => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const qty = parseInt(quantity, 10);
    const payload = {
      id: existing?.id ?? `equip-${Date.now()}`,
      name: name.trim(),
      category,
      quantity: isNaN(qty) || qty < 1 ? 1 : qty,
      serial: serial.trim() || undefined,
      condition,
      assignedTo: assignedTo.trim() || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      isSample: existing?.isSample,
    };
    if (existing) {
      updateEquipment(payload);
    } else {
      addEquipment(payload);
    }
    router.back();
  }, [canSave, name, category, quantity, serial, condition, assignedTo, location, notes, existing, addEquipment, updateEquipment]);

  return (
    <>
      <Stack.Screen options={{ title: existing ? 'Edit Equipment' : 'Add Equipment' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <PackageSearch color={Colors.orangeLight} size={24} />
            </View>
            <Text style={styles.title}>{existing ? 'Edit Equipment' : 'New Equipment'}</Text>
            <Text style={styles.subtitle}>Serialized gear, weapons, and accountable kit</Text>
          </View>

          <Text style={styles.label}>NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Berkey Water Filter"
            placeholderTextColor={Colors.textMuted}
            testID="equipment-name-input"
          />

          <Text style={styles.label}>CATEGORY</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, category === c.id && styles.chipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCategory(c.id);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, category === c.id && styles.chipTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.label}>QUANTITY</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                testID="equipment-qty-input"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>SERIAL (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                value={serial}
                onChangeText={setSerial}
                placeholder="Serial #"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <Text style={styles.label}>CONDITION</Text>
          <View style={styles.chipRow}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, condition === c.id && styles.chipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCondition(c.id);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, condition === c.id && styles.chipTextActive]}>
                  {c.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.label}>ASSIGNED TO</Text>
              <TextInput
                style={styles.input}
                value={assignedTo}
                onChangeText={setAssignedTo}
                placeholder="Member name"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>STORED AT</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Safe, garage"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <Text style={styles.label}>NOTES (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Maintenance schedule, zeroing, accessories..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.8}
            testID="equipment-save-button"
          >
            <Check color={Colors.white} size={18} />
            <Text style={styles.saveButtonText}>{existing ? 'Save Changes' : 'Add Equipment'}</Text>
          </TouchableOpacity>

          {existing && !existing.isSample && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
              <X color={Colors.statusRed} size={16} />
              <Text style={styles.deleteButtonText}>Remove Equipment</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
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
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.orangeMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800' as const,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 16,
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
  notesInput: {
    minHeight: 80,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.bgCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: Colors.olive,
    borderColor: Colors.olive,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  chipTextActive: {
    color: Colors.white,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.olive,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 28,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.statusRed,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
  },
  deleteButtonText: {
    color: Colors.statusRed,
    fontSize: 14,
    fontWeight: '700' as const,
  },
});
