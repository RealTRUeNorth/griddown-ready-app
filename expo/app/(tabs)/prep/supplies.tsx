import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { router, Href } from 'expo-router';
import {
  Plus,
  Package,
  Droplets,
  Utensils,
  Heart,
  Wrench,
  Radio,
  Home,
  Shirt,
  FileText,
  Box,
  AlertTriangle,
  Search,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { SupplyCategory, SupplyItem } from '@/types';
import SwipeableRow from '@/components/SwipeableRow';
import { getExpirationStatus } from '@/utils/supplyAlerts';

const categoryIcons: Record<SupplyCategory, React.ReactNode> = {
  water: <Droplets color={Colors.oliveLight} size={16} />,
  food: <Utensils color={Colors.oliveLight} size={16} />,
  medical: <Heart color={Colors.redLight} size={16} />,
  tools: <Wrench color={Colors.orangeLight} size={16} />,
  comms: <Radio color={Colors.amberLight} size={16} />,
  shelter: <Home color={Colors.oliveLight} size={16} />,
  clothing: <Shirt color={Colors.oliveLight} size={16} />,
  documents: <FileText color={Colors.oliveLight} size={16} />,
  other: <Box color={Colors.textSecondary} size={16} />,
};

const categoryLabels: Record<SupplyCategory, string> = {
  water: 'Water',
  food: 'Food',
  medical: 'Medical',
  tools: 'Tools',
  comms: 'Comms',
  shelter: 'Shelter',
  clothing: 'Clothing',
  documents: 'Documents',
  other: 'Other',
};

const allCategories: SupplyCategory[] = [
  'water', 'food', 'medical', 'tools', 'comms', 'shelter', 'clothing', 'documents', 'other',
];

export default function SuppliesScreen() {
  const { supplies, removeSupply, supplyStats } = useAppData();

  const confirmDelete = useCallback((item: SupplyItem) => {
    Alert.alert('Remove Supply', `Remove "${item.name}" from inventory?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeSupply(item.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }, [removeSupply]);
  const [filterCategory, setFilterCategory] = useState<SupplyCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = useMemo(() => {
    let result = supplies;
    if (filterCategory !== 'all') {
      result = result.filter((s) => s.category === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }
    return result;
  }, [supplies, filterCategory, searchQuery]);

  const groupedSupplies = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach((item) => {
      const cat = categoryLabels[item.category];
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filtered]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{supplyStats.total}</Text>
            <Text style={styles.statLabel}>ITEMS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{supplyStats.categories}</Text>
            <Text style={styles.statLabel}>CATEGORIES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, supplyStats.low > 0 && { color: Colors.statusRed }]}>
              {supplyStats.low}
            </Text>
            <Text style={styles.statLabel}>LOW</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Search color={Colors.textMuted} size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search supplies by name..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color={Colors.textMuted} size={18} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[styles.filterChip, filterCategory === 'all' && styles.filterChipActive]}
            onPress={() => setFilterCategory('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                filterCategory === 'all' && styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {allCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
              onPress={() => setFilterCategory(cat)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterCategory === cat && styles.filterChipTextActive,
                ]}
              >
                {categoryLabels[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {Object.keys(groupedSupplies).length === 0 && supplies.length > 0 && (
          <View style={styles.emptyState}>
            <Search color={Colors.textMuted} size={48} />
            <Text style={styles.emptyTitle}>No supplies found</Text>
            <Text style={styles.emptySubtitle}>
              Try a different search or category filter
            </Text>
          </View>
        )}

        {Object.keys(groupedSupplies).length === 0 && supplies.length === 0 && (
          <View style={styles.emptyState}>
            <Package color={Colors.textMuted} size={48} />
            <Text style={styles.emptyTitle}>No supplies tracked</Text>
            <Text style={styles.emptySubtitle}>
              Add items to your inventory to track quantities and expiration dates
            </Text>
          </View>
        )}

        {Object.entries(groupedSupplies).map(([category, items]) => (
          <View key={category} style={styles.categoryGroup}>
            <Text style={styles.categoryTitle}>{category.toUpperCase()}</Text>
            {items.map((item) => {
              const isLow = item.quantity <= item.minimumQuantity;
              const expStatus = getExpirationStatus(item);
              return (
                <SwipeableRow key={item.id} onDelete={() => confirmDelete(item)}>
                  <TouchableOpacity
                    style={styles.supplyCard}
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push({ pathname: '/add-supply', params: { id: item.id } } as unknown as Href)
                    }
                  >
                    <View style={styles.supplyIcon}>{categoryIcons[item.category]}</View>
                    <View style={styles.supplyInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.supplyName}>{item.name}</Text>
                        {item.isSample && (
                          <View style={styles.sampleBadge}>
                            <Text style={styles.sampleText}>SAMPLE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.supplyQty}>
                        {item.quantity} {item.unit}
                        {item.expirationDate ? ` · Exp: ${item.expirationDate}` : ''}
                      </Text>
                    </View>
                    {(isLow || expStatus === 'expired' || expStatus === 'soon') && (
                      <AlertTriangle
                        color={expStatus === 'expired' || isLow ? Colors.statusRed : Colors.statusAmber}
                        size={16}
                      />
                    )}
                  </TouchableOpacity>
                </SwipeableRow>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-supply' as Href)}
        activeOpacity={0.8}
        testID="add-supply-btn"
      >
        <Plus color={Colors.white} size={24} />
      </TouchableOpacity>
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
    paddingBottom: 100,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800' as const,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
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
    backgroundColor: Colors.orange,
    borderColor: Colors.orange,
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  categoryGroup: {
    marginBottom: 20,
  },
  categoryTitle: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 2,
    marginBottom: 8,
  },
  supplyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  supplyIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  supplyInfo: {
    flex: 1,
  },
  supplyName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  nameRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  sampleBadge: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  sampleText: {
    color: Colors.textMuted,
    fontSize: 8,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  supplyQty: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
