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
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Package, Pencil } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { SupplyItem, SupplyCategory } from '@/types';

const categories: { key: SupplyCategory; label: string }[] = [
  { key: 'water', label: 'Water' },
  { key: 'food', label: 'Food' },
  { key: 'medical', label: 'Medical' },
  { key: 'tools', label: 'Tools' },
  { key: 'comms', label: 'Comms' },
  { key: 'shelter', label: 'Shelter' },
  { key: 'clothing', label: 'Clothing' },
  { key: 'documents', label: 'Documents' },
  { key: 'other', label: 'Other' },
];

export default function AddSupplyScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { supplies, addSupply, updateSupply } = useAppData();
  const existing = id ? supplies.find((s) => s.id === id) : undefined;
  const isEditing = Boolean(existing);

  const [name, setName] = useState(existing?.name ?? '');
  const [category, setCategory] = useState<SupplyCategory>(existing?.category ?? 'other');
  const [quantity, setQuantity] = useState(existing ? String(existing.quantity) : '');
  const [unit, setUnit] = useState(existing?.unit ?? '');
  const [minimumQuantity, setMinimumQuantity] = useState(
    existing ? String(existing.minimumQuantity) : ''
  );
  const [expirationDate, setExpirationDate] = useState(existing?.expirationDate ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter an item name');
      return;
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('Invalid', 'Please enter a valid quantity');
      return;
    }

    const item: SupplyItem = {
      id: existing?.id ?? `s_${Date.now()}`,
      name: name.trim(),
      category,
      quantity: qty,
      unit: unit.trim() || 'units',
      minimumQuantity: parseInt(minimumQuantity, 10) || 0,
      expirationDate: expirationDate.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (existing) {
      updateSupply(item);
    } else {
      addSupply(item);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [name, category, quantity, unit, minimumQuantity, expirationDate, notes, addSupply, updateSupply, existing]);

  return (
    <>
      <Stack.Screen options={{ title: isEditing ? 'Edit Supply' : 'Add Supply' }} />
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
              <Package color={Colors.orange} size={24} />
            )}
          </View>
          <Text style={styles.headerTitle}>{isEditing ? 'Edit Supply Item' : 'Add Supply Item'}</Text>
        </View>

        <Text style={styles.label}>ITEM NAME *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Bottled Water, MRE, Bandages"
          placeholderTextColor={Colors.textMuted}
          testID="supply-name-input"
        />

        <Text style={styles.label}>CATEGORY</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryChip,
                category === cat.key && styles.categoryChipActive,
              ]}
              onPress={() => setCategory(cat.key)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  category === cat.key && styles.categoryChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>QUANTITY *</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>UNIT</Text>
            <TextInput
              style={styles.input}
              value={unit}
              onChangeText={setUnit}
              placeholder="gallons, lbs, each"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        </View>

        <Text style={styles.label}>MINIMUM QUANTITY (alert threshold)</Text>
        <TextInput
          style={styles.input}
          value={minimumQuantity}
          onChangeText={setMinimumQuantity}
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
        />

        <Text style={styles.label}>EXPIRATION DATE</Text>
        <TextInput
          style={styles.input}
          value={expirationDate}
          onChangeText={setExpirationDate}
          placeholder="e.g. 2026-12"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>NOTES</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Location, brand, or other details"
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.8}
          testID="save-supply-btn"
        >
          <Text style={styles.saveButtonText}>{isEditing ? 'SAVE CHANGES' : 'ADD ITEM'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  categoryChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
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
