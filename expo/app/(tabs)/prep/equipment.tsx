import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, Href } from 'expo-router';
import { Plus, PackageSearch, MapPin, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { EquipmentCategory, EquipmentItem } from '@/types';

const CATEGORY_LABEL: Record<EquipmentCategory, string> = {
  firearms: 'Firearms',
  ammunition: 'Ammunition',
  optics: 'Optics',
  medical: 'Medical',
  comms: 'Comms',
  tools: 'Tools',
  protective: 'Protective',
  navigation: 'Navigation',
  other: 'Other',
};

const CONDITION_COLOR: Record<EquipmentItem['condition'], string> = {
  new: Colors.statusGreen,
  good: Colors.oliveLight,
  fair: Colors.statusAmber,
  poor: Colors.statusRed,
};

export default function EquipmentScreen() {
  const { equipment } = useAppData();

  const grouped = useMemo(() => {
    const map = new Map<EquipmentCategory, EquipmentItem[]>();
    for (const item of equipment) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [equipment]);

  const poorCount = equipment.filter((e) => e.condition === 'poor').length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>
          {equipment.length} ITEM{equipment.length !== 1 ? 'S' : ''} TRACKED
          {poorCount > 0 ? ` · ${poorCount} POOR CONDITION` : ''}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/add-equipment' as Href);
          }}
          activeOpacity={0.7}
        >
          <Plus color={Colors.white} size={14} />
          <Text style={styles.addButtonText}>ADD</Text>
        </TouchableOpacity>
      </View>

      {grouped.map(([category, items]) => (
        <View key={category}>
          <Text style={styles.categoryLabel}>{CATEGORY_LABEL[category].toUpperCase()}</Text>
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() =>
                router.push({ pathname: '/add-equipment', params: { id: item.id } } as unknown as Href)
              }
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={[styles.condBadge, { backgroundColor: CONDITION_COLOR[item.condition] + '22' }]}>
                  <Text style={[styles.condText, { color: CONDITION_COLOR[item.condition] }]}>
                    {item.condition.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardQty}>
                ×{item.quantity}
                {item.serial ? `  ·  SN ${item.serial}` : ''}
              </Text>
              {(item.assignedTo || item.location) && (
                <View style={styles.metaRow}>
                  {item.assignedTo && (
                    <View style={styles.metaItem}>
                      <User color={Colors.textMuted} size={11} />
                      <Text style={styles.metaText}>{item.assignedTo}</Text>
                    </View>
                  )}
                  {item.location && (
                    <View style={styles.metaItem}>
                      <MapPin color={Colors.textMuted} size={11} />
                      <Text style={styles.metaText}>{item.location}</Text>
                    </View>
                  )}
                </View>
              )}
              {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}
              {item.isSample ? <Text style={styles.sampleTag}>SAMPLE</Text> : null}
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {equipment.length === 0 && (
        <View style={styles.emptyState}>
          <PackageSearch color={Colors.textMuted} size={32} />
          <Text style={styles.emptyText}>No equipment tracked</Text>
          <Text style={styles.emptySubtext}>
            Track serialized gear, weapons, and accountable kit separately from consumable supplies.
          </Text>
        </View>
      )}
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
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 2,
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.orange,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  categoryLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 2,
    marginTop: 14,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  condBadge: {
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  condText: {
    fontSize: 9,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  cardQty: {
    color: Colors.orangeLight,
    fontSize: 12,
    fontWeight: '700' as const,
    fontVariant: ['tabular-nums'] as any,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  cardNotes: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic' as const,
  },
  sampleTag: {
    alignSelf: 'flex-start',
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: '800' as const,
    letterSpacing: 1,
    marginTop: 6,
    backgroundColor: Colors.bgElevated,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptySubtext: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center' as const,
    lineHeight: 17,
    paddingHorizontal: 24,
  },
});
