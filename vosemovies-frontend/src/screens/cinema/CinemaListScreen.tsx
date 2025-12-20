import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  useWindowDimensions,
  Animated,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Cinema } from '../../types/Cinema';
import { BALEARIC_CINEMAS, getCinemasWithinRadius } from '../../data/cinemas/balearicCinemas';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CinemaMapView from '../../components/cinema/CinemaMapView';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { theme } from '../../styles/theme';

interface LocationData {
  latitude: number;
  longitude: number;
}

export default function CinemaListScreen({ navigation }: any) {
  const [cinemas, setCinemas] = useState<Cinema[]>(BALEARIC_CINEMAS);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);

  // Detect orientation
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const numColumns = isLandscape ? 4 : 1;

  // Animated scroll values for collapsible header
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [60, 0],
    extrapolate: 'clamp',
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 30],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      setLoading(true);

      // First check if we already have permission
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

      let finalStatus = existingStatus;

      // Only request if we don't have permission yet
      if (existingStatus !== 'granted') {
        const { status: requestStatus } = await Location.requestForegroundPermissionsAsync();
        finalStatus = requestStatus;
      }

      if (finalStatus === 'granted') {
        setLocationPermission(true);

        try {
          // Try to get current location first
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 15000, // 15 seconds
            maximumAge: 10000, // Accept cached location up to 10 seconds old
          });

          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          // Sort cinemas by distance when location is available
          const nearbyCinemas = getCinemasWithinRadius(
            location.coords.latitude,
            location.coords.longitude,
            50 // 50km radius for Mallorca
          );
          setCinemas(nearbyCinemas.length > 0 ? nearbyCinemas : BALEARIC_CINEMAS);
        } catch (locationError) {
          console.log('Current location unavailable, trying last known position:', locationError);

          // Fallback to last known position
          try {
            const lastLocation = await Location.getLastKnownPositionAsync({
              maxAge: 300000, // Accept location up to 5 minutes old
            });

            if (lastLocation) {
              setUserLocation({
                latitude: lastLocation.coords.latitude,
                longitude: lastLocation.coords.longitude,
              });

              const nearbyCinemas = getCinemasWithinRadius(
                lastLocation.coords.latitude,
                lastLocation.coords.longitude,
                50
              );
              setCinemas(nearbyCinemas.length > 0 ? nearbyCinemas : BALEARIC_CINEMAS);
            } else {
              // No cached location available
              console.log('No last known location available');
            }
          } catch (lastLocationError) {
            console.log('Last known location also failed:', lastLocationError);
          }
        }
      } else {
        setLocationPermission(false);

        // Offer to open settings if permanently denied
        if (existingStatus === 'denied') {
          Alert.alert(
            'Location Permission Required',
            'Location access is needed to sort cinemas by distance. You can enable it in your device settings.',
            [
              { text: 'Not Now', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => {
                  // Note: Opening settings requires Linking API in a real scenario
                  Alert.alert('Info', 'Please enable location permissions in Settings > VOSEMovies > Location');
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Location Permission',
            'Location access denied. Showing all cinemas without distance sorting.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationPermission(false);
      Alert.alert(
        'Location Error',
        'Unable to get your location. Showing all cinemas.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (cinema: Cinema): number | null => {
    if (!userLocation) return null;

    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(cinema.location.lat - userLocation.latitude);
    const dLng = toRadians(cinema.location.lng - userLocation.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(userLocation.latitude)) * Math.cos(toRadians(cinema.location.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  const handleCinemaPress = (cinema: Cinema) => {
    setSelectedCinema(cinema);
    if (viewMode === 'list') {
      navigation.navigate('CinemaDetail', { cinema });
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'map' : 'list');
    setSelectedCinema(null);
  };

  const getVOSESupportColor = (support: Cinema['voseSupport']): string => {
    switch (support) {
      case 'specialist': return '#4CAF50';
      case 'frequent': return '#8BC34A';
      case 'occasional': return '#FF9800';
      case 'rare': return '#FF5722';
      default: return '#9E9E9E';
    }
  };

  const getVOSESupportText = (support: Cinema['voseSupport']): string => {
    switch (support) {
      case 'specialist': return 'VOSE Specialist';
      case 'frequent': return 'Frequent VOSE';
      case 'occasional': return 'Occasional VOSE';
      case 'rare': return 'Rare VOSE';
      default: return 'Unknown';
    }
  };

  const renderCinemaItem = ({ item }: { item: Cinema }) => {
    const distance = calculateDistance(item);

    return (
      <TouchableOpacity
        style={[
          styles.cinemaCard,
          isLandscape && styles.cinemaCardLandscape
        ]}
        onPress={() => handleCinemaPress(item)}
      >
        {item.logoUrl && (
          <Image
            source={{ uri: item.logoUrl }}
            style={styles.cinemaLogo}
            resizeMode="contain"
          />
        )}
        <View style={styles.cinemaHeader}>
          <Text style={styles.cinemaName} numberOfLines={isLandscape ? 1 : 2}>{item.name}</Text>
          {distance && (
            <Text style={styles.distance}>{distance.toFixed(1)} km</Text>
          )}
        </View>

        <View style={styles.cinemaInfo}>
          <View style={styles.chainContainer}>
            <Ionicons name="business" size={14} color="#888" />
            <Text style={styles.chainText} numberOfLines={1}>{item.chain}</Text>
          </View>

          <View style={[styles.voseContainer, { backgroundColor: getVOSESupportColor(item.voseSupport) + '20' }]}>
            <View style={[styles.voseDot, { backgroundColor: getVOSESupportColor(item.voseSupport) }]} />
            <Text style={[styles.voseText, { color: getVOSESupportColor(item.voseSupport) }]} numberOfLines={1}>
              {getVOSESupportText(item.voseSupport)}
            </Text>
          </View>
        </View>

        <View style={styles.locationContainer}>
          <Ionicons name="location" size={14} color="#888" />
          <Text style={styles.locationText} numberOfLines={isLandscape ? 2 : 3}>
            {item.location.address}, {item.location.city}
          </Text>
        </View>

        {item.features && (
          <View style={styles.featuresContainer}>
            {item.features.imax && (
              <View style={styles.featureTag}>
                <Ionicons name="film" size={12} color="#4CAF50" />
                <Text style={styles.featureText}>IMAX</Text>
              </View>
            )}
            {item.features.dolbyAtmos && (
              <View style={styles.featureTag}>
                <Ionicons name="volume-high" size={12} color="#4CAF50" />
                <Text style={styles.featureText}>Dolby Atmos</Text>
              </View>
            )}
            {item.features.parking && (
              <View style={styles.featureTag}>
                <Ionicons name="car" size={12} color="#4CAF50" />
                <Text style={styles.featureText}>Parking</Text>
              </View>
            )}
            {item.features.restaurant && (
              <View style={styles.featureTag}>
                <Ionicons name="restaurant" size={12} color="#4CAF50" />
                <Text style={styles.featureText}>Restaurant</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={theme.background.gradient}
          style={styles.container}
          locations={[0, 0.5, 1]}
        >
          <LoadingSpinner />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={theme.background.gradient}
        style={styles.container}
        locations={[0, 0.5, 1]}
      >
        <Animated.View
          style={[
            styles.header,
            {
              height: headerHeight,
              opacity: headerOpacity,
            }
          ]}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.title}>VOSE Cinemas</Text>
            <Text style={styles.subtitle}>
              {locationPermission === false
                ? 'All Mallorca'
                : userLocation
                  ? 'By distance'
                  : 'Mallorca'
              }
            </Text>
          </View>
          <TouchableOpacity style={styles.viewToggle} onPress={toggleViewMode}>
            <Ionicons
              name={viewMode === 'list' ? 'map' : 'list'}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </Animated.View>

      {viewMode === 'list' ? (
        <Animated.FlatList
          data={cinemas}
          key={numColumns}
          numColumns={numColumns}
          columnWrapperStyle={isLandscape ? styles.row : undefined}
          renderItem={renderCinemaItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      ) : (
        <>
          <ErrorBoundary
            fallback={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1d3a' }}>
                <Ionicons name="map-outline" size={64} color="#666" />
                <Text style={{ color: '#fff', fontSize: 18, marginTop: 20 }}>Map unavailable</Text>
                <Text style={{ color: '#999', fontSize: 14, marginTop: 10 }}>Please use list view</Text>
                <TouchableOpacity
                  style={{ marginTop: 20, padding: 15, backgroundColor: '#4a90e2', borderRadius: 8 }}
                  onPress={() => setViewMode('list')}
                >
                  <Text style={{ color: '#fff' }}>Back to List</Text>
                </TouchableOpacity>
              </View>
            }
          >
            <CinemaMapView
              onCinemaPress={handleCinemaPress}
              selectedCinema={selectedCinema}
              navigation={navigation}
            />
          </ErrorBoundary>
        </>
      )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f1123',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.card.border,
    backgroundColor: 'rgba(26, 29, 58, 0.95)',
    overflow: 'hidden',
  },
  headerLeft: {
    flex: 1,
  },
  viewToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.card.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.card.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: theme.text.secondary,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  cinemaCard: {
    backgroundColor: theme.card.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.card.border,
  },
  cinemaCardLandscape: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    maxWidth: '23%',
    padding: theme.spacing.sm,
  },
  cinemaLogo: {
    width: 100,
    height: 32,
    marginBottom: 12,
  },
  cinemaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  cinemaName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.text.primary,
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  distance: {
    fontSize: 11,
    color: theme.text.secondary,
    fontWeight: '500',
    flexShrink: 0,
  },
  cinemaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  chainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  chainText: {
    fontSize: 12,
    color: theme.text.secondary,
    marginLeft: 4,
    flex: 1,
  },
  voseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    flexShrink: 0,
  },
  voseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
    flexShrink: 0,
  },
  voseText: {
    fontSize: 10,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 12,
    color: theme.text.secondary,
    marginLeft: 4,
    flex: 1,
    lineHeight: 16,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featureText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  loadingText: {
    color: theme.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  floatingCard: {
    position: 'absolute',
    top: 20,
    left: 16,
    maxWidth: 420,
    backgroundColor: theme.card.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.card.border,
    ...theme.shadow.large,
    overflow: 'hidden',
  },
  floatingCardHeader: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.card.border,
  },
  floatingCardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  floatingCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text.primary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  closeButton: {
    padding: 4,
    backgroundColor: theme.card.backgroundDark,
    borderRadius: 12,
  },
  floatingCardContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  floatingInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  floatingAddress: {
    flex: 1,
    fontSize: 14,
    color: theme.text.primary,
    lineHeight: 20,
  },
  floatingContact: {
    flex: 1,
    fontSize: 13,
    color: theme.text.secondary,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.brand.primary,
    borderTopWidth: 1,
    borderTopColor: theme.card.border,
  },
  viewDetailsText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text.primary,
  },
});