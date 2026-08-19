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
import { router, useLocalSearchParams } from 'expo-router';
import { MapPin, Check, Pencil } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { POI_CATEGORY_CONFIG } from '@/constants/mapHelpers';
import { POICategory } from '@/types';

const categories: POICategory[] = ['rally_point', 'water', 'shelter', 'medical', 'supply_cache', 'comms', 'gas_station', 'hospital', 'pharmacy', 'police', 'fire_station', 'weather_resource', 'hazard', 'other'];

export default function AddPoiScreen() {
  const { lat, lng, id } = useLocalSearchParams<{ lat?: string; lng?: string; id?: string }>();
  const { pois, addPoi, updatePoi } = useAppData();
  const existing = id ? pois.find((p) => p.id === id) : undefined;
  const isEditing = Boolean(existing);

  const [name, setName] = useState<string>(existing?.name ?? '');
  const [category, setCategory] = useState<POICategory>(existing?.category ?? 'rally_point');
  const [latitude, setLatitude] = useState<string>(
    existing ? String(existing.coordinates.latitude) : (lat ?? '')
  );
  const [longitude, setLongitude] = useState<string>(
    existing ? String(existing.coordinates.longitude) : (lng ?? '')
  );
  const [notes, setNotes] = useState<string>(existing?.notes ?? '');

  const canSave = name.trim().length > 0 && latitude.trim().length > 0 && longitude.trim().length > 0;

  const handleSave = useCallback(() => {
    if (!canSave) return;

    const parsedLat = parseFloat(latitude);
    const parsedLng = parseFloat(longitude);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      console.log('Invalid coordinates:', latitude, longitude);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const payload = {
      id: existing?.id ?? `poi-${Date.now()}`,
      name: name.trim(),
      category,
      coordinates: { latitude: parsedLat, longitude: parsedLng },
      notes: notes.trim() || undefined,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    if (existing) {
      updatePoi(payload);
    } else {
      addPoi(payload);
    }

    router.back();
  }, [canSave, name, category, latitude, longitude, notes, addPoi, updatePoi, existing]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            {isEditing ? <Pencil color={Colors.orange} size={24} /> : <MapPin color={Colors.orange} size={24} />}
          </View>
          <Text style={styles.title}>{isEditing ? 'Edit Point of Interest' : 'New Point of Interest'}</Text>
          <Text style={styles.subtitle}>
            {isEditing ? 'Update this map marker' : 'Mark a location on the tactical map'}
          </Text>
        </View>

        <Text style={styles.label}>NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Water Tower, Safe House..."
          placeholderTextColor={Colors.textMuted}
          testID="poi-name-input"
        />

        <Text style={styles.label}>CATEGORY</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => {
            const config = POI_CATEGORY_CONFIG[cat];
            const isActive = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  isActive && { backgroundColor: config.color, borderColor: config.color },
                ]}
                onPress={() => {
                  setCategory(cat);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isActive && { color: Colors.white },
                  ]}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>COORDINATES</Text>
        <View style={styles.coordRow}>
          <View style={styles.coordInput}>
            <Text style={styles.coordLabel}>Lat</Text>
            <TextInput
              style={styles.input}
              value={latitude}
              onChangeText={setLatitude}
              placeholder="39.8283"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              testID="poi-lat-input"
            />
          </View>
          <View style={styles.coordInput}>
            <Text style={styles.coordLabel}>Lng</Text>
            <TextInput
              style={styles.input}
              value={longitude}
              onChangeText={setLongitude}
              placeholder="-98.5795"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              testID="poi-lng-input"
            />
          </View>
        </View>

        <Text style={styles.label}>NOTES (OPTIONAL)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional details..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          testID="poi-notes-input"
        />

        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.8}
          testID="poi-save-button"
        >
          <Check color={Colors.white} size={18} />
          <Text style={styles.saveButtonText}>{isEditing ? 'Save Changes' : 'Add Point of Interest'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 28,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
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
    backgroundColor: Colors.orange,
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
