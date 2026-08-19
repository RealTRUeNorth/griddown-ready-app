import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Antenna, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { CommsRepeater } from '@/types';

export default function AddRepeaterScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { commsRepeaters, addCommsRepeater, updateCommsRepeater } = useAppData();
  const existing = id ? commsRepeaters.find((r) => r.id === id) : undefined;
  const isEditing = Boolean(existing);

  const [name, setName] = useState<string>(existing?.name ?? '');
  const [inputFreq, setInputFreq] = useState<string>(existing?.inputFreq ?? '');
  const [outputFreq, setOutputFreq] = useState<string>(existing?.outputFreq ?? '');
  const [offset, setOffset] = useState<string>(existing?.offset ?? '');
  const [ctcssTone, setCtcssTone] = useState<string>(existing?.ctcssTone ?? '');
  const [location, setLocation] = useState<string>(existing?.location ?? '');
  const [range, setRange] = useState<string>(existing?.range ?? '');
  const [notes, setNotes] = useState<string>(existing?.notes ?? '');

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Required', 'Repeater name is required');
      return;
    }
    if (!inputFreq.trim() || !outputFreq.trim()) {
      Alert.alert('Required', 'Input and output frequencies are required');
      return;
    }

    const repeater: CommsRepeater = {
      id: existing?.id ?? `rpt_${Date.now()}`,
      name: name.trim().toUpperCase(),
      inputFreq: inputFreq.trim(),
      outputFreq: outputFreq.trim(),
      offset: offset.trim() || 'N/A',
      ctcssTone: ctcssTone.trim() || 'None',
      location: location.trim() || undefined,
      range: range.trim() || undefined,
      notes: notes.trim() || undefined,
      coordinates: existing?.coordinates,
    };

    if (existing) {
      updateCommsRepeater(repeater);
    } else {
      addCommsRepeater(repeater);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log('Repeater added:', repeater);
    router.back();
  }, [name, inputFreq, outputFreq, offset, ctcssTone, location, range, notes, addCommsRepeater, updateCommsRepeater, existing]);

  return (
    <>
      <Stack.Screen options={{ title: isEditing ? 'Edit Repeater' : 'Add Repeater' }} />
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>REPEATER NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. HILLTOP-1, VALLEY-RPT"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
          testID="repeater-name-input"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>INPUT FREQ</Text>
          <TextInput
            style={styles.input}
            value={inputFreq}
            onChangeText={setInputFreq}
            placeholder="462.5500 MHz"
            placeholderTextColor={Colors.textMuted}
            testID="repeater-input-freq"
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>OUTPUT FREQ</Text>
          <TextInput
            style={styles.input}
            value={outputFreq}
            onChangeText={setOutputFreq}
            placeholder="467.5500 MHz"
            placeholderTextColor={Colors.textMuted}
            testID="repeater-output-freq"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>OFFSET</Text>
          <TextInput
            style={styles.input}
            value={offset}
            onChangeText={setOffset}
            placeholder="+5.0 MHz"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>CTCSS TONE</Text>
          <TextInput
            style={styles.input}
            value={ctcssTone}
            onChangeText={setCtcssTone}
            placeholder="103.5 Hz"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>LOCATION</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Ridge Point Elevation 1240ft"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>ESTIMATED RANGE</Text>
        <TextInput
          style={styles.input}
          value={range}
          onChangeText={setRange}
          placeholder="e.g. ~15 mi radius"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>NOTES</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Power source, access info, etc."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        activeOpacity={0.8}
        testID="save-repeater-btn"
      >
        <Check color={Colors.white} size={18} />
        <Text style={styles.saveText}>{isEditing ? 'SAVE CHANGES' : 'ADD REPEATER'}</Text>
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
  field: {
    marginBottom: 16,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.orange,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  saveText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
});
