import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Movie } from '../../types/Movie';
import MovieCard from './MovieCard';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onMoviePress: (movie: Movie) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  sectionId?: string;
}

export default function MovieRow({
  title,
  movies,
  onMoviePress,
  loading = false,
  error = null,
  onRetry,
  sectionId = 'default'
}: MovieRowProps) {
  const renderContent = () => {
    if (loading && movies.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#e50914" />
          <Text style={styles.loadingText}>Loading movies...</Text>
        </View>
      );
    }

    if (error && movies.length === 0) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load movies</Text>
          {onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Ionicons name="refresh-outline" size={16} color="#ffffff" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (movies.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No movies available</Text>
        </View>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {movies?.map((movie, index) => (
          <MovieCard
            key={`${sectionId}-${movie.id}-${index}`}
            movie={movie}
            onPress={() => onMoviePress(movie)}
          />
        ))}
        {loading && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color="#e50914" />
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginHorizontal: 20,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#b3b3b3',
    fontSize: 14,
    marginLeft: 8,
  },
  loadingMore: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 200,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#b3b3b3',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e50914',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#b3b3b3',
    fontSize: 14,
    textAlign: 'center',
  },
});