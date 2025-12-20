import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Movie } from '../../types/Movie';
import { RootStackParamList } from '../../types/Navigation';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMovieDetails } from '../../hooks/useMovies';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import TrailerModal from '../../components/common/TrailerModal';

const { width, height } = Dimensions.get('window');

type MovieDetailScreenRouteProp = RouteProp<RootStackParamList, 'MovieDetail'>;
type MovieDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MovieDetail'>;

interface MovieDetailScreenProps {
  route: MovieDetailScreenRouteProp;
  navigation: MovieDetailScreenNavigationProp;
}

export default function MovieDetailScreen({ route, navigation }: MovieDetailScreenProps) {
  const { movie: initialMovie } = route.params;
  const { movie: detailedMovie, loading, error } = useMovieDetails(initialMovie.id);
  const [trailerModalVisible, setTrailerModalVisible] = useState(false);

  // Use detailed movie if available, otherwise fall back to initial movie
  const movie = detailedMovie || initialMovie;

  const formatRuntime = (runtime: number) => {
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return `${hours}h ${minutes}m`;
  };

  const handleWatchTrailer = () => {
    setTrailerModalVisible(true);
  };

  if (loading && !detailedMovie) {
    return <LoadingSpinner message="Loading movie details..." />;
  }

  if (error && !detailedMovie) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => {}}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Backdrop Image with Gradient Overlay */}
        <View style={styles.backdropContainer}>
          {movie.backdrop && (
            <Image source={{ uri: movie.backdrop }} style={styles.backdrop} />
          )}
          <View style={styles.gradientOverlay} />

          {/* Movie Title and Basic Info */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{movie.title}</Text>
            <View style={styles.metaInfo}>
              <Text style={styles.year}>{movie.year}</Text>
              <Text style={styles.rating}>⭐ {movie.rating}/10</Text>
              {movie.runtime && <Text style={styles.runtime}>{formatRuntime(movie.runtime)}</Text>}
            </View>
          </View>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.playButton} onPress={handleWatchTrailer}>
              <Ionicons name="play" size={20} color="#ffffff" />
              <Text style={styles.playButtonText}>Watch Trailer</Text>
            </TouchableOpacity>
          </View>

          {/* VOSE Showtimes Button */}
          <TouchableOpacity
            style={styles.voseButton}
            onPress={() => navigation.navigate('Showtimes', {
              movieTitle: movie.title
            })}
          >
            <Ionicons name="ticket" size={20} color="#ffffff" />
            <Text style={styles.voseButtonText}>Find VOSE Showtimes</Text>
            <View style={styles.voseBadge}>
              <Text style={styles.voseBadgeText}>MALLORCA</Text>
            </View>
          </TouchableOpacity>

          {/* Genres */}
          <View style={styles.genreContainer}>
            {movie.genre?.map((genre, index) => (
              <View key={index} style={styles.genreTag}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>

          {/* Synopsis */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Synopsis</Text>
            <Text style={styles.synopsis}>{movie.synopsis}</Text>
          </View>

          {/* Cast */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cast</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.castContainer}>
                {movie.cast?.map((castMember, index) => (
                  <View key={`cast-${castMember.id}-${index}`} style={styles.castMember}>
                    {castMember.profileImage ? (
                      <Image source={{ uri: castMember.profileImage }} style={styles.castImage} />
                    ) : (
                      <View style={styles.castImagePlaceholder}>
                        <Ionicons name="person" size={30} color="#666666" />
                      </View>
                    )}
                    <Text style={styles.castName}>{castMember.name}</Text>
                    <Text style={styles.castCharacter}>{castMember.character}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Crew */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Crew</Text>
            {movie.crew?.map((crewMember, index) => (
              <View key={`crew-${crewMember.id}-${index}`} style={styles.crewMember}>
                <Text style={styles.crewName}>{crewMember.name}</Text>
                <Text style={styles.crewJob}>{crewMember.job}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Trailer Modal */}
      <TrailerModal
        visible={trailerModalVisible}
        trailerKey={movie.trailerKey}
        movieTitle={movie.title}
        movieYear={movie.year}
        onClose={() => setTrailerModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  scrollView: {
    flex: 1,
  },
  backdropContainer: {
    height: height * 0.6,
    position: 'relative',
  },
  backdrop: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20, 20, 20, 0.6)',
  },
  backButton: {
    position: 'absolute',
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  year: {
    color: '#cccccc',
    fontSize: 16,
    marginRight: 15,
  },
  rating: {
    color: '#ffd700',
    fontSize: 16,
    marginRight: 15,
  },
  runtime: {
    color: '#cccccc',
    fontSize: 16,
  },
  contentContainer: {
    padding: 20,
  },
  actionButtons: {
    marginBottom: 25,
  },
  playButton: {
    flexDirection: 'row',
    backgroundColor: '#e50914',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  voseButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  voseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  voseBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 10,
  },
  voseBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 25,
  },
  genreTag: {
    backgroundColor: '#444444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  synopsis: {
    color: '#cccccc',
    fontSize: 16,
    lineHeight: 24,
  },
  castContainer: {
    flexDirection: 'row',
  },
  castMember: {
    marginRight: 20,
    alignItems: 'center',
    width: 80,
  },
  castImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  castImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  castName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  castCharacter: {
    color: '#888888',
    fontSize: 11,
    textAlign: 'center',
  },
  crewMember: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  crewName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  crewJob: {
    color: '#888888',
    fontSize: 14,
  },
});