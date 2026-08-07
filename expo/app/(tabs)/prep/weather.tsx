import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from 'react-native';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  Gauge,
  ArrowUp,
  Sunrise,
  Sunset,
  RefreshCw,
  MapPin,
  CloudSun,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import Colors from '@/constants/colors';
import { WeatherData, WeatherForecastDay, WeatherForecastHour, Coordinates } from '@/types';
import { WEATHER_CODES } from '@/mocks/comms';

function getWeatherIcon(code: number, size: number, isDay: boolean = true) {
  const color = isDay ? '#F6C243' : '#B0BEC5';
  if (code === 0 || code === 1) return <Sun color={color} size={size} />;
  if (code === 2) return <CloudSun color={Colors.amberLight} size={size} />;
  if (code === 3) return <Cloud color={Colors.textSecondary} size={size} />;
  if (code === 45 || code === 48) return <CloudFog color={Colors.textSecondary} size={size} />;
  if (code >= 51 && code <= 55) return <CloudDrizzle color="#64B5F6" size={size} />;
  if (code >= 61 && code <= 67) return <CloudRain color="#42A5F5" size={size} />;
  if (code >= 71 && code <= 77) return <CloudSnow color="#E0E0E0" size={size} />;
  if (code >= 80 && code <= 82) return <CloudRain color="#42A5F5" size={size} />;
  if (code >= 85 && code <= 86) return <CloudSnow color="#E0E0E0" size={size} />;
  if (code >= 95) return <CloudLightning color="#FFA726" size={size} />;
  return <Sun color={color} size={size} />;
}

function windDirectionLabel(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  const h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}${ampm}`;
}

function formatDayShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return days[d.getDay()];
}

async function fetchWeather(coords: Coordinates) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,is_day&hourly=temperature_2m,weather_code,precipitation,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_days=7`;
  console.log('Fetching weather from:', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather fetch failed');
  return res.json();
}

export default function WeatherScreen() {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'web') {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
                console.log('Weather: web location obtained');
              },
              () => {
                setLocation({ latitude: 39.8283, longitude: -98.5795 });
                setLocationError('Using default US location');
              }
            );
          } else {
            setLocation({ latitude: 39.8283, longitude: -98.5795 });
          }
          return;
        }
        const Location = require('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocation({ latitude: 39.8283, longitude: -98.5795 });
          setLocationError('Location denied - using default');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        console.log('Weather: native location obtained');
      } catch (e) {
        console.log('Weather location error:', e);
        setLocation({ latitude: 39.8283, longitude: -98.5795 });
        setLocationError('Location error - using default');
      }
    })();
  }, []);

  const weatherQuery = useQuery({
    queryKey: ['weather', location?.latitude, location?.longitude],
    queryFn: () => fetchWeather(location!),
    enabled: !!location,
    refetchInterval: 600000,
    staleTime: 300000,
  });

  const current = weatherQuery.data?.current;
  const hourly = weatherQuery.data?.hourly;
  const daily = weatherQuery.data?.daily;

  const currentWeather: WeatherData | null = current
    ? {
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        windDirection: current.wind_direction_10m,
        weatherCode: current.weather_code,
        precipitation: current.precipitation,
        pressure: current.surface_pressure,
        visibility: 0,
        uvIndex: 0,
        isDay: current.is_day === 1,
        updatedAt: new Date().toISOString(),
      }
    : null;

  const hourlyForecast: WeatherForecastHour[] = hourly
    ? Array.from({ length: 24 }, (_, i) => ({
        time: hourly.time[i],
        temperature: hourly.temperature_2m[i],
        weatherCode: hourly.weather_code[i],
        precipitation: hourly.precipitation[i],
        windSpeed: hourly.wind_speed_10m[i],
      }))
    : [];

  const dailyForecast: WeatherForecastDay[] = daily
    ? Array.from({ length: daily.time.length }, (_, i) => ({
        date: daily.time[i],
        tempMax: daily.temperature_2m_max[i],
        tempMin: daily.temperature_2m_min[i],
        weatherCode: daily.weather_code[i],
        precipSum: daily.precipitation_sum[i],
        windMax: daily.wind_speed_10m_max[i],
        sunrise: daily.sunrise[i],
        sunset: daily.sunset[i],
      }))
    : [];

  const weatherLabel = currentWeather
    ? WEATHER_CODES[currentWeather.weatherCode]?.label ?? 'Unknown'
    : '';

  if (!location || weatherQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={{ opacity: pulseAnim }}>
          <Cloud color={Colors.textMuted} size={48} />
        </Animated.View>
        <Text style={styles.loadingText}>ACQUIRING WEATHER DATA</Text>
        <Text style={styles.loadingSubtext}>
          {!location ? 'Getting location...' : 'Fetching conditions...'}
        </Text>
        <ActivityIndicator color={Colors.orange} style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (weatherQuery.error) {
    return (
      <View style={styles.loadingContainer}>
        <CloudRain color={Colors.statusRed} size={48} />
        <Text style={styles.loadingText}>WEATHER UNAVAILABLE</Text>
        <Text style={styles.loadingSubtext}>Unable to fetch weather data</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => weatherQuery.refetch()}
        >
          <RefreshCw color={Colors.white} size={16} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={weatherQuery.isFetching && !weatherQuery.isLoading}
          onRefresh={() => weatherQuery.refetch()}
          tintColor={Colors.orange}
        />
      }
    >
      {locationError ? (
        <View style={styles.locationWarning}>
          <MapPin color={Colors.statusAmber} size={14} />
          <Text style={styles.locationWarningText}>{locationError}</Text>
        </View>
      ) : null}

      {currentWeather && (
        <View style={styles.currentCard}>
          <View style={styles.currentHeader}>
            <View style={styles.currentMain}>
              {getWeatherIcon(currentWeather.weatherCode, 56, currentWeather.isDay)}
              <Text style={styles.currentTemp}>
                {Math.round(currentWeather.temperature)}°
              </Text>
            </View>
            <View style={styles.currentDetails}>
              <Text style={styles.weatherLabel}>{weatherLabel}</Text>
              <Text style={styles.feelsLike}>
                Feels like {Math.round(currentWeather.feelsLike)}°F
              </Text>
              <View style={styles.coordsRow}>
                <MapPin color={Colors.textMuted} size={10} />
                <Text style={styles.coordsText}>
                  {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <MetricBox
              icon={<Wind color={Colors.oliveLight} size={16} />}
              label="WIND"
              value={`${Math.round(currentWeather.windSpeed)} mph`}
              sublabel={windDirectionLabel(currentWeather.windDirection)}
            />
            <MetricBox
              icon={<Droplets color="#64B5F6" size={16} />}
              label="HUMIDITY"
              value={`${currentWeather.humidity}%`}
            />
            <MetricBox
              icon={<CloudRain color="#42A5F5" size={16} />}
              label="PRECIP"
              value={`${currentWeather.precipitation} in`}
            />
            <MetricBox
              icon={<Gauge color={Colors.orangeLight} size={16} />}
              label="PRESSURE"
              value={`${Math.round(currentWeather.pressure)} hPa`}
            />
          </View>
        </View>
      )}

      {dailyForecast.length > 0 && dailyForecast[0] && (
        <View style={styles.sunCard}>
          <View style={styles.sunItem}>
            <Sunrise color="#F6C243" size={20} />
            <Text style={styles.sunLabel}>SUNRISE</Text>
            <Text style={styles.sunTime}>{formatTime(dailyForecast[0].sunrise)}</Text>
          </View>
          <View style={styles.sunDivider} />
          <View style={styles.sunItem}>
            <Sunset color="#FF8A65" size={20} />
            <Text style={styles.sunLabel}>SUNSET</Text>
            <Text style={styles.sunTime}>{formatTime(dailyForecast[0].sunset)}</Text>
          </View>
        </View>
      )}

      {hourlyForecast.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>24-HOUR FORECAST</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.hourlyScroll}
            contentContainerStyle={styles.hourlyContent}
          >
            {hourlyForecast.map((h, i) => (
              <View key={i} style={styles.hourCard}>
                <Text style={styles.hourTime}>{formatTime(h.time)}</Text>
                {getWeatherIcon(h.weatherCode, 22)}
                <Text style={styles.hourTemp}>{Math.round(h.temperature)}°</Text>
                {h.precipitation > 0 && (
                  <Text style={styles.hourPrecip}>{h.precipitation}"</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {dailyForecast.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>7-DAY OUTLOOK</Text>
          {dailyForecast.map((day, i) => (
            <View key={i} style={styles.dayRow}>
              <Text style={styles.dayName}>
                {i === 0 ? 'TODAY' : formatDayShort(day.date)}
              </Text>
              <View style={styles.dayIconWrap}>
                {getWeatherIcon(day.weatherCode, 20)}
              </View>
              <View style={styles.dayTempBar}>
                <Text style={styles.dayTempLow}>{Math.round(day.tempMin)}°</Text>
                <View style={styles.dayBarBg}>
                  <View
                    style={[
                      styles.dayBarFill,
                      {
                        left: `${Math.max(0, ((day.tempMin - 10) / 100) * 100)}%`,
                        right: `${Math.max(0, 100 - ((day.tempMax - 10) / 100) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.dayTempHigh}>{Math.round(day.tempMax)}°</Text>
              </View>
              {day.precipSum > 0 && (
                <View style={styles.dayPrecipBadge}>
                  <Droplets color="#64B5F6" size={10} />
                  <Text style={styles.dayPrecipText}>{day.precipSum}"</Text>
                </View>
              )}
              <View style={styles.dayWindBadge}>
                <Wind color={Colors.textMuted} size={10} />
                <Text style={styles.dayWindText}>{Math.round(day.windMax)}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      <View style={styles.operationalCard}>
        <Text style={styles.operationalTitle}>OPERATIONAL IMPACT</Text>
        {currentWeather && currentWeather.windSpeed > 30 && (
          <View style={styles.alertRow}>
            <View style={[styles.alertDot, { backgroundColor: Colors.statusRed }]} />
            <Text style={styles.alertText}>High winds - secure equipment & shelter</Text>
          </View>
        )}
        {currentWeather && currentWeather.precipitation > 0.5 && (
          <View style={styles.alertRow}>
            <View style={[styles.alertDot, { backgroundColor: Colors.statusAmber }]} />
            <Text style={styles.alertText}>Active precipitation - limit movement</Text>
          </View>
        )}
        {currentWeather && currentWeather.temperature < 32 && (
          <View style={styles.alertRow}>
            <View style={[styles.alertDot, { backgroundColor: '#42A5F5' }]} />
            <Text style={styles.alertText}>Freezing conditions - cold weather protocols</Text>
          </View>
        )}
        {currentWeather && currentWeather.temperature > 95 && (
          <View style={styles.alertRow}>
            <View style={[styles.alertDot, { backgroundColor: Colors.statusRed }]} />
            <Text style={styles.alertText}>Extreme heat - hydration critical</Text>
          </View>
        )}
        {currentWeather &&
          currentWeather.windSpeed <= 30 &&
          currentWeather.precipitation <= 0.5 &&
          currentWeather.temperature >= 32 &&
          currentWeather.temperature <= 95 && (
            <View style={styles.alertRow}>
              <View style={[styles.alertDot, { backgroundColor: Colors.statusGreen }]} />
              <Text style={styles.alertText}>Conditions nominal - no weather restrictions</Text>
            </View>
          )}
        <Text style={styles.operationalNote}>
          Radio propagation: {currentWeather && currentWeather.humidity > 80 ? 'Degraded (high moisture)' : 'Normal'}
        </Text>
        <Text style={styles.operationalNote}>
          Visibility estimate: {currentWeather && (currentWeather.weatherCode >= 45 && currentWeather.weatherCode <= 48) ? 'Reduced (fog)' : currentWeather && currentWeather.precipitation > 0.2 ? 'Reduced (precip)' : 'Good'}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          DATA: OPEN-METEO API • UPDATED {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.footerSub}>Pull down to refresh</Text>
      </View>
    </ScrollView>
  );
}

function MetricBox({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <View style={styles.metricBox}>
      <View style={styles.metricHeader}>
        {icon}
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      {sublabel ? <Text style={styles.metricSublabel}>{sublabel}</Text> : null}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 2,
    marginTop: 12,
  },
  loadingSubtext: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.orange,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
  },
  retryText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  locationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 193, 7, 0.12)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  locationWarningText: {
    color: Colors.statusAmber,
    fontSize: 12,
    fontWeight: '500' as const,
  },
  currentCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  currentMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentTemp: {
    color: Colors.textPrimary,
    fontSize: 54,
    fontWeight: '800' as const,
    letterSpacing: -2,
  },
  currentDetails: {
    marginLeft: 'auto' as const,
    alignItems: 'flex-end' as const,
  },
  weatherLabel: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  feelsLike: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  coordsText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontVariant: ['tabular-nums'] as any,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    minWidth: '45%' as any,
    backgroundColor: Colors.bgElevated,
    borderRadius: 10,
    padding: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
  },
  metricValue: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  metricSublabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  sunCard: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  sunItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  sunDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  sunLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
  },
  sunTime: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 2,
    marginTop: 16,
    marginBottom: 10,
  },
  hourlyScroll: {
    marginHorizontal: -16,
  },
  hourlyContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  hourCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  hourTime: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600' as const,
  },
  hourTemp: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  hourPrecip: {
    color: '#64B5F6',
    fontSize: 9,
    fontWeight: '600' as const,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  dayName: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '700' as const,
    width: 42,
    letterSpacing: 0.5,
  },
  dayIconWrap: {
    width: 28,
    alignItems: 'center',
  },
  dayTempBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayTempLow: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600' as const,
    width: 30,
    textAlign: 'right' as const,
  },
  dayBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.bgElevated,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  dayBarFill: {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.orange,
    borderRadius: 2,
  },
  dayTempHigh: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700' as const,
    width: 30,
  },
  dayPrecipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dayPrecipText: {
    color: '#64B5F6',
    fontSize: 10,
    fontWeight: '600' as const,
  },
  dayWindBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    width: 30,
  },
  dayWindText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600' as const,
  },
  operationalCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  operationalTitle: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 2,
    marginBottom: 12,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '500' as const,
    flex: 1,
  },
  operationalNote: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
  },
  footerSub: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
});
