import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  CloudRain,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  Droplets,
  Home,
  AlertTriangle,
  MapPin,
  Cloud,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { WeatherData, POI } from '@/types';
import {
  fetchWeatherSuggestions,
  getWeatherTrigger,
  suggestionToPoi,
  WeatherSuggestion,
} from '@/services/weatherSuggestions';

interface WeatherSuggestionsBannerProps {
  weather: WeatherData | null;
  userLocation: { latitude: number; longitude: number } | null;
  onAddPoi: (poi: POI) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  water: <Droplets color="#00BCD4" size={16} />,
  shelter: <Home color={Colors.oliveLight} size={16} />,
  hazard: <AlertTriangle color={Colors.statusRed} size={16} />,
  weather_resource: <CloudRain color="#00BCD4" size={16} />,
  rally_point: <MapPin color={Colors.statusGreen} size={16} />,
  supply_cache: <Plus color={Colors.orange} size={16} />,
};

export default function WeatherSuggestionsBanner({
  weather,
  userLocation,
  onAddPoi,
}: WeatherSuggestionsBannerProps) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<WeatherSuggestion[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const trigger = weather ? getWeatherTrigger(weather) : null;

  const loadSuggestions = useCallback(async () => {
    if (!weather || !userLocation || !trigger) return;
    setLoading(true);
    try {
      const response = await fetchWeatherSuggestions(weather, userLocation);
      setSuggestions(response.suggestions);
      setSummary(response.summary);
    } catch (e) {
      console.log('Suggestion load error:', e);
    } finally {
      setLoading(false);
    }
  }, [weather, userLocation, trigger]);

  useEffect(() => {
    if (weather && userLocation && trigger && !dismissed) {
      loadSuggestions();
    }
  }, [weather, userLocation, trigger, dismissed, loadSuggestions]);

  // Reset dismissed state when weather changes significantly
  useEffect(() => {
    setDismissed(false);
    setAddedIds(new Set());
  }, [weather?.weatherCode]);

  if (!weather || !trigger || dismissed) {
    return null;
  }

  const handleAdd = useCallback(
    (suggestion: WeatherSuggestion) => {
      if (!userLocation || addedIds.has(suggestion.id)) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const poi = suggestionToPoi(suggestion, userLocation);
      onAddPoi(poi);
      setAddedIds((prev) => new Set(prev).add(suggestion.id));
    },
    [userLocation, onAddPoi, addedIds]
  );

  const handleAddAll = useCallback(() => {
    if (!userLocation) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    suggestions.forEach((s) => {
      if (!addedIds.has(s.id)) {
        const poi = suggestionToPoi(s, userLocation);
        onAddPoi(poi);
      }
    });
    setAddedIds(new Set(suggestions.map((s) => s.id)));
  }, [userLocation, suggestions, onAddPoi, addedIds]);

  const hasSuggestions = suggestions.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setExpanded(!expanded);
          }}
          activeOpacity={0.7}
        >
          <CloudRain color="#00BCD4" size={18} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Weather Resource Alert</Text>
            <Text style={styles.headerSummary} numberOfLines={expanded ? 3 : 1}>
              {loading ? 'Analyzing conditions...' : summary || trigger}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          {!loading && hasSuggestions && expanded && (
            <TouchableOpacity
              style={styles.addAllBtn}
              onPress={handleAddAll}
              activeOpacity={0.7}
            >
              <Plus color={Colors.white} size={14} />
              <Text style={styles.addAllText}>Add All</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setExpanded(!expanded);
            }}
            style={styles.expandBtn}
          >
            {expanded ? (
              <ChevronUp color={Colors.textSecondary} size={18} />
            ) : (
              <ChevronDown color={Colors.textSecondary} size={18} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDismissed(true)}
            style={styles.dismissBtn}
          >
            <X color={Colors.textMuted} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      {expanded && (
        <View style={styles.suggestionsContainer}>
          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Colors.orange} size="small" />
              <Text style={styles.loadingText}>
                Fetching tactical resource suggestions...
              </Text>
            </View>
          )}

          {!loading && hasSuggestions && (
            <ScrollView style={styles.suggestionsList} showsVerticalScrollIndicator={false}>
              {suggestions.map((s) => {
                const isAdded = addedIds.has(s.id);
                return (
                  <View key={s.id} style={styles.suggestionCard}>
                    <View style={styles.suggestionHeader}>
                      {categoryIcons[s.category] || <Cloud color={Colors.textSecondary} size={16} />}
                      <Text style={styles.suggestionTitle}>{s.title}</Text>
                      <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(s.category) }]}>
                        <Text style={styles.categoryBadgeText}>{s.category.replace(/_/g, ' ').toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={styles.suggestionDesc}>{s.description}</Text>
                    <Text style={styles.suggestionReason}>Why: {s.reasoning}</Text>
                    <TouchableOpacity
                      style={[styles.addBtn, isAdded && styles.addBtnDone]}
                      onPress={() => handleAdd(s)}
                      disabled={isAdded}
                      activeOpacity={0.7}
                    >
                      {isAdded ? (
                        <>
                          <MapPin color={Colors.statusGreen} size={14} />
                          <Text style={styles.addBtnDoneText}>Added to Map</Text>
                        </>
                      ) : (
                        <>
                          <Plus color={Colors.white} size={14} />
                          <Text style={styles.addBtnText}>Add to Map</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {!loading && !hasSuggestions && (
            <Text style={styles.noSuggestionsText}>
              No specific resource suggestions for current conditions. Stay alert.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    water: '#00BCD4',
    shelter: Colors.olive,
    hazard: Colors.statusRed,
    weather_resource: '#00BCD4',
    rally_point: Colors.statusGreen,
    supply_cache: Colors.orange,
  };
  return colors[category] || Colors.textSecondary;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(26, 29, 26, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00BCD4',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: '#00BCD4',
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  headerSummary: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.orange,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addAllText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  expandBtn: {
    padding: 4,
  },
  dismissBtn: {
    padding: 4,
  },
  suggestionsContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  suggestionsList: {
    maxHeight: 280,
  },
  suggestionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  suggestionTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700' as const,
    flex: 1,
  },
  categoryBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    color: Colors.white,
    fontSize: 8,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  suggestionDesc: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 4,
  },
  suggestionReason: {
    color: Colors.textMuted,
    fontSize: 10,
    fontStyle: 'italic' as const,
    lineHeight: 14,
    marginBottom: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.orange,
    borderRadius: 8,
    paddingVertical: 8,
  },
  addBtnDone: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.statusGreen,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  addBtnDoneText: {
    color: Colors.statusGreen,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  noSuggestionsText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
