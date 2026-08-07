import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, Href } from 'expo-router';
import {
  ChevronRight,
  CheckCircle,
  Circle,
  Backpack,
  Home,
  Radio,
  Car,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';

const iconMap: Record<string, React.ReactNode> = {
  Backpack: <Backpack color={Colors.orange} size={22} />,
  Home: <Home color={Colors.orange} size={22} />,
  Radio: <Radio color={Colors.orange} size={22} />,
  Car: <Car color={Colors.orange} size={22} />,
};

export default function ChecklistsScreen() {
  const { checklists, checklistStats } = useAppData();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        Track your preparedness across {checklists.length} checklists
      </Text>

      {checklists.map((cl) => {
        const stat = checklistStats.find((s) => s.id === cl.id);
        if (!stat) return null;
        const isComplete = stat.percent === 100;

        return (
          <TouchableOpacity
            key={cl.id}
            style={styles.card}
            onPress={() =>
              router.push({ pathname: '/checklist-detail', params: { id: cl.id } } as unknown as Href)
            }
            activeOpacity={0.7}
          >
            <View style={styles.cardLeft}>
              <View style={styles.iconContainer}>
                {iconMap[cl.icon] ?? <Circle color={Colors.orange} size={22} />}
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{cl.title}</Text>
                <Text style={styles.cardDesc}>{cl.description}</Text>
                <View style={styles.progressRow}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${stat.percent}%`,
                          backgroundColor: isComplete
                            ? Colors.statusGreen
                            : stat.percent > 50
                            ? Colors.statusAmber
                            : Colors.orange,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {stat.completed}/{stat.total}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.cardRight}>
              {isComplete ? (
                <CheckCircle color={Colors.statusGreen} size={20} />
              ) : (
                <ChevronRight color={Colors.textMuted} size={20} />
              )}
            </View>
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
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.orangeMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  cardDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: Colors.bgElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600' as const,
    minWidth: 32,
  },
  cardRight: {
    marginLeft: 8,
  },
});
