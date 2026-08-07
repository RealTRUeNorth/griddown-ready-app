import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { Radio, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { CommsBand, CommsMode, CommsChannel } from '@/types';
import { BAND_INFO } from '@/mocks/comms';

const BANDS: CommsBand[] = ['FRS', 'GMRS', 'MURS', 'CB', 'VHF_Marine', 'HAM_VHF', 'HAM_UHF', 'HF', 'Custom'];
const MODES: CommsMode[] = ['simplex', 'duplex', 'mesh', 'repeater'];

export default function AddChannelScreen() {
  const { addCommsChannel } = useAppData();
  const [name, setName] = useState<string>('');
  const [band, setBand] = useState<CommsBand>('FRS');
  const [frequency, setFrequency] = useState<string>('');
  const [mode, setMode] = useState<CommsMode>('simplex');
  const [purpose, setPurpose] = useState<string>('');
  const [ctcssTone, setCtcssTone] = useState<string>('');
  const [power, setPower] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isPrimary, setIsPrimary] = useState<boolean>(false);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Required', 'Channel name is required');
      return;
    }
    if (!frequency.trim()) {
      Alert.alert('Required', 'Frequency is required');
      return;
    }

    const channel: CommsChannel = {
      id: `ch_${Date.now()}`,
      name: name.trim().toUpperCase(),
      band,
      frequency: frequency.trim(),
      mode,
      purpose: purpose.trim(),
      ctcssTone: ctcssTone.trim() || undefined,
      power: power.trim() || undefined,
      notes: notes.trim() || undefined,
      isPrimary,
    };

    addCommsChannel(channel);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log('Channel added:', channel);
    router.back();
  }, [name, band, frequency, mode, purpose, ctcssTone, power, notes, isPrimary, addCommsChannel]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>CHANNEL NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. PRIMARY, TACTICAL-1"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
          testID="channel-name-input"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>BAND</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <View style={styles.chipRow}>
            {BANDS.map((b) => {
              const info = BAND_INFO[b];
              const isSelected = band === b;
              return (
                <TouchableOpacity
                  key={b}
                  style={[
                    styles.chip,
                    isSelected && { backgroundColor: (info?.color ?? Colors.orange) + '33', borderColor: info?.color ?? Colors.orange },
                  ]}
                  onPress={() => setBand(b)}
                >
                  <Text style={[styles.chipText, isSelected && { color: info?.color ?? Colors.orange }]}>
                    {b.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>FREQUENCY</Text>
        <TextInput
          style={styles.input}
          value={frequency}
          onChangeText={setFrequency}
          placeholder="e.g. 462.5625 MHz"
          placeholderTextColor={Colors.textMuted}
          keyboardType="default"
          testID="channel-freq-input"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>MODE</Text>
        <View style={styles.chipRow}>
          {MODES.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.chip, mode === m && styles.chipActive]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.chipText, mode === m && styles.chipTextActive]}>
                {m.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>PURPOSE</Text>
        <TextInput
          style={styles.input}
          value={purpose}
          onChangeText={setPurpose}
          placeholder="e.g. Main group communications"
          placeholderTextColor={Colors.textMuted}
          testID="channel-purpose-input"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>CTCSS TONE</Text>
          <TextInput
            style={styles.input}
            value={ctcssTone}
            onChangeText={setCtcssTone}
            placeholder="e.g. 141.3 Hz"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>POWER</Text>
          <TextInput
            style={styles.input}
            value={power}
            onChangeText={setPower}
            placeholder="e.g. 2W"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>NOTES</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional notes..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.switchLabel}>Primary Channel</Text>
          <Text style={styles.switchSub}>Mark as your group's primary frequency</Text>
        </View>
        <Switch
          value={isPrimary}
          onValueChange={setIsPrimary}
          trackColor={{ false: Colors.bgElevated, true: Colors.statusGreen + '66' }}
          thumbColor={isPrimary ? Colors.statusGreen : Colors.textMuted}
        />
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        activeOpacity={0.8}
        testID="save-channel-btn"
      >
        <Check color={Colors.white} size={18} />
        <Text style={styles.saveText}>ADD CHANNEL</Text>
      </TouchableOpacity>
    </ScrollView>
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
  chipScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.orangeMuted,
    borderColor: Colors.orange,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600' as const,
  },
  chipTextActive: {
    color: Colors.orange,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  switchLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  switchSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.orange,
    borderRadius: 12,
    padding: 16,
  },
  saveText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
});
