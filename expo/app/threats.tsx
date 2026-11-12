import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, Href, Stack } from 'expo-router';
import {
  Plus,
  Trash2,
  MapPin,
  ShieldAlert,
  CloudLightning,
  Pencil,
  ArrowUp,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { Threat, ThreatCategory, ThreatLevel, ThreatStatus } from '@/types';

const SEVERITY_ORDER: Record<string, number> = { high: 3, medium: 2, low: 1 };

function severity(likelihood: ThreatLevel, impact: ThreatLevel): ThreatLevel {
  return SEVERITY_ORDER[likelihood] * SEVERITY_ORDER[impact] >= 9
    ? 'high'
    : SEVERITY_ORDER[likelihood] * SEVERITY_ORDER[impact] >= 4
    ? 'medium'
    : 'low';
}

const SEVERITY_COLOR: Record<ThreatLevel, string> = {
  high: Colors.statusRed,
  medium: Colors.statusAmber,
  low: Colors.statusGreen,
};

const CATEGORY_LABEL: Record<ThreatCategory, string> = {
  natural: 'Natural',
  infrastructure: 'Infrastructure',
  civil: 'Civil',
  health: 'Health',
  security: 'Security',
  other: 'Other',
};

const STATUS_LABEL: Record<ThreatStatus, string> = {
  monitoring: 'Monitoring',
  active: 'Active',
  mitigated: 'Mitigated',
};

type SortId = 'severity' | 'recent';

export default function ThreatsScreen() {
  const { threats, removeThreat, addPoi, updateAlertLevel, alertLevel } = useAppData();
  const [sortBy, setSortBy] = useState<SortId>('severity');

  const sorted = useMemo(() => {
    const list = [...threats];
    if (sortBy === 'severity') {
      list.sort((a, b) => {
        const sa = SEVERITY_ORDER[severity(a.likelihood, a.impact)];
        const sb = SEVERITY_ORDER[severity(b.likelihood, b.impact)];
        if (sb !== sa) return sb - sa;
        return a.updatedAt < b.updatedAt ? 1 : -1;
      });
    } else {
      list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    }
    return list;
  }, [threats, sortBy]);

  const activeCount = threats.filter((t) => t.status === 'active').length;

  const handleDelete = useCallback(
    (threat: Threat) => {
      Alert.alert('Remove Threat', `Remove "${threat.name}" from the register?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeThreat(threat.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]);
    },
    [removeThreat]
  );

  const handlePinToMap = useCallback(
    (threat: Threat) => {
      if (!threat.coordinates) return;
      addPoi({
        id: `poi-threat-${threat.id}-${Date.now()}`,
        name: threat.name,
        category: 'hazard',
        coordinates: threat.coordinates,
        notes: `Pinned from Threat Register. ${threat.notes ?? ''}`.trim(),
        createdAt: new Date().toISOString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Pinned to Map', `"${threat.name}" is now a hazard marker on the Map tab.`);
    },
    [addPoi]
  );

  const handleRaiseAlert = useCallback(
    (threat: Threat) => {
      const target: 'amber' | 'red' = severity(threat.likelihood, threat.impact) === 'high' ? 'red' : 'amber';
      const order = ['green', 'amber', 'red'];
      if (order.indexOf(alertLevel) >= order.indexOf(target)) {
        Alert.alert('Alert Level Already Elevated', `The group alert level is already ${alertLevel.toUpperCase()}.`);
        return;
      }
      Alert.alert(
        'Raise Alert Level?',
        `"${threat.name}" is active. Set the group alert level to ${target.toUpperCase()}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Set ${target.toUpperCase()}`,
            style: 'destructive',
            onPress: () => {
              updateAlertLevel(target);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            },
          },
        ]
      );
    },
    [alertLevel, updateAlertLevel]
  );

  return (
    <>
      <Stack.Screen options={{ title: 'THREAT REGISTER' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.summaryRow}>
            <ShieldAlert color={activeCount > 0 ? Colors.statusRed : Colors.oliveLight} size={16} />
            <Text style={styles.summaryText}>
              {threats.length} tracked
              {activeCount > 0 ? ` · ${activeCount} active` : ' · none active'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.sortToggle}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSortBy((s) => (s === 'severity' ? 'recent' : 'severity'));
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.sortText}>{sortBy === 'severity' ? 'BY SEVERITY' : 'BY RECENT'}</Text>
          </TouchableOpacity>
        </View>

        {sorted.map((threat) => {
          const sev = severity(threat.likelihood, threat.impact);
          const sevColor = SEVERITY_COLOR[sev];
          return (
            <View key={threat.id} style={[styles.card, threat.status === 'active' && styles.cardActive]}>
              <View style={[styles.sevBar, { backgroundColor: sevColor }]} />
              <View style={styles.cardBody}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {threat.name}
                  </Text>
                  <View style={[styles.sevBadge, { backgroundColor: sevColor + '22' }]}>
                    <Text style={[styles.sevBadgeText, { color: sevColor }]}>{sev.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>
                  {CATEGORY_LABEL[threat.category]} · L: {threat.likelihood} · I: {threat.impact} ·{' '}
                  {STATUS_LABEL[threat.status]}
                </Text>
                {threat.notes ? (
                  <Text style={styles.cardNotes} numberOfLines={3}>
                    {threat.notes}
                  </Text>
                ) : null}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionChip}
                    onPress={() =>
                      router.push({ pathname: '/add-threat', params: { id: threat.id } } as unknown as Href)
                    }
                    activeOpacity={0.7}
                  >
                    <Pencil color={Colors.textSecondary} size={12} />
                    <Text style={styles.actionChipText}>EDIT</Text>
                  </TouchableOpacity>
                  {threat.coordinates && (
                    <TouchableOpacity
                      style={styles.actionChip}
                      onPress={() => handlePinToMap(threat)}
                      activeOpacity={0.7}
                    >
                      <MapPin color={Colors.orangeLight} size={12} />
                      <Text style={styles.actionChipText}>PIN TO MAP</Text>
                    </TouchableOpacity>
                  )}
                  {threat.status === 'active' && (
                    <TouchableOpacity
                      style={styles.actionChip}
                      onPress={() => handleRaiseAlert(threat)}
                      activeOpacity={0.7}
                    >
                      <ArrowUp color={Colors.statusRed} size={12} />
                      <Text style={styles.actionChipText}>RAISE ALERT</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionChip, styles.deleteChip]}
                    onPress={() => handleDelete(threat)}
                    activeOpacity={0.7}
                  >
                    <Trash2 color={Colors.statusRed} size={12} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {threats.length === 0 && (
          <View style={styles.emptyState}>
            <CloudLightning color={Colors.textMuted} size={32} />
            <Text style={styles.emptyText}>No threats tracked yet</Text>
            <Text style={styles.emptySubtext}>
              Log local hazards — flood zones, storm seasons, unsafe areas — and triage them here.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/add-threat' as Href);
          }}
          activeOpacity={0.8}
        >
          <Plus color={Colors.white} size={16} />
          <Text style={styles.addButtonText}>ADD THREAT</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  sortToggle: {
    backgroundColor: Colors.bgCard,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sortText: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: Colors.statusRed,
  },
  sevBar: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  sevBadge: {
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  sevBadgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  cardMeta: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600' as const,
    marginTop: 4,
    textTransform: 'capitalize' as const,
  },
  cardNotes: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgElevated,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  deleteChip: {
    marginLeft: 'auto' as const,
  },
  actionChipText: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 8,
    marginBottom: 8,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.orange,
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 8,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
});
