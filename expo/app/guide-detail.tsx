import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { ChevronDown, ChevronUp, BookOpen, ShieldAlert } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { defaultGuides } from '@/mocks/guides';

/**
 * Public-source attribution per guide category, shown alongside the
 * educational-only disclaimer on every guide.
 */
const GUIDE_SOURCES: Record<string, string> = {
  Medical:
    'Based on widely published American Red Cross / American Heart Association first-aid & CPR and WHO/CDC oral-rehydration guidance.',
  Survival:
    'Based on widely published FEMA/Ready.gov and CDC emergency-preparedness and water-treatment guidance.',
  Supplies: 'Based on widely published FEMA/Ready.gov emergency-preparedness guidance.',
  Comms: 'Based on widely published ARRL and FEMA emergency-communications guidance.',
};

export default function GuideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const guide = defaultGuides.find((g) => g.id === id);

  if (!guide) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Guide not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: guide.title }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{guide.category.toUpperCase()}</Text>
          </View>
          <Text style={styles.title}>{guide.title}</Text>
          <Text style={styles.summary}>{guide.summary}</Text>
        </View>

        {guide.sections.map((section, index) => (
          <SectionCard
            key={index}
            title={section.title}
            content={section.content}
            index={index}
          />
        ))}

        <View style={styles.disclaimer}>
          <ShieldAlert color={Colors.statusAmber} size={14} />
          <Text style={styles.disclaimerText}>
            {(GUIDE_SOURCES[guide.category] ??
              'Based on widely published FEMA/Ready.gov emergency-preparedness guidance.') +
              ' Educational reference only — always defer to trained medical professionals and local authorities in a real emergency.'}
          </Text>
        </View>

        <View style={styles.footer}>
          <BookOpen color={Colors.textMuted} size={14} />
          <Text style={styles.footerText}>
            {guide.sections.length} sections · Available offline
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

function SectionCard({
  title,
  content,
  index,
}: {
  title: string;
  content: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionNumber}>
          <Text style={styles.sectionNumberText}>{index + 1}</Text>
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {expanded ? (
          <ChevronUp color={Colors.textMuted} size={18} />
        ) : (
          <ChevronDown color={Colors.textMuted} size={18} />
        )}
      </TouchableOpacity>
      {expanded && (
        <View style={styles.sectionContent}>
          <Text style={styles.sectionText}>{content}</Text>
        </View>
      )}
    </View>
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
  errorText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
  header: {
    marginBottom: 20,
  },
  categoryBadge: {
    backgroundColor: Colors.oliveMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  categoryText: {
    color: Colors.oliveLight,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800' as const,
    marginBottom: 8,
  },
  summary: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.orangeMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    color: Colors.orange,
    fontSize: 13,
    fontWeight: '800' as const,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700' as const,
    flex: 1,
  },
  sectionContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 0,
  },
  sectionText: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  disclaimer: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 6,
  },
  disclaimerText: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
