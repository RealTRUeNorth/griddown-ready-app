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
import { ShieldAlert, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { Threat, ThreatCategory, ThreatLevel, ThreatStatus } from '@/types';

const CATEGORIES: { id: ThreatCategory; label: string }[] = [
  { id: 'natural', label: 'Natural' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'civil', label: 'Civil' },
  { id: 'health', label: 'Health' },
  { id: 'security', label: 'Security' },
  { id: 'other', label: 'Other' },
];

const LEVELS: ThreatLevel[] = ['low', 'medium', 'high'];
const STATUSES: { id: ThreatStatus; label: string }[] = [
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'active', label: 'Active' },
  { id: 'mitigated', label: 'Mitigated' },
];

export default function AddThreatScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { threats, addThreat, updateThreat } = useAppData();
  const existing = id ? threats.find((t) => t.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [category, setCategory] = useState<ThreatCategory>(existing?.category ?? 'natural');
  const [likelihood, setLikelihood] = useState<ThreatLevel>(existing?.likelihood ?? 'medium');
  const [impact, setImpact] = useState<ThreatLevel>(existing?.impact ?? 'medium');
  const [status, setStatus] = useState<ThreatStatus>(existing?.status ?? 'monitoring');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [latInput, setLatInput] = useState(
    existing?.coordinates ? String(existing.coordinates.latitude) : ''
  );
  const [lngInput, setLngInput] = useState(
    existing?.coordinates ? String(existing.coordinates.longitude) : ''
  );

  const canSave = name.trim().length > 0;

  const handleSave = useCallback(() => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    const coordinates =
      !isNaN(lat) && !isNaN(lng) ? { latitude: lat, longitude: lng } : undefined;

    const payload: Threat = {
      id: existing?.id ?? `threat-${Date.now()}`,
      name: name.trim(),
      category,
      likelihood,
      impact,
      status,
      notes: notes.trim() || undefined,
      coordinates,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (existing) {
      updateThreat(payload);
    } else {
      addThreat(payload);
    }
    router.back();
  }, [canSave, name, category, likelihood, impact, status, notes, latInput, lngInput, existing, addThreat, updateThreat]);

  return (
    <>
      <Stack.Screen options={{ title: existing ? 'Edit Threat' : 'Add Threat' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <ShieldAlert color={Colors.redLight} size={24} />
            </View>
            <Text style={styles.title}>{existing ? 'Edit Threat' : 'New Threat'}</Text>
            <Text style={styles.subtitle}>Triage a local hazard by likelihood and impact</Text>
          </View>

          <Text style={styles.label}>NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Flash flooding on Route 9"
            placeholderTextColor={Colors.textMuted}
            testID="threat-name-input"
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

          <Text style={styles.label}>LIKELIHOOD</Text>
          <View style={styles.chipRow}>
            {LEVELS.map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[styles.chip, likelihood === lvl && styles.chipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLikelihood(lvl);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, likelihood === lvl && styles.chipTextActive]}>
                  {lvl.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>IMPACT</Text>
          <View style={styles.chipRow}>
            {LEVELS.map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[styles.chip, impact === lvl && styles.chipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setImpact(lvl);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, impact === lvl && styles.chipTextActive]}>
                  {lvl.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>STATUS</Text>
          <View style={styles.chipRow}>
            {STATUSES.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.chip, status === s.id && styles.chipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStatus(s.id);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, status === s.id && styles.chipTextActive]}>
                  {s.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>LOCATION (OPTIONAL — FOR MAP PIN)</Text>
          <View style={styles.coordRow}>
            <View style={styles.coordInput}>
              <Text style={styles.coordLabel}>Lat</Text>
              <TextInput
                style={styles.input}
                value={latInput}
                onChangeText={setLatInput}
                placeholder="38.6270"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.coordInput}>
              <Text style={styles.coordLabel}>Lng</Text>
              <TextInput
                style={styles.input}
                value={lngInput}
                onChangeText={setLngInput}
                placeholder="-90.1994"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.label}>NOTES (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Mitigations, watch conditions, who monitors it..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.8}
            testID="threat-save-button"
          >
            <Check color={Colors.white} size={18} />
            <Text style={styles.saveButtonText}>{existing ? 'Save Changes' : 'Add Threat'}</Text>
          </TouchableOpacity>
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
    backgroundColor: Colors.redMuted,
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
    minHeight: 88,
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
  coordRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordInput: {
    flex: 1,
  },
  coordLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600' as const,
    marginBottom: 4,
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
});
