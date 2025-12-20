import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Movie } from '../../types/Movie';
import { useVOSEShowtimes } from '../../hooks/useVOSEShowtimes';
import { theme } from '../../styles/theme';

interface VOSETonightSectionProps {
  onPressCinemas: () => void;
  onMoviePress: (movie: Movie) => void;
  onPressViewAll?: () => void;
  navigation?: any;
}

export default function VOSETonightSection({
  onPressCinemas,
  onMoviePress,
  onPressViewAll,
  navigation
}: VOSETonightSectionProps) {
  // Get real VOSE showtimes from scraping system
  const { voseTonightShowtimes, loading, error, refresh, voseCount, totalShowtimes, clearCache } = useVOSEShowtimes();

  // Animated values for scale/pulse animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevMovieCount = useRef(0);
  const prevShowtimeCount = useRef(0);

  // Detect orientation
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const numColumns = isLandscape ? 4 : 1;

  // Debug logging
  console.log('Window dimensions:', { width, height, isLandscape, numColumns });

  const currentHour = new Date().getHours();
  const timeOfDay = currentHour < 18 ? 'Today' : 'Tonight';

  // Group showtimes by movie title and create unique movies
  const uniqueMovies = new Map<string, any>();
  voseTonightShowtimes.forEach(showtime => {
    if (!uniqueMovies.has(showtime.movieTitle)) {
      uniqueMovies.set(showtime.movieTitle, {
        id: showtime.movieTitle.toLowerCase().replace(/\s+/g, '-'),
        title: showtime.movieTitle,
        showtimes: [showtime],
        cinemas: [showtime.cinemaName]
      });
    } else {
      const movie = uniqueMovies.get(showtime.movieTitle)!;
      movie.showtimes.push(showtime);
      if (!movie.cinemas.includes(showtime.cinemaName)) {
        movie.cinemas.push(showtime.cinemaName);
      }
    }
  });

  const voseMovies = Array.from(uniqueMovies.values());

  // Pulse animation when counts change
  useEffect(() => {
    const newMovieCount = voseMovies.length;
    const newShowtimeCount = voseCount;

    if (newMovieCount !== prevMovieCount.current || newShowtimeCount !== prevShowtimeCount.current) {
      // Sequence: scale up, then back down
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.15,
          useNativeDriver: true,
          tension: 100,
          friction: 3,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 7,
        }),
      ]).start();

      prevMovieCount.current = newMovieCount;
      prevShowtimeCount.current = newShowtimeCount;
    }
  }, [voseMovies.length, voseCount]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            <Animated.Text style={{ transform: [{ scale: scaleAnim }] }}>
              {voseMovies.length}
            </Animated.Text>
            {' Total VOSE Movies Found'}
          </Text>
          <View style={{ width: 8 }} />
          {loading && <ActivityIndicator size="small" color={theme.brand.primary} style={styles.loader} />}
          {/* Temporary: Clear cache button to force refresh Aficine data */}
          <TouchableOpacity
            onPress={async () => {
              await clearCache();
              await refresh();
            }}
            style={styles.clearCacheButton}
          >
            <Ionicons name="refresh-circle-outline" size={18} color={theme.text.secondary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          {loading
            ? 'Loading real VOSE showtimes from Mallorca cinemas...'
            : voseMovies.length > 0
            ? <>
                {'with '}
                <Animated.Text style={{ transform: [{ scale: scaleAnim }] }}>
                  {voseCount}
                </Animated.Text>
                {' showtimes available'}
              </>
            : `English movies with Spanish subtitles`}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.brand.error} />
          <Text style={styles.errorTitle}>Could not load showtimes</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : voseMovies.length > 0 ? (
        <View style={styles.movieList}>
          {isLandscape ? (
            // Grid layout for landscape
            (() => {
              const rows = [];
              for (let i = 0; i < voseMovies.length; i += numColumns) {
                rows.push(
                  <View key={`row-${i}`} style={styles.row}>
                    {voseMovies.slice(i, i + numColumns).map((movie, idx) => {
                      const index = i + idx;
                      // Get next showtime
                      const nextShowtime = movie.showtimes.sort((a: any, b: any) =>
                        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                      )[0];
                      const showtime = nextShowtime ? new Date(nextShowtime.startTime) : null;

                      // Get poster from first showtime
                      const posterUrl = movie.showtimes[0]?.posterUrl;
                      const rating = movie.showtimes[0]?.rating;
                      const certification = movie.showtimes[0]?.certification;
                      const genres = movie.showtimes[0]?.genres;

                      return (
                        <TouchableOpacity
                          key={`vose-${movie.id}-${index}`}
                          style={[
                            styles.movieCard,
                            isLandscape && styles.movieCardLandscape
                          ]}
                          onPress={() => navigation?.navigate('Showtimes', { movieTitle: movie.title })}
                        >
                          <View style={isLandscape ? styles.cardContentVertical : styles.cardContent}>
                            {/* Movie Poster */}
                            {posterUrl && (
                              <Image
                                source={{ uri: posterUrl }}
                                style={isLandscape ? styles.posterLandscape : styles.poster}
                                resizeMode="cover"
                              />
                            )}

                            {/* Movie Info */}
                            <View style={isLandscape ? styles.movieDetailsCompact : styles.movieDetails}>
                              {/* Rating Badge - Top Right Corner for Landscape */}
                              {isLandscape && rating ? (
                                <View style={styles.ratingBadgeAbsolute}>
                                  <Ionicons name="star" size={12} color="#FFD700" style={{ marginRight: 3 }} />
                                  <Text style={styles.ratingTextSmall}>{rating.toFixed(1)}</Text>
                                </View>
                              ) : null}

                              <View style={isLandscape ? styles.compactInfo : styles.movieInfo}>
                                <Text style={isLandscape ? styles.movieTitleCompact : styles.movieTitle} numberOfLines={2}>
                                  {movie.title}
                                </Text>

                                {/* Show next showtime */}
                                {showtime && (
                                  <View style={styles.compactTimeBadge}>
                                    <Ionicons name="time-outline" size={12} color={theme.brand.primary} style={{ marginRight: 4 }} />
                                    <Text style={styles.compactTimeText}>
                                      {showtime.toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false
                                      })}
                                    </Text>
                                  </View>
                                )}

                                {/* Showtime count */}
                                <Text style={styles.compactShowtimeCount}>
                                  {movie.showtimes.length} {movie.showtimes.length === 1 ? 'show' : 'shows'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              }
              return rows;
            })()
          ) : (
            // Single column for portrait
            voseMovies.map((movie, index) => {
              // Get next showtime
              const nextShowtime = movie.showtimes.sort((a: any, b: any) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
              )[0];
              const showtime = nextShowtime ? new Date(nextShowtime.startTime) : null;

              // Get poster from first showtime
              const posterUrl = movie.showtimes[0]?.posterUrl;
              const rating = movie.showtimes[0]?.rating;
              const certification = movie.showtimes[0]?.certification;
              const genres = movie.showtimes[0]?.genres;

              return (
                <TouchableOpacity
                  key={`vose-${movie.id}-${index}`}
                  style={styles.movieCard}
                  onPress={() => navigation?.navigate('Showtimes', { movieTitle: movie.title })}
                >
                  <View style={styles.cardContent}>
                    {/* Movie Poster */}
                    {posterUrl && (
                      <Image
                        source={{ uri: posterUrl }}
                        style={styles.poster}
                        resizeMode="cover"
                      />
                    )}

                    {/* Movie Info */}
                    <View style={styles.movieDetails}>
                      {/* Badges Row */}
                      <View style={styles.badgesRow}>
                        <View style={styles.voseBadge}>
                          <Text style={styles.voseBadgeText}>VOSE</Text>
                        </View>
                        {certification && (
                          <View style={styles.certificationBadge}>
                            <Text style={styles.certificationText}>{certification}</Text>
                          </View>
                        )}
                        {showtime && (
                          <View style={styles.timeBadge}>
                            <Ionicons name="time-outline" size={14} color={theme.text.primary} style={{ marginRight: 4 }} />
                            <Text style={styles.timeText}>
                              {showtime.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </Text>
                          </View>
                        )}
                        {rating && (
                          <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={14} color="#FFD700" style={{ marginRight: 4 }} />
                            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                          </View>
                        )}
                      </View>

                      {/* Movie Title */}
                      <Text style={styles.movieTitle} numberOfLines={2}>
                        {movie.title}
                      </Text>

                      {/* Genres */}
                      {genres && (
                        <Text style={styles.genresText} numberOfLines={1}>
                          {genres}
                        </Text>
                      )}

                      {/* Cinema Location */}
                      <View style={styles.cinemaInfo}>
                        <Ionicons name="location" size={14} color={theme.text.secondary} style={{ marginRight: 4 }} />
                        <Text style={styles.movieCinemas} numberOfLines={1}>
                          {movie.cinemas && movie.cinemas.length > 0 ? movie.cinemas.join(' • ') : 'Unknown cinema'}
                        </Text>
                      </View>

                      {/* Showtime Count */}
                      <Text style={styles.showtimeCountText}>
                        {movie.showtimes.length} {movie.showtimes.length === 1 ? 'showtime' : 'showtimes'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      ) : !loading ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#666" />
          <Text style={styles.emptyTitle}>No VOSE showtimes {timeOfDay.toLowerCase()}</Text>
          <Text style={styles.emptySubtitle}>
            We're checking Mallorca cinemas • Try refreshing or check showtimes for other days
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.refreshButton} onPress={refresh}>
              <Ionicons name="refresh" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.browseCinemasButton} onPress={onPressCinemas}>
              <Text style={styles.browseCinemasText}>Browse Cinemas</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  clearCacheButton: {
    padding: theme.spacing.xs,
    backgroundColor: theme.card.backgroundDark,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.card.border,
  },
  title: {
    color: theme.text.primary,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  loader: {
    marginLeft: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: theme.text.secondary,
    lineHeight: 20,
  },
  movieList: {
    paddingHorizontal: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  movieCard: {
    backgroundColor: theme.card.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.card.border,
    overflow: 'hidden',
    ...theme.shadow.medium,
    marginBottom: theme.spacing.md,
  },
  movieCardLandscape: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    maxWidth: '23%',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  voseBadge: {
    backgroundColor: theme.brand.vose,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  voseBadgeText: {
    color: theme.background.primary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(91, 159, 255, 0.2)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  timeText: {
    color: theme.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  temperatureDisplay: {
    alignItems: 'flex-end',
  },
  showtimeCount: {
    color: theme.text.primary,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
  },
  showtimeLabel: {
    color: theme.text.secondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: -4,
  },
  movieTitle: {
    color: theme.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 24,
  },
  cinemaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  movieCinemas: {
    color: theme.text.secondary,
    fontSize: 13,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 40,
    backgroundColor: theme.card.background,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.card.border,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    ...theme.typography.caption,
    color: theme.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  refreshButton: {
    backgroundColor: theme.card.backgroundDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.card.border,
    marginRight: theme.spacing.md,
  },
  refreshButtonText: {
    color: theme.text.primary,
    ...theme.typography.caption,
    fontWeight: '600',
  },
  browseCinemasButton: {
    backgroundColor: theme.brand.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  browseCinemasText: {
    color: theme.text.primary,
    ...theme.typography.caption,
    fontWeight: '600',
  },
  errorState: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 40,
    backgroundColor: theme.card.background,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.brand.error,
  },
  errorTitle: {
    ...theme.typography.h3,
    color: theme.brand.error,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  errorSubtitle: {
    ...theme.typography.caption,
    color: theme.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.brand.error,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  retryText: {
    color: theme.text.primary,
    ...theme.typography.body,
    fontWeight: '600',
  },
  cardContent: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardContentVertical: {
    flexDirection: 'column',
    overflow: 'hidden',
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.card.backgroundDark,
  },
  posterLandscape: {
    width: '100%',
    height: 180,
    backgroundColor: theme.card.backgroundDark,
  },
  movieDetails: {
    flex: 1,
    padding: theme.spacing.md,
  },
  movieDetailsCompact: {
    position: 'relative',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
  },
  showtimeCountText: {
    color: theme.text.secondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  certificationBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#FF8C5A',
  },
  certificationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  genresText: {
    color: theme.text.secondary,
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.8,
    marginBottom: 6,
  },
  // Compact styles for landscape 4-column grid
  compactInfo: {
    padding: theme.spacing.sm,
  },
  movieTitleCompact: {
    color: theme.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 18,
  },
  compactTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  compactTimeText: {
    color: theme.brand.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  compactShowtimeCount: {
    color: theme.text.secondary,
    fontSize: 10,
    fontWeight: '500',
  },
  ratingBadgeAbsolute: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    zIndex: 10,
  },
  ratingTextSmall: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
  },
});