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
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Route as RouteIcon, Plus, Check, Trash2, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { ROUTE_COLORS } from '@/constants/mapHelpers';
import { Coordinates } from '@/types';

export default function AddRouteScreen() {
  const { addRoute } = useAppData();

  const [name, setName] = useState<string>('');
  const [color, setColor] = useState<string>(ROUTE_COLORS[0]);
  const [notes, setNotes] = useState<string>('');
  const [waypoints, setWaypoints] = useState<Coordinates[]>([]);
  const [latInput, setLatInput] = useState<string>('');
  const [lngInput, setLngInput] = useState<string>('');

  const canSave = name.trim().length > 0 && waypoints.length >= 2;

  const addWaypoint = useCallback(() => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Invalid Coordinates', 'Please enter valid latitude and longitude values.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWaypoints((prev) => [...prev, { latitude: lat, longitude: lng }]);
    setLatInput('');
    setLngInput('');
  }, [latInput, lngInput]);

  const removeWaypoint = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWaypoints((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(() => {
    if (!canSave) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addRoute({
      id: `route-${Date.now()}`,
      name: name.trim(),
      color,
      waypoints,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    });

    router.back();
  }, [canSave, name, color, waypoints, notes, addRoute]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <RouteIcon color={Colors.oliveLight} size={24} />
          </View>
          <Text style={styles.title}>New Route</Text>
          <Text style={styles.subtitle}>Define a path with waypoints</Text>
        </View>

        <Text style={styles.label}>NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Bug-Out Route Alpha..."
          placeholderTextColor={Colors.textMuted}
          testID="route-name-input"
        />

        <Text style={styles.label}>ROUTE COLOR</Text>
        <View style={styles.colorRow}>
          {ROUTE_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorSwatch,
                { backgroundColor: c },
                color === c && styles.colorSwatchActive,
              ]}
              onPress={() => {
                setColor(c);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              {color === c && <Check color={Colors.white} size={14} />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>
          WAYPOINTS ({waypoints.length}{waypoints.length < 2 ? ' — need at least 2' : ''})
        </Text>

        {waypoints.map((wp, index) => (
          <View key={index} style={styles.waypointRow}>
            <View style={[styles.waypointDot, { backgroundColor: color }]}>
              <Text style={styles.waypointDotText}>{index + 1}</Text>
            </View>
            <Text style={styles.waypointCoords}>
              {wp.latitude.toFixed(5)}, {wp.longitude.toFixed(5)}
            </Text>
            <TouchableOpacity onPress={() => removeWaypoint(index)} style={styles.waypointRemove}>
              <X color={Colors.statusRed} size={14} />
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.addWaypointCard}>
          <View style={styles.coordRow}>
            <View style={styles.coordInput}>
              <Text style={styles.coordLabel}>Lat</Text>
              <TextInput
                style={styles.input}
                value={latInput}
                onChangeText={setLatInput}
                placeholder="39.8283"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                testID="route-lat-input"
              />
            </View>
            <View style={styles.coordInput}>
              <Text style={styles.coordLabel}>Lng</Text>
              <TextInput
                style={styles.input}
                value={lngInput}
                onChangeText={setLngInput}
                placeholder="-98.5795"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                testID="route-lng-input"
              />
            </View>
          </View>
          <TouchableOpacity
            style={styles.addWaypointButton}
            onPress={addWaypoint}
            activeOpacity={0.7}
          >
            <Plus color={Colors.white} size={16} />
            <Text style={styles.addWaypointText}>Add Waypoint</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>NOTES (OPTIONAL)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Route details, hazards, landmarks..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          testID="route-notes-input"
        />

        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.8}
          testID="route-save-button"
        >
          <Check color={Colors.white} size={18} />
          <Text style={styles.saveButtonText}>Create Route</Text>
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
    backgroundColor: Colors.oliveMuted,
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
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: Colors.white,
  },
  waypointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bgCard,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  waypointDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waypointDotText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  waypointCoords: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 12,
    fontVariant: ['tabular-nums'] as any,
  },
  waypointRemove: {
    padding: 4,
  },
  addWaypointCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
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
  addWaypointButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bgElevated,
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  addWaypointText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600' as const,
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
