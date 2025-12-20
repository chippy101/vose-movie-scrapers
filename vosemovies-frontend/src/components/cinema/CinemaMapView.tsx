import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { Cinema } from '../../types/Cinema';
import { BALEARIC_CINEMAS } from '../../data/cinemas/balearicCinemas';

// Configure MapLibre (no API key needed for OSM tiles)
MapLibreGL.setAccessToken(null);

interface CinemaMapViewProps {
  onCinemaPress: (cinema: Cinema) => void;
  selectedCinema?: Cinema | null;
  navigation?: any;
}

const { width, height } = Dimensions.get('window');

// Mallorca center coordinates
const MALLORCA_CENTER = {
  latitude: 39.6953,
  longitude: 2.9094,
};

export default function CinemaMapView({ onCinemaPress, selectedCinema, navigation }: CinemaMapViewProps) {
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const cameraRef = useRef<MapLibreGL.Camera>(null);
  const mapRef = useRef<MapLibreGL.MapView>(null);

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status: requestStatus } = await Location.requestForegroundPermissionsAsync();
        finalStatus = requestStatus;
      }

      if (finalStatus === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 15000,
            maximumAge: 10000,
          });

          const userCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(userCoords);

          // Center map on user location if they're in Balearic Islands area
          if (isInMallorca(userCoords.latitude, userCoords.longitude)) {
            cameraRef.current?.setCamera({
              centerCoordinate: [userCoords.longitude, userCoords.latitude],
              zoomLevel: 11,
              animationDuration: 1000,
            });
          }
        } catch (locationError) {
          console.log('Current location unavailable:', locationError);

          try {
            const lastLocation = await Location.getLastKnownPositionAsync({
              maxAge: 300000,
            });

            if (lastLocation) {
              const userCoords = {
                latitude: lastLocation.coords.latitude,
                longitude: lastLocation.coords.longitude,
              };
              setUserLocation(userCoords);

              if (isInMallorca(userCoords.latitude, userCoords.longitude)) {
                cameraRef.current?.setCamera({
                  centerCoordinate: [userCoords.longitude, userCoords.latitude],
                  zoomLevel: 11,
                  animationDuration: 1000,
                });
              }
            }
          } catch (lastLocationError) {
            console.log('Last known location also failed:', lastLocationError);
          }
        }
      } else {
        console.log('Location permission not granted in map view');
      }
    } catch (error) {
      console.log('Error getting user location:', error);
    }
  };

  const isInMallorca = (lat: number, lng: number): boolean => {
    return lat >= 39.2 && lat <= 40.1 && lng >= 2.3 && lng <= 3.5;
  };

  const getMarkerColor = (voseSupport: Cinema['voseSupport']): string => {
    switch (voseSupport) {
      case 'specialist': return '#4CAF50';
      case 'frequent': return '#8BC34A';
      case 'occasional': return '#FF9800';
      case 'rare': return '#FF5722';
      default: return '#9E9E9E';
    }
  };

  const centerOnUserLocation = async () => {
    if (!userLocation) {
      await getUserLocation();
      return;
    }

    cameraRef.current?.setCamera({
      centerCoordinate: [userLocation.longitude, userLocation.latitude],
      zoomLevel: 13,
      animationDuration: 1000,
    });
  };

  const centerOnMallorca = () => {
    cameraRef.current?.setCamera({
      centerCoordinate: [MALLORCA_CENTER.longitude, MALLORCA_CENTER.latitude],
      zoomLevel: 9,
      animationDuration: 1000,
    });
  };

  const handleOpenWebsite = async (url: string) => {
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const canOpen = await Linking.canOpenURL(fullUrl);
      if (canOpen) {
        await Linking.openURL(fullUrl);
      } else {
        Alert.alert('Error', 'Unable to open website');
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert('Error', 'Unable to open website');
    }
  };

  const handleCallPhone = async (phone: string) => {
    try {
      const phoneUrl = `tel:${phone}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'Unable to make phone call');
      }
    } catch (error) {
      console.error('Error opening phone:', error);
      Alert.alert('Error', 'Unable to make phone call');
    }
  };

  const handleOpenMaps = async (lat: number, lng: number) => {
    try {
      const url = `https://maps.google.com/?q=${lat},${lng}&z=16`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open maps');
      }
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert('Error', 'Unable to open maps');
    }
  };

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL="https://tiles.openfreemap.org/styles/liberty"
        logoEnabled={false}
        attributionEnabled={true}
        attributionPosition={{ bottom: 8, left: 8 }}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={9}
          centerCoordinate={[MALLORCA_CENTER.longitude, MALLORCA_CENTER.latitude]}
        />

        {/* User Location */}
        {userLocation && (
          <MapLibreGL.PointAnnotation
            id="userLocation"
            coordinate={[userLocation.longitude, userLocation.latitude]}
          >
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationDot} />
            </View>
          </MapLibreGL.PointAnnotation>
        )}

        {/* Cinema Markers */}
        {BALEARIC_CINEMAS.map((cinema) => (
          <MapLibreGL.PointAnnotation
            key={cinema.id}
            id={cinema.id}
            coordinate={[cinema.location.lng, cinema.location.lat]}
            onSelected={() => onCinemaPress(cinema)}
          >
            <View style={styles.markerContainer}>
              <View
                style={[
                  styles.marker,
                  { backgroundColor: getMarkerColor(cinema.voseSupport) }
                ]}
              >
                <Ionicons name="business" size={16} color="#fff" />
              </View>
            </View>
          </MapLibreGL.PointAnnotation>
        ))}
      </MapLibreGL.MapView>

      {/* Map Controls */}
      <View style={styles.controls}>
        {userLocation && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={centerOnUserLocation}
          >
            <Ionicons name="locate" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.controlButton}
          onPress={centerOnMallorca}
        >
          <Ionicons name="home" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Combined Cinema Info & Legend */}
      {selectedCinema && (
        <View style={styles.selectedCinemaInfo}>
          {/* Header with Title and Close Button */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedCinema.name}</Text>
            <TouchableOpacity
              onPress={() => onCinemaPress(null as any)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Legend Section */}
          <View style={styles.legendSection}>
            <Text style={styles.legendTitle}>VOSE Support</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.legendText}>Specialist</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#8BC34A' }]} />
                <Text style={styles.legendText}>Frequent</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.legendText}>Occasional</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF5722' }]} />
                <Text style={styles.legendText}>Rare</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Cinema Details */}
          {selectedCinema.logoUrl && (
            <Image
              source={{ uri: selectedCinema.logoUrl }}
              style={styles.popupLogo}
              resizeMode="contain"
            />
          )}
          <Text style={styles.selectedCinemaDetails}>
            {selectedCinema.chain}
          </Text>

          {/* Address */}
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleOpenMaps(selectedCinema.location.lat, selectedCinema.location.lng)}
          >
            <Ionicons name="location" size={14} color="#4A9EFF" />
            <Text style={[styles.infoText, styles.linkText]}>
              {selectedCinema.location.address}, {selectedCinema.location.city}
            </Text>
          </TouchableOpacity>

          {/* Contact Details */}
          {selectedCinema.contact?.phone && (
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => handleCallPhone(selectedCinema.contact!.phone!)}
            >
              <Ionicons name="call" size={14} color="#4A9EFF" />
              <Text style={[styles.infoText, styles.linkText]}>{selectedCinema.contact.phone}</Text>
            </TouchableOpacity>
          )}
          {selectedCinema.contact?.website && (
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => handleOpenWebsite(selectedCinema.contact!.website!)}
            >
              <Ionicons name="globe" size={14} color="#4A9EFF" />
              <Text style={[styles.infoText, styles.linkText]} numberOfLines={1}>
                {selectedCinema.contact.website.replace(/^https?:\/\/(www\.)?/, '')}
              </Text>
            </TouchableOpacity>
          )}

          {/* VOSE Support */}
          <View style={styles.selectedCinemaVose}>
            <View style={[
              styles.voseDot,
              { backgroundColor: getMarkerColor(selectedCinema.voseSupport) }
            ]} />
            <Text style={[
              styles.voseText,
              { color: getMarkerColor(selectedCinema.voseSupport) }
            ]}>
              {selectedCinema.voseSupport === 'specialist' ? 'VOSE Specialist' :
               selectedCinema.voseSupport === 'frequent' ? 'Frequent VOSE' :
               selectedCinema.voseSupport === 'occasional' ? 'Occasional VOSE' :
               selectedCinema.voseSupport === 'rare' ? 'Rare VOSE' : 'Unknown'}
            </Text>
          </View>

          {/* Features */}
          {selectedCinema.features && (
            <View style={styles.featuresRow}>
              {selectedCinema.features.imax && (
                <View style={styles.featureChip}>
                  <Ionicons name="film" size={12} color="#4CAF50" />
                  <Text style={styles.featureChipText}>IMAX</Text>
                </View>
              )}
              {selectedCinema.features.dolbyAtmos && (
                <View style={styles.featureChip}>
                  <Ionicons name="volume-high" size={12} color="#4CAF50" />
                  <Text style={styles.featureChipText}>Dolby Atmos</Text>
                </View>
              )}
              {selectedCinema.features.parking && (
                <View style={styles.featureChip}>
                  <Ionicons name="car" size={12} color="#4CAF50" />
                  <Text style={styles.featureChipText}>Parking</Text>
                </View>
              )}
              {selectedCinema.features.restaurant && (
                <View style={styles.featureChip}>
                  <Ionicons name="restaurant" size={12} color="#4CAF50" />
                  <Text style={styles.featureChipText}>Restaurant</Text>
                </View>
              )}
            </View>
          )}

          {/* View Full Details Button */}
          {navigation && (
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => navigation.navigate('CinemaDetail', { cinema: selectedCinema })}
            >
              <Text style={styles.viewDetailsText}>View Full Details</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(74, 158, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userLocationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A9EFF',
  },
  controls: {
    position: 'absolute',
    top: 60,
    right: 20,
    gap: 10,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCinemaInfo: {
    position: 'absolute',
    bottom: 160,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  legendSection: {
    padding: 16,
    paddingBottom: 12,
  },
  legendTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    color: '#fff',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  popupLogo: {
    width: 100,
    height: 32,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  selectedCinemaDetails: {
    color: '#ccc',
    fontSize: 13,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    marginHorizontal: 16,
    gap: 8,
  },
  infoText: {
    color: '#ccc',
    fontSize: 12,
    flex: 1,
  },
  linkText: {
    color: '#4A9EFF',
    textDecorationLine: 'underline',
  },
  selectedCinemaVose: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  voseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  voseText: {
    fontSize: 14,
    fontWeight: '600',
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginHorizontal: 16,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featureChipText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '600',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B9FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 8,
    gap: 8,
  },
  viewDetailsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
