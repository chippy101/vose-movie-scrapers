/**
 * Web version of CinemaMapView
 * Maps are not supported on web, so we show a fallback message
 */
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Cinema } from '../../types/Cinema';

interface CinemaMapViewProps {
  onCinemaPress: (cinema: Cinema) => void;
  selectedCinema?: Cinema | null;
}

export default function CinemaMapView({ onCinemaPress, selectedCinema }: CinemaMapViewProps) {
  return (
    <View style={styles.webFallbackContainer}>
      <Ionicons name="map-outline" size={64} color="#666" />
      <Text style={styles.webFallbackTitle}>Map View Not Available</Text>
      <Text style={styles.webFallbackText}>
        Interactive maps are only available on iOS and Android devices.
      </Text>
      <Text style={styles.webFallbackText}>
        Please use the list view to browse cinemas.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  webFallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 40,
  },
  webFallbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  webFallbackText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
});
