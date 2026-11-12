import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { Copy, Share2, MessageSquareText, Radio, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { openSms } from '@/utils/sms';
import { REPORT_DEFS, formatReportText, ReportDef } from '@/utils/radioReports';

export default function ReportBuilderScreen() {
  const { groupName, members } = useAppData();
  const [activeId, setActiveId] = useState<string>(REPORT_DEFS[0].id);
  const [valuesByReport, setValuesByReport] = useState<Record<string, Record<string, string>>>({});
  const [copied, setCopied] = useState(false);

  const def = useMemo<ReportDef>(
    () => REPORT_DEFS.find((r) => r.id === activeId) ?? REPORT_DEFS[0],
    [activeId]
  );
  const values = valuesByReport[def.id] ?? {};

  const setValue = useCallback(
    (fieldId: string, value: string) => {
      setValuesByReport((prev) => ({
        ...prev,
        [def.id]: { ...(prev[def.id] ?? {}), [fieldId]: value },
      }));
    },
    [def.id]
  );

  const formatted = useMemo(() => formatReportText(def, values, groupName), [def, values, groupName]);

  const filledCount = def.fields.filter((f) => (values[f.id] ?? '').trim().length > 0).length;

  const handleCopy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(formatted);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.log('Copy report failed:', e);
    }
  }, [formatted]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({ title: `${def.name} — ${groupName}`, message: formatted });
    } catch {
      // Dismissed — nothing to do
    }
  }, [def.name, groupName, formatted]);

  const handleSms = useCallback(async () => {
    const numbers = members
      .map((m) => m.phone)
      .filter((p): p is string => !!p && p.trim().length > 0);
    if (numbers.length === 0) {
      Alert.alert('No Phone Numbers', 'Add phone numbers to group members first (Intel → Group Roster).');
      return;
    }
    const ok = await openSms(numbers, formatted);
    if (!ok) {
      Alert.alert('Messaging Unavailable', 'Could not open the messaging app on this device.');
    }
  }, [members, formatted]);

  return (
    <>
      <Stack.Screen options={{ title: 'REPORT BUILDER' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.typeRow}>
            {REPORT_DEFS.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[styles.typeChip, activeId === r.id && styles.typeChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveId(r.id);
                }}
                activeOpacity={0.7}
              >
                <Radio
                  color={activeId === r.id ? Colors.white : Colors.orangeLight}
                  size={13}
                />
                <Text style={[styles.typeChipText, activeId === r.id && styles.typeChipTextActive]}>
                  {r.shortName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.introCard}>
            <Text style={styles.introTitle}>{def.name}</Text>
            <Text style={styles.introDesc}>{def.description}</Text>
            <Text style={styles.introWhen}>{def.whenToUse}</Text>
          </View>

          {def.fields.map((field, idx) => (
            <View key={field.id} style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                LINE {idx + 1} · {field.label}
              </Text>
              {field.choices ? (
                <View style={styles.choiceRow}>
                  {field.choices.map((choice) => {
                    const active = values[field.id] === choice;
                    return (
                      <TouchableOpacity
                        key={choice}
                        style={[styles.choiceChip, active && styles.choiceChipActive]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setValue(field.id, active ? '' : choice);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.choiceChipText,
                            active && styles.choiceChipTextActive,
                          ]}
                        >
                          {choice}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <TextInput
                  style={[styles.input, field.multiline && styles.inputMultiline]}
                  value={values[field.id] ?? ''}
                  onChangeText={(text) => setValue(field.id, text)}
                  placeholder={field.hint ?? ''}
                  placeholderTextColor={Colors.textMuted}
                  multiline={field.multiline}
                  numberOfLines={field.multiline ? 3 : 1}
                  textAlignVertical="top"
                />
              )}
            </View>
          ))}

          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewLabel}>TRANSMISSION PREVIEW</Text>
              <Text style={styles.previewCount}>
                {filledCount}/{def.fields.length} LINES
              </Text>
            </View>
            {formatted.split('\n').map((line, i) => (
              <Text key={i} style={styles.previewLine}>
                {line}
              </Text>
            ))}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCopy} activeOpacity={0.8}>
              {copied ? (
                <Check color={Colors.white} size={16} />
              ) : (
                <Copy color={Colors.white} size={16} />
              )}
              <Text style={styles.actionButtonText}>{copied ? 'COPIED' : 'COPY'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare} activeOpacity={0.8}>
              <Share2 color={Colors.white} size={16} />
              <Text style={styles.actionButtonText}>SHARE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.smsButton]}
              onPress={() => void handleSms()}
              activeOpacity={0.8}
            >
              <MessageSquareText color={Colors.white} size={16} />
              <Text style={styles.actionButtonText}>SMS</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerNote}>
            Send these over your primary channel first; SMS group is the fallback when radios are down.
          </Text>
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
    padding: 16,
    paddingBottom: 40,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bgCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
  },
  typeChipActive: {
    backgroundColor: Colors.olive,
    borderColor: Colors.olive,
  },
  typeChipText: {
    color: Colors.orangeLight,
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  typeChipTextActive: {
    color: Colors.white,
  },
  introCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 16,
  },
  introTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  introDesc: {
    color: Colors.orangeLight,
    fontSize: 12,
    fontWeight: '600' as const,
    marginTop: 4,
  },
  introWhen: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  fieldBlock: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputMultiline: {
    minHeight: 72,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  choiceChip: {
    backgroundColor: Colors.bgCard,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  choiceChipActive: {
    backgroundColor: Colors.oliveMuted,
    borderColor: Colors.oliveLight,
  },
  choiceChipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  choiceChipTextActive: {
    color: Colors.white,
  },
  previewCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 14,
    marginTop: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
  previewCount: {
    color: Colors.orangeLight,
    fontSize: 9,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  previewLine: {
    color: Colors.textPrimary,
    fontSize: 12,
    lineHeight: 19,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.olive,
    borderRadius: 10,
    paddingVertical: 13,
  },
  smsButton: {
    backgroundColor: Colors.orange,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  footerNote: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 16,
  },
});
