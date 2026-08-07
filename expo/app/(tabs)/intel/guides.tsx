import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, Href } from 'expo-router';
import {
  Droplets,
  Heart,
  Radio,
  Home,
  Wheat,
  Shield,
  ChevronRight,
  BookOpen,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { defaultGuides } from '@/mocks/guides';

const iconMap: Record<string, (color: string, size: number) => React.ReactNode> = {
  Droplets: (c, s) => <Droplets color={c} size={s} />,
  Heart: (c, s) => <Heart color={c} size={s} />,
  Radio: (c, s) => <Radio color={c} size={s} />,
  Home: (c, s) => <Home color={c} size={s} />,
  Wheat: (c, s) => <Wheat color={c} size={s} />,
  Shield: (c, s) => <Shield color={c} size={s} />,
};

export default function GuidesScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const categories = useMemo(() => {
    const cats = [...new Set(defaultGuides.map((g) => g.category))];
    return ['All', ...cats];
  }, []);

  const filtered = useMemo(() => {
    if (selectedCategory === 'All') return defaultGuides;
    return defaultGuides.filter((g) => g.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <BookOpen color={Colors.amberLight} size={20} />
        <Text style={styles.headerText}>
          Offline reference cards for emergency scenarios
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterChip,
              selectedCategory === cat && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === cat && styles.filterChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.map((guide) => {
        const renderIcon = iconMap[guide.icon];
        return (
          <TouchableOpacity
            key={guide.id}
            style={styles.guideCard}
            onPress={() =>
              router.push({ pathname: '/guide-detail', params: { id: guide.id } } as unknown as Href)
            }
            activeOpacity={0.7}
          >
            <View style={styles.guideIcon}>
              {renderIcon ? renderIcon(Colors.orange, 22) : <BookOpen color={Colors.orange} size={22} />}
            </View>
            <View style={styles.guideInfo}>
              <View style={styles.guideTopRow}>
                <Text style={styles.guideCategory}>{guide.category.toUpperCase()}</Text>
              </View>
              <Text style={styles.guideTitle}>{guide.title}</Text>
              <Text style={styles.guideSummary} numberOfLines={2}>
                {guide.summary}
              </Text>
              <Text style={styles.guideSections}>
                {guide.sections.length} section{guide.sections.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <ChevronRight color={Colors.textMuted} size={18} />
          </TouchableOpacity>
        );
      })}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  headerText: {
    color: Colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.olive,
    borderColor: Colors.olive,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guideIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.orangeMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  guideInfo: {
    flex: 1,
  },
  guideTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  guideCategory: {
    color: Colors.olive,
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
  },
  guideTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  guideSummary: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  guideSections: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
});
