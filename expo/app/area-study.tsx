import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Share2, ClipboardCheck, Map as MapIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import {
  AREA_STUDY_TEMPLATE,
  areaStudyProgress,
  exportAreaStudyText,
} from '@/mocks/areaStudy';

export default function AreaStudyScreen() {
  const { groupName, areaStudy, updateAreaStudySection, threats } = useAppData();
  const progress = useMemo(() => areaStudyProgress(areaStudy), [areaStudy]);
  const savedText = useMemo(
    () => new Map(areaStudy.sections.map((s) => [s.id, s.content])),
    [areaStudy]
  );
  const [focusId, setFocusId] = useState<string | null>(null);

  const sectionText = useCallback(
    (id: string) => savedText.get(id) ?? '',
    [savedText]
  );

  const handleExport = useCallback(async () => {
    const text = exportAreaStudyText(areaStudy, groupName);
    try {
      const result = await Share.share({ title: `Area Study — ${groupName}`, message: text });
      if (result.action !== Share.dismissedAction) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      try {
        await Clipboard.setStringAsync(text);
        Alert.alert('Copied', 'Area study copied to the clipboard.');
      } catch (e) {
        console.log('Area study export failed:', e);
      }
    }
  }, [areaStudy, groupName]);

  return (
    <>
      <Stack.Screen options={{ title: 'AREA STUDY' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>WORKBOOK COMPLETENESS</Text>
            <Text style={styles.progressValue}>{progress.percent}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress.percent}%`,
                  backgroundColor:
                    progress.percent === 100
                      ? Colors.statusGreen
                      : progress.percent > 50
                      ? Colors.statusAmber
                      : Colors.orange,
                },
              ]}
            />
          </View>
          <Text style={styles.progressSub}>
            {progress.filled} of {progress.total} sections written · autosaves as you type
          </Text>
        </View>

        <Text style={styles.introText}>
          A complete area study is the foundation of every preparedness plan. Work through each
          layer of your operational environment — a little at a time is fine.
        </Text>

        {AREA_STUDY_TEMPLATE.map((section, idx) => {
          const content = sectionText(section.id);
          const isFilled = content.trim().length > 0;
          const isFocused = focusId === section.id;
          return (
            <View key={section.id} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {isFilled ? (
                  <ClipboardCheck color={Colors.statusGreen} size={15} />
                ) : null}
              </View>
              <Text style={styles.sectionPrompt}>{section.prompt}</Text>
              <TextInput
                style={[styles.sectionInput, isFocused && styles.sectionInputFocused]}
                value={content}
                onFocus={() => setFocusId(section.id)}
                onBlur={() => setFocusId(null)}
                onChangeText={(text) => updateAreaStudySection(section.id, text)}
                placeholder={
                  idx === 3 && threats.length > 0
                    ? `Tip: you're tracking ${threats.length} threat${threats.length !== 1 ? 's' : ''} in the Threat Register`
                    : 'Write what you know, verify what you don\u2019t...'
                }
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          );
        })}

        <TouchableOpacity style={styles.exportButton} onPress={() => void handleExport()} activeOpacity={0.8}>
          <Share2 color={Colors.white} size={16} />
          <Text style={styles.exportButtonText}>EXPORT STUDY (SHARE / PRINT)</Text>
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <MapIcon color={Colors.textMuted} size={12} />
          <Text style={styles.footerText}>
            Pair this study with POIs and routes pinned on the Map tab.
          </Text>
        </View>
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
  progressCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressTitle: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
  progressValue: {
    color: Colors.orangeLight,
    fontSize: 18,
    fontWeight: '800' as const,
    fontVariant: ['tabular-nums'] as any,
  },
  progressBg: {
    height: 6,
    backgroundColor: Colors.bgElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 8,
  },
  introText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  sectionNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.oliveMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    color: Colors.oliveLight,
    fontSize: 10,
    fontWeight: '800' as const,
  },
  sectionTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  sectionPrompt: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  sectionInput: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    color: Colors.textPrimary,
    fontSize: 13,
    minHeight: 96,
    lineHeight: 19,
  },
  sectionInputFocused: {
    borderColor: Colors.olive,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.olive,
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 8,
  },
  exportButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
});
