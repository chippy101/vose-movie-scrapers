import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, KeyboardAvoidingView, Platform, Animated, TouchableOpacity, Text, Modal, TextInput, SafeAreaView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Movie } from '../../types/Movie';
import { RootStackParamList, TabParamList } from '../../types/Navigation';
import { useMovieSections, useMovieSearch } from '../../hooks/useMovies';
import MovieRow from '../../components/movie/MovieRow';
import SearchBar from '../../components/common/SearchBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import VOSETonightSection from '../../components/movie/VOSETonightSection';
import { theme } from '../../styles/theme';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [80, 0],
    extrapolate: 'clamp',
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const movieSections = useMovieSections();
  const { query, setQuery, results, loading: searchLoading, error: searchError, clearSearch } = useMovieSearch();

  const handleMoviePress = (movie: Movie) => {
    navigation.navigate('MovieDetail', { movie });
  };

  const handleSearchChange = (text: string) => {
    setQuery(text);
  };

  const handleClearSearch = () => {
    clearSearch();
    setIsSearchModalVisible(false);
  };

  const handlePressCinemas = () => {
    // Navigate to Cinemas tab
    navigation.navigate('Cinemas');
  };

  const handlePressViewAllShowtimes = () => {
    navigation.navigate('Showtimes');
  };

  const handleOpenSearch = () => {
    setIsSearchModalVisible(true);
  };

  const handleCloseSearch = () => {
    setIsSearchModalVisible(false);
    clearSearch();
  };

  // Pull-to-refresh functionality
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    // Refresh movie sections
    try {
      await movieSections.nowPlaying.refresh();
    } catch (error) {
      console.error('Error refreshing movie data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [movieSections.nowPlaying.refresh]);

  // Show loading state if any critical sections are loading
  const isInitialLoading = movieSections.nowPlaying.loading && movieSections.nowPlaying.movies.length === 0;

  if (isInitialLoading) {
    return <LoadingSpinner message="Loading VOSE movies..." />;
  }

  // Show error state if now playing movies failed to load and no cached data
  if (movieSections.nowPlaying.error && movieSections.nowPlaying.movies.length === 0) {
    return (
      <ErrorMessage
        message={movieSections.nowPlaying.error}
        onRetry={movieSections.nowPlaying.refresh}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={theme.background.gradient}
        style={styles.container}
        locations={[0, 0.5, 1]}
      >
        {/* Animated Header with Logo and Search Icon */}
        <Animated.View
          style={[
            styles.header,
            {
              height: headerHeight,
              opacity: headerOpacity,
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/popcornpal_v2.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleOpenSearch}
          >
            <Ionicons name="search" size={24} color={theme.text.primary} />
          </TouchableOpacity>
        </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.brand.primary}
            colors={[theme.brand.primary]}
            progressBackgroundColor={theme.card.background}
          />
        }
      >
        <VOSETonightSection
          onPressCinemas={handlePressCinemas}
          onMoviePress={handleMoviePress}
          onPressViewAll={handlePressViewAllShowtimes}
          navigation={navigation}
        />
      </Animated.ScrollView>

      {/* Search Modal */}
      <Modal
        visible={isSearchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseSearch}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={theme.background.gradient}
            style={styles.modalContent}
            locations={[0, 0.5, 1]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Movies</Text>
              <TouchableOpacity onPress={handleCloseSearch}>
                <Ionicons name="close" size={28} color={theme.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBarWrapper}>
              <SearchBar
                value={query}
                onChangeText={handleSearchChange}
                onClear={handleClearSearch}
                placeholder="Search VOSE movies..."
                autoFocus={true}
              />
            </View>

            <ScrollView
              style={styles.searchResultsScroll}
              contentContainerStyle={styles.searchResultsContent}
              showsVerticalScrollIndicator={false}
            >
              {searchLoading ? (
                <LoadingSpinner message="Searching movies..." />
              ) : searchError ? (
                <ErrorMessage message={searchError} />
              ) : query.length > 0 ? (
                <MovieRow
                  title={`Search Results (${results.length})`}
                  movies={results}
                  onMoviePress={(movie) => {
                    handleMoviePress(movie);
                    handleCloseSearch();
                  }}
                  sectionId="search"
                />
              ) : (
                <View style={styles.emptySearchState}>
                  <Ionicons name="search-outline" size={64} color={theme.text.secondary} />
                  <Text style={styles.emptySearchText}>Start typing to search for movies</Text>
                </View>
              )}
            </ScrollView>
          </LinearGradient>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 40,
    paddingBottom: theme.spacing.md,
    backgroundColor: 'rgba(26, 29, 58, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: theme.card.border,
    overflow: 'hidden',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoImage: {
    width: 200,
    height: 56,
  },
  searchButton: {
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(30, 33, 60, 0.8)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(91, 159, 255, 0.3)',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : theme.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.card.border,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text.primary,
  },
  searchBarWrapper: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  searchResultsScroll: {
    flex: 1,
  },
  searchResultsContent: {
    paddingBottom: theme.spacing.xl,
  },
  emptySearchState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: theme.spacing.lg,
  },
  emptySearchText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.text.secondary,
    textAlign: 'center',
  },
});