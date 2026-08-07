import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { router, Href } from 'expo-router';
import {
  CloudSun,
  Package,
  CheckSquare,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';

function NavCard({
  icon,
  iconBg,
  title,
  description,
  badge,
  badgeColor,
  extra,
  onPress,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  extra?: React.ReactNode;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.cardIcon, { backgroundColor: iconBg }]}>{icon}</View>
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{title}</Text>
            {badge ? (
              <View style={[styles.cardBadge, { backgroundColor: (badgeColor ?? Colors.olive) + '22' }]}>
                <Text style={[styles.cardBadgeText, { color: badgeColor ?? Colors.olive }]}>{badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.cardDesc}>{description}</Text>
          {extra}
        </View>
        <ChevronRight color={Colors.textMuted} size={18} />
      </Animated.View>
    </Pressable>
  );
}

export default function PrepHubScreen() {
  const { supplies, checklistStats, supplyStats } = useAppData();

  const totalChecked = checklistStats.reduce((sum, s) => sum + s.completed, 0);
  const totalItems = checklistStats.reduce((sum, s) => sum + s.total, 0);
  const overallPercent = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>OPERATIONAL READINESS</Text>

      <NavCard
        icon={<CloudSun color="#F6C243" size={24} />}
        iconBg="rgba(246, 194, 67, 0.15)"
        title="Weather & Conditions"
        description="Live forecast, wind, precipitation & operational impact assessment"
        onPress={() => router.push('/prep/weather' as Href)}
      />

      <NavCard
        icon={<Package color={Colors.orangeLight} size={24} />}
        iconBg={Colors.orangeMuted}
        title="Supply Inventory"
        description={`${supplyStats.total} items across ${supplyStats.categories} categories`}
        badge={supplyStats.low > 0 ? `${supplyStats.low} LOW` : undefined}
        badgeColor={supplyStats.low > 0 ? Colors.statusRed : undefined}
        extra={
          supplyStats.low > 0 ? (
            <View style={styles.alertRow}>
              <AlertTriangle color={Colors.statusRed} size={12} />
              <Text style={styles.alertText}>{supplyStats.low} item{supplyStats.low !== 1 ? 's' : ''} below minimum</Text>
            </View>
          ) : null
        }
        onPress={() => router.push('/prep/supplies' as Href)}
      />

      <NavCard
        icon={<CheckSquare color={Colors.greenLight} size={24} />}
        iconBg="rgba(76, 175, 80, 0.15)"
        title="Readiness Checklists"
        description={`${totalChecked}/${totalItems} items completed`}
        badge={`${overallPercent}%`}
        badgeColor={overallPercent === 100 ? Colors.statusGreen : overallPercent > 50 ? Colors.statusAmber : Colors.orange}
        extra={
          <View style={styles.progressRow}>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${overallPercent}%`,
                    backgroundColor:
                      overallPercent === 100
                        ? Colors.statusGreen
                        : overallPercent > 50
                        ? Colors.statusAmber
                        : Colors.orange,
                  },
                ]}
              />
            </View>
          </View>
        }
        onPress={() => router.push('/prep/checklists' as Href)}
      />
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
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 2,
    marginBottom: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardBody: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  cardBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  cardBadgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  cardDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  alertText: {
    color: Colors.statusRed,
    fontSize: 11,
    fontWeight: '600' as const,
  },
  progressRow: {
    marginTop: 8,
  },
  progressBg: {
    height: 5,
    backgroundColor: Colors.bgElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
