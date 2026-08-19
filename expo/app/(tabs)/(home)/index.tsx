import React, { useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Pressable,
} from 'react-native';
import { router, Href } from 'expo-router';
import {
  Shield,
  Users,
  Package,
  CheckSquare,
  BookOpen,
  AlertTriangle,
  ChevronRight,
  Radio,
  Zap,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { AlertLevel, SupplyItem } from '@/types';
import { getInventoryAlerts } from '@/utils/supplyAlerts';
import {
  getCheckInState,
  checkInStatusLabel,
  checkInStatusColor,
  formatTimeSince,
  overdueBy,
} from '@/utils/checkin';

const alertConfig: Record<AlertLevel, { label: string; color: string; bgColor: string; description: string }> = {
  green: {
    label: 'ALL CLEAR',
    color: Colors.statusGreen,
    bgColor: 'rgba(76, 175, 80, 0.15)',
    description: 'Normal operations. Continue monitoring.',
  },
  amber: {
    label: 'ELEVATED',
    color: Colors.statusAmber,
    bgColor: 'rgba(255, 193, 7, 0.15)',
    description: 'Heightened awareness. Review checklists.',
  },
  red: {
    label: 'RED ALERT',
    color: Colors.statusRed,
    bgColor: 'rgba(244, 67, 54, 0.15)',
    description: 'Execute emergency protocols now.',
  },
};

const alertLevels: AlertLevel[] = ['green', 'amber', 'red'];

export default function DashboardScreen() {
  const {
    alertLevel,
    updateAlertLevel,
    members,
    supplies,
    checklists,
    supplyStats,
    checklistStats,
    checkInIntervalHours,
  } = useAppData();

  const currentAlert = alertConfig[alertLevel];
  const readyMembers = members.filter((m) => m.status === 'ready').length;

  const inventoryAlertRows = useMemo(() => {
    const summary = getInventoryAlerts(supplies);
    const map = new Map<string, { item: SupplyItem; reasons: { label: string; color: string }[] }>();
    const push = (item: SupplyItem, label: string, color: string) => {
      const entry = map.get(item.id) ?? { item, reasons: [] };
      entry.reasons.push({ label, color });
      map.set(item.id, entry);
    };
    summary.expired.forEach((i) => push(i, 'EXPIRED', Colors.statusRed));
    summary.low.forEach((i) => push(i, 'LOW STOCK', Colors.statusRed));
    summary.expiringSoon.forEach((i) => push(i, 'EXPIRES SOON', Colors.statusAmber));
    return [...map.values()];
  }, [supplies]);
  const checkInRows = useMemo(() => {
    return members.map((m) => {
      const state = getCheckInState(m, checkInIntervalHours);
      return { member: m, state, overdue: overdueBy(m, checkInIntervalHours) };
    });
  }, [members, checkInIntervalHours]);

  const overdueCount = useMemo(
    () => checkInRows.filter((r) => r.state === 'overdue' || r.state === 'never').length,
    [checkInRows]
  );

  const totalChecked = checklistStats.reduce((sum, s) => sum + s.completed, 0);
  const totalItems = checklistStats.reduce((sum, s) => sum + s.total, 0);
  const overallPercent = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

  const handleAlertChange = useCallback(
    (level: AlertLevel) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      updateAlertLevel(level);
    },
    [updateAlertLevel]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.alertBanner, { backgroundColor: currentAlert.bgColor }]}>
        <View style={styles.alertHeader}>
          <AlertTriangle color={currentAlert.color} size={22} />
          <Text style={[styles.alertLabel, { color: currentAlert.color }]}>
            {currentAlert.label}
          </Text>
        </View>
        <Text style={styles.alertDescription}>{currentAlert.description}</Text>
        <View style={styles.alertButtons}>
          {alertLevels.map((level) => {
            const config = alertConfig[level];
            const isActive = alertLevel === level;
            return (
              <TouchableOpacity
                key={level}
                testID={`alert-${level}`}
                style={[
                  styles.alertButton,
                  {
                    backgroundColor: isActive ? config.color : Colors.bgCard,
                    borderColor: isActive ? config.color : Colors.border,
                  },
                ]}
                onPress={() => handleAlertChange(level)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.alertButtonText,
                    { color: isActive ? Colors.white : Colors.textSecondary },
                  ]}
                >
                  {level.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon={<Users color={Colors.oliveLight} size={20} />}
          label="PERSONNEL"
          value={`${readyMembers}/${members.length}`}
          sublabel={overdueCount > 0 ? `${overdueCount} overdue` : 'Ready'}
          alert={overdueCount > 0}
          onPress={() => router.push('/(tabs)/intel/group' as Href)}
        />
        <StatCard
          icon={<Package color={Colors.orangeLight} size={20} />}
          label="SUPPLIES"
          value={`${supplies.length}`}
          sublabel={supplyStats.low > 0 ? `${supplyStats.low} low` : 'Stocked'}
          alert={supplyStats.low > 0}
          onPress={() => router.push('/(tabs)/prep/supplies' as Href)}
        />
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon={<CheckSquare color={Colors.greenLight} size={20} />}
          label="READINESS"
          value={`${overallPercent}%`}
          sublabel={`${totalChecked}/${totalItems} items`}
          onPress={() => router.push('/(tabs)/prep/checklists' as Href)}
        />
        <StatCard
          icon={<BookOpen color={Colors.amberLight} size={20} />}
          label="GUIDES"
          value="6"
          sublabel="Available"
          onPress={() => router.push('/(tabs)/intel/guides' as Href)}
        />
      </View>

      {inventoryAlertRows.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>INVENTORY ALERTS</Text>
          {inventoryAlertRows.map(({ item, reasons }) => (
            <TouchableOpacity
              key={item.id}
              style={styles.invAlertRow}
              onPress={() =>
                router.push({ pathname: '/add-supply', params: { id: item.id } } as unknown as Href)
              }
              activeOpacity={0.7}
            >
              <AlertTriangle color={reasons[0].color} size={16} />
              <View style={styles.invAlertInfo}>
                <Text style={styles.invAlertName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.invAlertSub} numberOfLines={1}>
                  {item.quantity} {item.unit}
                  {item.expirationDate ? ` · Exp ${item.expirationDate}` : ''}
                </Text>
              </View>
              <View style={styles.invAlertBadges}>
                {reasons.map((r) => (
                  <View key={r.label} style={[styles.invAlertBadge, { backgroundColor: r.color + '22' }]}>
                    <Text style={[styles.invAlertBadgeText, { color: r.color }]}>{r.label}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      {members.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>CHECK-IN STATUS · EVERY {checkInIntervalHours}H</Text>
          <View style={styles.checkInPanel}>
            {checkInRows.map(({ member, state, overdue }) => (
              <TouchableOpacity
                key={member.id}
                style={styles.checkInRow}
                onPress={() =>
                  router.push({ pathname: '/member-detail', params: { id: member.id } } as unknown as Href)
                }
                activeOpacity={0.7}
              >
                <Clock color={checkInStatusColor(state)} size={14} />
                <Text style={styles.checkInName} numberOfLines={1}>{member.name}</Text>
                <Text style={styles.checkInSince}>
                  {member.lastCheckInAt ? formatTimeSince(member.lastCheckInAt) : 'never'}
                </Text>
                <View
                  style={[
                    styles.checkInBadge,
                    { backgroundColor: checkInStatusColor(state) + '22' },
                  ]}
                >
                  <Text style={[styles.checkInBadgeText, { color: checkInStatusColor(state) }]}>
                    {overdue ?? checkInStatusLabel(state)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>QUICK ACCESS</Text>
      <View style={styles.quickGrid}>
        <QuickAction
          icon={<Zap color={Colors.orange} size={22} />}
          label="Bug-Out Bag"
          onPress={() => router.push({ pathname: '/checklist-detail', params: { id: 'cl1' } } as unknown as Href)}
        />
        <QuickAction
          icon={<Radio color={Colors.orange} size={22} />}
          label="Comms Plan"
          onPress={() => router.push({ pathname: '/checklist-detail', params: { id: 'cl3' } } as unknown as Href)}
        />
        <QuickAction
          icon={<Shield color={Colors.orange} size={22} />}
          label="Security"
          onPress={() => router.push({ pathname: '/guide-detail', params: { id: 'g6' } } as unknown as Href)}
        />
        <QuickAction
          icon={<AlertTriangle color={Colors.orange} size={22} />}
          label="First Aid"
          onPress={() => router.push({ pathname: '/guide-detail', params: { id: 'g2' } } as unknown as Href)}
        />
      </View>

      {checklists.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>CHECKLIST STATUS</Text>
          {checklists.map((cl) => {
            const stat = checklistStats.find((s) => s.id === cl.id);
            if (!stat) return null;
            return (
              <TouchableOpacity
                key={cl.id}
                style={styles.checklistRow}
                onPress={() => router.push({ pathname: '/checklist-detail', params: { id: cl.id } } as unknown as Href)}
                activeOpacity={0.7}
              >
                <View style={styles.checklistInfo}>
                  <Text style={styles.checklistName}>{cl.title}</Text>
                  <Text style={styles.checklistSub}>
                    {stat.completed}/{stat.total} complete
                  </Text>
                </View>
                <View style={styles.checklistRight}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${stat.percent}%`,
                          backgroundColor:
                            stat.percent === 100
                              ? Colors.statusGreen
                              : stat.percent > 50
                              ? Colors.statusAmber
                              : Colors.orange,
                        },
                      ]}
                    />
                  </View>
                  <ChevronRight color={Colors.textMuted} size={16} />
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>ALL DATA STORED LOCALLY</Text>
        <Text style={styles.footerSubtext}>No internet required</Text>
      </View>
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
  sublabel,
  alert,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  alert?: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.statCardWrapper}>
      <Animated.View style={[styles.statCard, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.statCardHeader}>
          {icon}
          <Text style={styles.statLabel}>{label}</Text>
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={[styles.statSublabel, alert && { color: Colors.statusRed }]}>
          {sublabel}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.93,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.quickActionWrapper}>
      <Animated.View style={[styles.quickAction, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.quickActionIcon}>{icon}</View>
        <Text style={styles.quickActionLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
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
  alertBanner: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  alertLabel: {
    fontSize: 16,
    fontWeight: '800' as const,
    letterSpacing: 2,
  },
  alertDescription: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  alertButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  alertButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  alertButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800' as const,
  },
  statSublabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 2,
    marginTop: 20,
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickActionWrapper: {
    width: '48%' as const,
    flexGrow: 1,
  },
  quickAction: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.orangeMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  checkInPanel: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  checkInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  checkInName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600' as const,
    flex: 1,
  },
  checkInSince: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  checkInBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  checkInBadgeText: {
    fontSize: 8,
    fontWeight: '800' as const,
    letterSpacing: 0.8,
  },
  invAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  invAlertInfo: {
    flex: 1,
  },
  invAlertName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  invAlertSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  invAlertBadges: {
    gap: 4,
    alignItems: 'flex-end' as const,
  },
  invAlertBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  invAlertBadgeText: {
    fontSize: 8,
    fontWeight: '800' as const,
    letterSpacing: 0.8,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checklistInfo: {
    flex: 1,
  },
  checklistName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  checklistSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  checklistRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBarBg: {
    width: 60,
    height: 6,
    backgroundColor: Colors.bgElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
  footerSubtext: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
});
