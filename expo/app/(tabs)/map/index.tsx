import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Animated,
  ScrollView,
  Dimensions,
  TextInput,
  FlatList,
} from 'react-native';
import { router, Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Navigation,
  Plus,
  Layers,
  Users,
  Flag,
  Crosshair,
  Route as RouteIcon,
  Trash2,
  Pencil,
  X,
  Fuel,
  Building2,
  Pill,
  ShieldAlert,
  Flame,
  Search,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAppData } from '@/providers/AppProvider';
import { POI_CATEGORY_CONFIG, MEMBER_STATUS_COLORS, DEFAULT_REGION } from '@/constants/mapHelpers';
import { Coordinates, POI, Route, WeatherData } from '@/types';
import WeatherSuggestionsBanner from '@/components/WeatherSuggestionsBanner';

let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let Circle: any = null;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
    Circle = Maps.Circle;
  } catch (e) {
    console.log('react-native-maps not available:', e);
  }
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MapScreen() {
  const {
    members,
    pois,
    routes,
    removePoi,
    removeRoute,
    updateMemberLocation,
    alertLevel,
    addPoi,
  } = useAppData();

  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [showMembers, setShowMembers] = useState<boolean>(true);
  const [showPois, setShowPois] = useState<boolean>(true);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [showInfrastructure, setShowInfrastructure] = useState<boolean>(true);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [drawerExpanded, setDrawerExpanded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const mapRef = useRef<any>(null);
  const drawerAnim = useRef(new Animated.Value(0)).current;

  // Fetch weather for resource suggestions (only when location is available)
  const weatherQuery = useQuery({
    queryKey: ['mapWeather', userLocation],
    queryFn: async (): Promise<WeatherData | null> => {
      if (!userLocation) return null;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${userLocation.latitude}&longitude=${userLocation.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,is_day,uv_index,visibility&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather fetch failed');
      const data = await res.json();
      const c = data.current;
      return {
        temperature: c.temperature_2m,
        feelsLike: c.apparent_temperature,
        humidity: c.relative_humidity_2m,
        windSpeed: c.wind_speed_10m,
        windDirection: c.wind_direction_10m,
        weatherCode: c.weather_code,
        precipitation: c.precipitation,
        pressure: c.surface_pressure,
        visibility: c.visibility ?? 10,
        uvIndex: c.uv_index ?? 0,
        isDay: c.is_day === 1,
        updatedAt: new Date().toISOString(),
      };
    },
    enabled: !!userLocation,
    staleTime: 10 * 60 * 1000, // 10 min cache
  });

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'web') {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setUserLocation({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                });
                console.log('Web location obtained:', position.coords);
              },
              (error) => {
                console.log('Web geolocation error:', error.message);
              }
            );
          }
          return;
        }

        const Location = require('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        console.log('Native location obtained:', loc.coords);
      } catch (e) {
        console.log('Error getting location:', e);
      }
    })();
  }, []);

  const toggleDrawer = useCallback(() => {
    const toValue = drawerExpanded ? 0 : 1;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(drawerAnim, {
      toValue,
      useNativeDriver: false,
      friction: 8,
    }).start();
    setDrawerExpanded(!drawerExpanded);
  }, [drawerExpanded, drawerAnim]);

  const drawerHeight = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 340],
  });

  const infrastructureCategories = useMemo(
    () => ['gas_station', 'hospital', 'pharmacy', 'police', 'fire_station'] as const,
    []
  );

  const infrastructurePois = useMemo(
    () => pois.filter((p) => (infrastructureCategories as readonly string[]).includes(p.category)),
    [pois, infrastructureCategories]
  );

  const customPois = useMemo(
    () => pois.filter((p) => !(infrastructureCategories as readonly string[]).includes(p.category)),
    [pois, infrastructureCategories]
  );

  // Search filtering — matches POI name or category label (case-insensitive)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return pois.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(q);
      const categoryLabel = POI_CATEGORY_CONFIG[p.category]?.label ?? p.category;
      const categoryMatch = categoryLabel.toLowerCase().includes(q);
      const notesMatch = p.notes?.toLowerCase().includes(q) ?? false;
      return nameMatch || categoryMatch || notesMatch;
    });
  }, [pois, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  // When searching, only show matching POIs on the map
  const visibleCustomPois = useMemo(
    () => isSearching ? customPois.filter((p) => searchResults.some((r) => r.id === p.id)) : customPois,
    [customPois, searchResults, isSearching]
  );

  const visibleInfrastructurePois = useMemo(
    () => isSearching ? infrastructurePois.filter((p) => searchResults.some((r) => r.id === p.id)) : infrastructurePois,
    [infrastructurePois, searchResults, isSearching]
  );

  const centerOnUser = useCallback(() => {
    if (!userLocation) {
      Alert.alert('Location Unavailable', 'Unable to determine your current location.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (mapRef.current && Platform.OS !== 'web') {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  }, [userLocation]);

  const handleMapLongPress = useCallback((e: any) => {
    if (Platform.OS === 'web') return;
    const coordinate = e.nativeEvent.coordinate;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/add-poi',
      params: {
        lat: coordinate.latitude.toString(),
        lng: coordinate.longitude.toString(),
      },
    } as unknown as Href);
  }, []);

  const handleDeletePoi = useCallback((poi: POI) => {
    Alert.alert(
      'Remove POI',
      `Remove "${poi.name}" from the map?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removePoi(poi.id);
            setSelectedPoi(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [removePoi]);

  const handleDeleteRoute = useCallback((route: Route) => {
    Alert.alert(
      'Remove Route',
      `Remove "${route.name}" from the map?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeRoute(route.id);
            setSelectedRoute(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [removeRoute]);

  const membersWithLocation = useMemo(
    () => members.filter((m) => m.location),
    [members]
  );

  const alertBorderColor = alertLevel === 'red'
    ? Colors.statusRed
    : alertLevel === 'amber'
    ? Colors.statusAmber
    : Colors.border;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webMapFallback}>
          <MapPin color={Colors.orange} size={48} />
          <Text style={styles.webMapTitle}>Tactical Map</Text>
          <Text style={styles.webMapSubtitle}>
            Map view is available on mobile devices
          </Text>

          <View style={styles.webStatsContainer}>
            <View style={styles.webStatCard}>
              <Users color={Colors.oliveLight} size={20} />
              <Text style={styles.webStatValue}>{membersWithLocation.length}</Text>
              <Text style={styles.webStatLabel}>Members</Text>
            </View>
            <View style={styles.webStatCard}>
              <Flag color={Colors.orange} size={20} />
              <Text style={styles.webStatValue}>{customPois.length}</Text>
              <Text style={styles.webStatLabel}>Custom POIs</Text>
            </View>
            <View style={styles.webStatCard}>
              <Building2 color={'#1E88E5'} size={20} />
              <Text style={styles.webStatValue}>{infrastructurePois.length}</Text>
              <Text style={styles.webStatLabel}>Infrastructure</Text>
            </View>
            <View style={styles.webStatCard}>
              <RouteIcon color={Colors.amberLight} size={20} />
              <Text style={styles.webStatValue}>{routes.length}</Text>
              <Text style={styles.webStatLabel}>Routes</Text>
            </View>
          </View>

          {userLocation && (
            <View style={styles.webLocationCard}>
              <Crosshair color={Colors.statusGreen} size={16} />
              <Text style={styles.webLocationText}>
                {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </Text>
            </View>
          )}

          <View style={styles.webActions}>
            <TouchableOpacity
              style={styles.webActionButton}
              onPress={() => router.push('/add-poi' as Href)}
            >
              <Plus color={Colors.white} size={18} />
              <Text style={styles.webActionText}>Add POI</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.webActionButton, { backgroundColor: Colors.oliveMuted }]}
              onPress={() => router.push('/add-route' as Href)}
            >
              <RouteIcon color={Colors.white} size={18} />
              <Text style={styles.webActionText}>Add Route</Text>
            </TouchableOpacity>
          </View>

          {pois.length > 0 && (
            <View style={styles.webPoiList}>
              <Text style={styles.webSectionTitle}>POINTS OF INTEREST</Text>
              {pois.map((poi) => {
                const config = POI_CATEGORY_CONFIG[poi.category];
                return (
                  <View key={poi.id} style={styles.webPoiRow}>
                    <View style={[styles.webPoiDot, { backgroundColor: config.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.webPoiName}>{poi.name}</Text>
                      <Text style={styles.webPoiCategory}>{config.label}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({ pathname: '/add-poi', params: { id: poi.id } } as unknown as Href)
                      }
                      style={{ marginRight: 12 }}
                    >
                      <Pencil color={Colors.orangeLight} size={16} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeletePoi(poi)}>
                      <Trash2 color={Colors.statusRed} size={16} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {routes.length > 0 && (
            <View style={styles.webPoiList}>
              <Text style={styles.webSectionTitle}>ROUTES</Text>
              {routes.map((route) => (
                <View key={route.id} style={styles.webPoiRow}>
                  <View style={[styles.webPoiDot, { backgroundColor: route.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.webPoiName}>{route.name}</Text>
                    <Text style={styles.webPoiCategory}>
                      {route.waypoints.length} waypoints
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({ pathname: '/add-route', params: { id: route.id } } as unknown as Href)
                    }
                    style={{ marginRight: 12 }}
                  >
                    <Pencil color={Colors.orangeLight} size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteRoute(route)}>
                    <Trash2 color={Colors.statusRed} size={16} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {MapView && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={
            userLocation
              ? {
                  ...userLocation,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }
              : DEFAULT_REGION
          }
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          onLongPress={handleMapLongPress}
          mapType="standard"
        >
          {showMembers &&
            membersWithLocation.map((member) => (
              <Marker
                key={`member-${member.id}`}
                coordinate={member.location!}
                title={member.name}
                description={`${member.role} - ${member.status}`}
                pinColor={MEMBER_STATUS_COLORS[member.status] ?? Colors.statusAmber}
              />
            ))}

          {showPois &&
            visibleCustomPois.map((poi) => {
              const config = POI_CATEGORY_CONFIG[poi.category];
              return (
                <Marker
                  key={`poi-${poi.id}`}
                  coordinate={poi.coordinates}
                  title={poi.name}
                  description={config.label + (poi.notes ? ` - ${poi.notes}` : '')}
                  pinColor={config.color}
                  onPress={() => setSelectedPoi(poi)}
                />
              );
            })}

          {showInfrastructure &&
            visibleInfrastructurePois.map((poi) => {
              const config = POI_CATEGORY_CONFIG[poi.category];
              return (
                <Marker
                  key={`infra-${poi.id}`}
                  coordinate={poi.coordinates}
                  title={poi.name}
                  description={config.label + (poi.notes ? ` - ${poi.notes}` : '')}
                  pinColor={config.color}
                  onPress={() => setSelectedPoi(poi)}
                />
              );
            })}

          {showRoutes &&
            routes.map((route) => (
              <Polyline
                key={`route-${route.id}`}
                coordinates={route.waypoints}
                strokeColor={route.color}
                strokeWidth={3}
                lineDashPattern={[0]}
                tappable
                onPress={() => setSelectedRoute(route)}
              />
            ))}

          {showPois &&
            visibleCustomPois
              .filter((p) => p.category === 'hazard')
              .map((poi) => (
                <Circle
                  key={`hazard-circle-${poi.id}`}
                  center={poi.coordinates}
                  radius={200}
                  fillColor="rgba(244, 67, 54, 0.12)"
                  strokeColor="rgba(244, 67, 54, 0.4)"
                  strokeWidth={1}
                />
              ))}
        </MapView>
      )}

      <View style={[styles.topBar, { borderColor: alertBorderColor }]}>
        <View style={styles.topBarRow}>
          <View style={styles.coordsContainer}>
            {userLocation ? (
              <>
                <Crosshair color={Colors.statusGreen} size={12} />
                <Text style={styles.coordsText}>
                  {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                </Text>
              </>
            ) : (
              <Text style={styles.coordsText}>Acquiring GPS...</Text>
            )}
          </View>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Users color={Colors.textSecondary} size={11} />
              <Text style={styles.badgeText}>{membersWithLocation.length}</Text>
            </View>
            <View style={styles.badge}>
              <Flag color={Colors.textSecondary} size={11} />
              <Text style={styles.badgeText}>{customPois.length}</Text>
            </View>
            <View style={styles.badge}>
              <Building2 color={Colors.textSecondary} size={11} />
              <Text style={styles.badgeText}>{infrastructurePois.length}</Text>
            </View>
            <View style={styles.badge}>
              <RouteIcon color={Colors.textSecondary} size={11} />
              <Text style={styles.badgeText}>{routes.length}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Search color={Colors.textMuted} size={18} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search POIs by name or category..."
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

      {/* Search results dropdown */}
      {isSearching && (
        <View style={styles.searchResults}>
          {searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const config = POI_CATEGORY_CONFIG[item.category];
                return (
                  <TouchableOpacity
                    style={styles.searchResultRow}
                    onPress={() => {
                      setSelectedPoi(item);
                      setSearchQuery('');
                      if (mapRef.current && Platform.OS !== 'web') {
                        mapRef.current.animateToRegion({
                          ...item.coordinates,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }, 500);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.searchResultDot, { backgroundColor: config.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchResultName}>{item.name}</Text>
                      <Text style={styles.searchResultCategory}>{config.label}</Text>
                    </View>
                    <MapPin color={Colors.textMuted} size={14} />
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.searchEmpty}>
              <Text style={styles.searchEmptyText}>No POIs match "{searchQuery}"</Text>
            </View>
          )}
        </View>
      )}

      {!isSearching && weatherQuery.data && userLocation && (
        <View style={styles.weatherBanner}>
          <WeatherSuggestionsBanner
            weather={weatherQuery.data}
            userLocation={userLocation}
            onAddPoi={addPoi}
          />
        </View>
      )}

      <View style={styles.fabColumn}>
        <TouchableOpacity
          style={styles.fab}
          onPress={centerOnUser}
          activeOpacity={0.8}
        >
          <Navigation color={Colors.white} size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fab}
          onPress={toggleDrawer}
          activeOpacity={0.8}
        >
          <Layers color={Colors.white} size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: Colors.orange }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/add-poi' as Href);
          }}
          activeOpacity={0.8}
        >
          <MapPin color={Colors.white} size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fab, { backgroundColor: Colors.oliveMuted }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/add-route' as Href);
          }}
          activeOpacity={0.8}
        >
          <RouteIcon color={Colors.white} size={20} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.layerDrawer, { height: drawerHeight }]}>
        <ScrollView style={styles.layerContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.layerTitle}>MAP LAYERS</Text>

          <TouchableOpacity
            style={styles.layerToggle}
            onPress={() => {
              setShowMembers(!showMembers);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Users color={showMembers ? Colors.statusGreen : Colors.textMuted} size={18} />
            <Text style={[styles.layerLabel, !showMembers && styles.layerLabelOff]}>
              Members ({membersWithLocation.length})
            </Text>
            <View style={[styles.toggleDot, showMembers && styles.toggleDotActive]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.layerToggle}
            onPress={() => {
              setShowPois(!showPois);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Flag color={showPois ? Colors.orange : Colors.textMuted} size={18} />
            <Text style={[styles.layerLabel, !showPois && styles.layerLabelOff]}>
              Custom POIs ({customPois.length})
            </Text>
            <View style={[styles.toggleDot, showPois && styles.toggleDotActive]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.layerToggle}
            onPress={() => {
              setShowInfrastructure(!showInfrastructure);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Building2 color={showInfrastructure ? '#1E88E5' : Colors.textMuted} size={18} />
            <Text style={[styles.layerLabel, !showInfrastructure && styles.layerLabelOff]}>
              Infrastructure ({infrastructurePois.length})
            </Text>
            <View style={[styles.toggleDot, showInfrastructure && styles.toggleDotActive]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.layerToggle}
            onPress={() => {
              setShowRoutes(!showRoutes);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <RouteIcon color={showRoutes ? Colors.amberLight : Colors.textMuted} size={18} />
            <Text style={[styles.layerLabel, !showRoutes && styles.layerLabelOff]}>
              Routes ({routes.length})
            </Text>
            <View style={[styles.toggleDot, showRoutes && styles.toggleDotActive]} />
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {selectedPoi && (
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <View style={[styles.infoCardDot, { backgroundColor: POI_CATEGORY_CONFIG[selectedPoi.category].color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoCardTitle}>{selectedPoi.name}</Text>
              <Text style={styles.infoCardSubtitle}>
                {POI_CATEGORY_CONFIG[selectedPoi.category].label}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                const poiId = selectedPoi.id;
                setSelectedPoi(null);
                router.push({ pathname: '/add-poi', params: { id: poiId } } as unknown as Href);
              }}
              style={styles.infoCardAction}
            >
              <Pencil color={Colors.orangeLight} size={16} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeletePoi(selectedPoi)} style={styles.infoCardAction}>
              <Trash2 color={Colors.statusRed} size={16} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedPoi(null)} style={styles.infoCardAction}>
              <X color={Colors.textMuted} size={18} />
            </TouchableOpacity>
          </View>
          {selectedPoi.notes ? (
            <Text style={styles.infoCardNotes}>{selectedPoi.notes}</Text>
          ) : null}
          <Text style={styles.infoCardCoords}>
            {selectedPoi.coordinates.latitude.toFixed(5)}, {selectedPoi.coordinates.longitude.toFixed(5)}
          </Text>
        </View>
      )}

      {selectedRoute && !selectedPoi && (
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <View style={[styles.infoCardDot, { backgroundColor: selectedRoute.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoCardTitle}>{selectedRoute.name}</Text>
              <Text style={styles.infoCardSubtitle}>
                {selectedRoute.waypoints.length} waypoints
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                const routeId = selectedRoute.id;
                setSelectedRoute(null);
                router.push({ pathname: '/add-route', params: { id: routeId } } as unknown as Href);
              }}
              style={styles.infoCardAction}
            >
              <Pencil color={Colors.orangeLight} size={16} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteRoute(selectedRoute)} style={styles.infoCardAction}>
              <Trash2 color={Colors.statusRed} size={16} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedRoute(null)} style={styles.infoCardAction}>
              <X color={Colors.textMuted} size={18} />
            </TouchableOpacity>
          </View>
          {selectedRoute.notes ? (
            <Text style={styles.infoCardNotes}>{selectedRoute.notes}</Text>
          ) : null}
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
  topBar: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(26, 29, 26, 0.92)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  coordsText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600' as const,
    fontVariant: ['tabular-nums'] as any,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600' as const,
  },
  weatherBanner: {
    position: 'absolute',
    top: 104,
    left: 12,
    right: 12,
  },
  searchContainer: {
    position: 'absolute',
    top: 52,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(26, 29, 26, 0.95)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
  },
  searchResults: {
    position: 'absolute',
    top: 104,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(26, 29, 26, 0.97)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 280,
    overflow: 'hidden',
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchResultDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  searchResultName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  searchResultCategory: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  searchEmpty: {
    padding: 20,
    alignItems: 'center',
  },
  searchEmptyText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  fabColumn: {
    position: 'absolute',
    right: 12,
    bottom: 20,
    gap: 10,
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  layerDrawer: {
    position: 'absolute',
    bottom: 20,
    left: 12,
    right: 68,
    backgroundColor: 'rgba(26, 29, 26, 0.95)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  layerContent: {
    padding: 14,
  },
  layerTitle: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 2,
    marginBottom: 12,
  },
  layerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  layerLabel: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  layerLabelOff: {
    color: Colors.textMuted,
  },
  toggleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.textMuted,
  },
  toggleDotActive: {
    backgroundColor: Colors.statusGreen,
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 12,
    right: 68,
    backgroundColor: 'rgba(26, 29, 26, 0.95)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoCardDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoCardTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  infoCardSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  infoCardAction: {
    padding: 6,
  },
  infoCardNotes: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 17,
  },
  infoCardCoords: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 6,
    fontVariant: ['tabular-nums'] as any,
  },
  webMapFallback: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    paddingTop: 40,
  },
  webMapTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800' as const,
    marginTop: 16,
  },
  webMapSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
    marginBottom: 24,
  },
  webStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  webStatCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  webStatValue: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800' as const,
  },
  webStatLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  webLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgCard,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  webLocationText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontVariant: ['tabular-nums'] as any,
  },
  webActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  webActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.orange,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  webActionText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  webPoiList: {
    width: '100%',
    marginBottom: 16,
  },
  webSectionTitle: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 2,
    marginBottom: 10,
  },
  webPoiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bgCard,
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  webPoiDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  webPoiName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  webPoiCategory: {
    color: Colors.textMuted,
    fontSize: 11,
  },
});
