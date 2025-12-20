import React from 'react';
import { View, StyleSheet, Text, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Movie } from '../../types/Movie';
import { RootStackParamList } from '../../types/Navigation';
import { useMovieSearch } from '../../hooks/useMovies';
import SearchBar from '../../components/common/SearchBar';
import MovieCard from '../../components/movie/MovieCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { theme } from '../../styles/theme';

type SearchScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SearchScreen() {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const { query, setQuery, results, loading, error, clearSearch } = useMovieSearch();

  const handleMoviePress = (movie: Movie) => {
    navigation.navigate('MovieDetail', { movie });
  };

  const renderMovieItem = ({ item, index }: { item: Movie; index: number }) => (
    <View style={styles.movieItem}>
      <MovieCard movie={item} onPress={() => handleMoviePress(item)} />
    </View>
  );

  const renderContent = () => {
    if (!query.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Search Movies</Text>
          <Text style={styles.emptySubtitle}>
            Find English movies perfect for VOSE (Original Version with Spanish Subtitles) showings in Spain
          </Text>
        </View>
      );
    }

    if (loading) {
      return <LoadingSpinner message="Searching movies..." />;
    }

    if (error) {
      return <ErrorMessage message={error} onRetry={() => setQuery(query)} />;
    }

    if (results.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No movies found</Text>
          <Text style={styles.emptySubtitle}>
            Try searching with different keywords or check your spelling
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={results}
        renderItem={renderMovieItem}
        keyExtractor={(item, index) => `search-${item.id}-${index}`}
        numColumns={2}
        contentContainerStyle={styles.moviesList}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <LinearGradient
      colors={theme.background.gradient}
      style={styles.container}
      locations={[0, 0.5, 1]}
    >
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onClear={clearSearch}
        placeholder="Search English movies for VOSE..."
      />
      {renderContent()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  moviesList: {
    padding: theme.spacing.md,
  },
  movieItem: {
    flex: 1,
    margin: theme.spacing.sm,
    maxWidth: '50%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    ...theme.typography.h2,
    color: theme.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  emptySubtitle: {
    ...theme.typography.body,
    color: theme.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});