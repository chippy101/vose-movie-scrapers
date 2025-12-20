import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Cinema } from '../../types/Cinema';
import { theme } from '../../styles/theme';

interface CinemaDetailScreenProps {
  route: {
    params: {
      cinema: Cinema;
    };
  };
  navigation: any;
}

export default function CinemaDetailScreen({ route, navigation }: CinemaDetailScreenProps) {
  const { cinema } = route.params;

  const openMaps = () => {
    const { lat, lng } = cinema.location;
    // Use z=16 for a good street-level zoom (range: 1-20, where 20 is closest)
    const url = `https://maps.google.com/?q=${lat},${lng}&z=16`;
    Linking.openURL(url);
  };

  const openWebsite = () => {
    if (cinema.contact?.website) {
      Linking.openURL(cinema.contact.website);
    }
  };

  const callCinema = () => {
    if (cinema.contact?.phone) {
      Linking.openURL(`tel:${cinema.contact.phone}`);
    }
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

  const getVOSESupportDescription = (support: Cinema['voseSupport']): string => {
    switch (support) {
      case 'specialist': return 'This cinema specializes in original version screenings and regularly shows English movies with Spanish subtitles.';
      case 'frequent': return 'This cinema frequently shows movies in VOSE, especially for popular English films.';
      case 'occasional': return 'This cinema occasionally shows VOSE screenings, typically for blockbuster releases.';
      case 'rare': return 'This cinema rarely shows VOSE, but may have occasional English language screenings.';
      default: return 'VOSE availability at this cinema is unknown.';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
      <View style={styles.header}>
        {cinema.logoUrl && (
          <Image
            source={{ uri: cinema.logoUrl }}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.cinemaName}>{cinema.name}</Text>
          <View style={styles.chainContainer}>
            <Ionicons name="business" size={16} color="#888" />
            <Text style={styles.chainText}>{cinema.chain}</Text>
          </View>
        </View>

        <View style={[styles.voseContainer, { backgroundColor: getVOSESupportColor(cinema.voseSupport) + '20' }]}>
          <View style={[styles.voseDot, { backgroundColor: getVOSESupportColor(cinema.voseSupport) }]} />
          <Text style={[styles.voseText, { color: getVOSESupportColor(cinema.voseSupport) }]}>
            {getVOSESupportText(cinema.voseSupport)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>VOSE Information</Text>
        <Text style={styles.voseDescription}>
          {getVOSESupportDescription(cinema.voseSupport)}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={20} color="#888" />
          <View style={styles.locationDetails}>
            <Text style={styles.locationText}>{cinema.location.address}</Text>
            <Text style={styles.locationText}>
              {cinema.location.city}, {cinema.location.postalCode}
            </Text>
            <Text style={styles.locationText}>{cinema.location.region}</Text>
          </View>
        </View>

        {cinema.location.landmarks && cinema.location.landmarks.length > 0 && (
          <View style={styles.landmarksContainer}>
            <Text style={styles.landmarksTitle}>Nearby landmarks:</Text>
            {cinema.location.landmarks?.map((landmark, index) => (
              <Text key={index} style={styles.landmarkText}>• {landmark}</Text>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.actionButton} onPress={openMaps}>
          <Ionicons name="map" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Open in Maps</Text>
        </TouchableOpacity>
      </View>

      {cinema.ticketPricing && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ticket Pricing</Text>
          <View style={styles.pricingContainer}>
            <Text style={styles.regularPrice}>
              Regular: €{cinema.ticketPricing.regular.toFixed(2)}
            </Text>
            {cinema.ticketPricing.discounts?.map((discount, index) => (
              <View key={index} style={styles.discountContainer}>
                <Text style={styles.discountDay}>{discount.day}:</Text>
                <Text style={styles.discountPrice}>€{discount.price.toFixed(2)}</Text>
                {discount.description && (
                  <Text style={styles.discountDescription}>({discount.description})</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {cinema.features && Object.values(cinema.features).some(Boolean) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresContainer}>
            {cinema.features.imax && (
              <View style={styles.featureItem}>
                <Ionicons name="tv" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>IMAX</Text>
              </View>
            )}
            {cinema.features.dolbyAtmos && (
              <View style={styles.featureItem}>
                <Ionicons name="volume-high" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Dolby Atmos</Text>
              </View>
            )}
            {cinema.features.parking && (
              <View style={styles.featureItem}>
                <Ionicons name="car" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Parking Available</Text>
              </View>
            )}
            {cinema.features.restaurant && (
              <View style={styles.featureItem}>
                <Ionicons name="restaurant" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Restaurant</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {cinema.contact && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          {cinema.contact.phone && (
            <TouchableOpacity style={styles.contactButton} onPress={callCinema}>
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.contactButtonText}>{cinema.contact.phone}</Text>
            </TouchableOpacity>
          )}
          {cinema.contact.website && (
            <TouchableOpacity style={styles.contactButton} onPress={openWebsite}>
              <Ionicons name="globe" size={20} color="#fff" />
              <Text style={styles.contactButtonText}>Visit Website</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Source</Text>
        <Text style={styles.sourceText}>
          Source: {cinema.source} • Last updated: {cinema.lastUpdated}
        </Text>
        <Text style={styles.verificationText}>
          Verification: {cinema.verificationStatus === 'verified' ? '✅ Verified' :
                         cinema.verificationStatus === 'pending' ? '⏳ Pending' : '⚠️ Needs Update'}
        </Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 16,
  },
  titleContainer: {
    marginBottom: 12,
  },
  cinemaName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  chainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chainText: {
    fontSize: 16,
    color: '#888',
    marginLeft: 6,
  },
  voseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
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
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  voseDescription: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationDetails: {
    marginLeft: 10,
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 4,
  },
  landmarksContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  landmarksTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 6,
  },
  landmarkText: {
    fontSize: 14,
    color: '#aaa',
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'theme.brand.primary',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pricingContainer: {
    marginTop: 8,
  },
  regularPrice: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  discountDay: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
    minWidth: 80,
  },
  discountPrice: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginRight: 8,
  },
  discountDescription: {
    fontSize: 14,
    color: '#888',
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#ccc',
    marginLeft: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card.backgroundDark,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  sourceText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  verificationText: {
    fontSize: 14,
    color: '#888',
  },
});