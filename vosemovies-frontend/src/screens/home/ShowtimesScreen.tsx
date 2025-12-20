import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ImageBackground,
  Modal,
  Linking,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScrapedShowtime } from '../../types/Cinema';
import { useVOSEShowtimes } from '../../hooks/useVOSEShowtimes';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import TrailerModal from '../../components/common/TrailerModal';
import { theme } from '../../styles/theme';

interface ShowtimesScreenProps {
  navigation: any;
  route?: {
    params?: {
      movieTitle?: string;
      cinemaName?: string;
    };
  };
}

type ViewMode = 'calendar' | 'list';

export default function ShowtimesScreen({ navigation, route }: ShowtimesScreenProps) {
  const { movieTitle, cinemaName } = route?.params || {};
  const { showtimes, loading, error, refresh, lastUpdated } = useVOSEShowtimes();

  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [posterModalVisible, setPosterModalVisible] = useState(false);
  const [trailerModalVisible, setTrailerModalVisible] = useState(false);
  const [selectedCinema, setSelectedCinema] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [externalLinkModalVisible, setExternalLinkModalVisible] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  // Detect orientation
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const numColumns = isLandscape ? 3 : 1;

  // Get unique dates and cinemas from showtimes
  const { availableDates, availableCinemas } = useMemo(() => {
    const dates = new Set<string>();
    const cinemas = new Set<string>();

    showtimes.forEach(showtime => {
      const date = new Date(showtime.startTime).toISOString().split('T')[0];
      dates.add(date);
      cinemas.add(showtime.cinemaName);
    });

    return {
      availableDates: Array.from(dates).sort(),
      availableCinemas: Array.from(cinemas).sort(),
    };
  }, [showtimes]);

  // Filter showtimes based on current filters
  const filteredShowtimes = useMemo(() => {
    return showtimes.filter(showtime => {
      // Movie title filter (from navigation)
      if (movieTitle && !showtime.movieTitle.toLowerCase().includes(movieTitle.toLowerCase())) {
        return false;
      }

      // Cinema filter (from navigation or dropdown)
      const activeCinema = cinemaName || (selectedCinema !== 'all' ? selectedCinema : null);
      if (activeCinema && !showtime.cinemaName.toLowerCase().includes(activeCinema.toLowerCase())) {
        return false;
      }

      // Only show VOSE
      return showtime.isVOSE;
    });
  }, [showtimes, movieTitle, cinemaName, selectedCinema]);

  // Group showtimes by date for calendar view
  const groupedByDate = useMemo(() => {
    const grouped: { [date: string]: ScrapedShowtime[] } = {};

    filteredShowtimes.forEach(showtime => {
      const date = new Date(showtime.startTime).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(showtime);
    });

    // Sort showtimes within each date
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    return grouped;
  }, [filteredShowtimes]);

  // Group showtimes by movie for list view
  const groupedByMovie = useMemo(() => {
    const grouped: { [movie: string]: ScrapedShowtime[] } = {};

    filteredShowtimes.forEach(showtime => {
      if (!grouped[showtime.movieTitle]) {
        grouped[showtime.movieTitle] = [];
      }
      grouped[showtime.movieTitle].push(showtime);
    });

    // Sort showtimes within each movie
    Object.keys(grouped).forEach(movie => {
      grouped[movie].sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    });

    return grouped;
  }, [filteredShowtimes]);

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const isShowtimePast = (showtimeDate: Date): boolean => {
    const now = new Date();
    return new Date(showtimeDate).getTime() < now.getTime();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const showtimeDate = new Date(date);
    showtimeDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((showtimeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get movie details from first showtime (they all have same metadata)
  const movieDetails = useMemo(() => {
    if (filteredShowtimes.length === 0) return null;
    const first = filteredShowtimes[0];
    return {
      title: first.movieTitle,
      posterUrl: first.posterUrl,
      backdropUrl: first.backdropUrl,
      overview: first.overview,
      rating: first.rating,
      releaseYear: first.releaseYear,
      runtime: first.runtime,
      genres: first.genres,
      certification: first.certification,
      trailerKey: first.trailerKey,
      director: first.director,
      castMembers: first.castMembers || first.cast_members, // Support both naming conventions
    };
  }, [filteredShowtimes]);

  const handleWatchTrailer = () => {
    setTrailerModalVisible(true);
  };

  const handleShowtimePress = (url: string) => {
    if (!url) {
      Alert.alert(
        'Booking Unavailable',
        'Sorry, booking information is not available for this showtime.',
        [{ text: 'OK' }]
      );
      return;
    }
    setPendingUrl(url);
    setExternalLinkModalVisible(true);
  };

  const handleConfirmExternalLink = async () => {
    if (!pendingUrl) return;

    try {
      const supported = await Linking.canOpenURL(pendingUrl);
      if (supported) {
        await Linking.openURL(pendingUrl);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open the booking page');
    } finally {
      setExternalLinkModalVisible(false);
      setPendingUrl(null);
    }
  };

  const handleCancelExternalLink = () => {
    setExternalLinkModalVisible(false);
    setPendingUrl(null);
  };

  const renderMovieHeader = () => {
    if (!movieTitle || !movieDetails) return null;

    return (
      <View style={styles.movieHeaderContainer}>
        {/* Backdrop Image */}
        {movieDetails.backdropUrl ? (
          <ImageBackground
            source={{ uri: movieDetails.backdropUrl }}
            style={styles.backdrop}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)', '#141414']}
              style={styles.backdropGradient}
            />
          </ImageBackground>
        ) : null}

        {/* Movie Info */}
        <View style={styles.movieInfoSection}>
          <View style={styles.movieInfoContent}>
            {/* Poster */}
            {movieDetails.posterUrl ? (
              <TouchableOpacity onPress={() => setPosterModalVisible(true)}>
                <Image
                  source={{ uri: movieDetails.posterUrl }}
                  style={styles.moviePoster}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : null}

            {/* Title and Meta */}
            <View style={styles.movieMeta}>
              <Text style={styles.movieMainTitle} numberOfLines={2}>
                {movieDetails.title}
              </Text>

              <View style={styles.metaRow}>
                {movieDetails.certification ? (
                  <View style={styles.certificationBadge}>
                    <Text style={styles.certificationBadgeText}>{movieDetails.certification}</Text>
                  </View>
                ) : null}
                {movieDetails.rating ? (
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#FFD700" style={{ marginRight: 4 }} />
                    <Text style={styles.ratingText}>{movieDetails.rating.toFixed(1)}</Text>
                  </View>
                ) : null}
                {movieDetails.releaseYear ? (
                  <Text style={styles.metaText}>{movieDetails.releaseYear}</Text>
                ) : null}
                {movieDetails.runtime ? (
                  <Text style={styles.metaText}>{movieDetails.runtime} min</Text>
                ) : null}
              </View>

              {movieDetails.genres ? (
                <Text style={styles.genresText} numberOfLines={1}>
                  {movieDetails.genres}
                </Text>
              ) : null}

              {/* Trailer Button */}
              <TouchableOpacity
                style={styles.trailerButton}
                onPress={handleWatchTrailer}
              >
                <Ionicons name="play-circle" size={20} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.trailerButtonText}>Watch Trailer</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Overview & Cast Section - Combined */}
          {(movieDetails.overview || movieDetails.director || movieDetails.castMembers) && (
            <View style={styles.overviewContainer}>
              {/* Overview */}
              {movieDetails.overview && (
                <>
                  <Text style={styles.overviewTitle}>Overview</Text>
                  <Text
                    style={styles.overviewText}
                    numberOfLines={isOverviewExpanded ? undefined : 3}
                  >
                    {movieDetails.overview}
                  </Text>

                  {movieDetails.overview.length > 150 && (
                    <TouchableOpacity
                      onPress={() => setIsOverviewExpanded(!isOverviewExpanded)}
                      style={styles.readMoreButton}
                    >
                      <Text style={styles.readMoreText}>
                        {isOverviewExpanded ? 'Show less' : 'Read more'}
                      </Text>
                      <Ionicons
                        name={isOverviewExpanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color="#4A90E2"
                        style={{ marginLeft: 4 }}
                      />
                    </TouchableOpacity>
                  )}
                </>
              )}

              {/* Cast & Crew - Compact Version */}
              {(movieDetails.director || movieDetails.castMembers) && (
                <View style={styles.castCrewCompact}>
                  {movieDetails.director && (
                    <View style={styles.crewItem}>
                      <Ionicons name="megaphone" size={14} color="#FF6B35" style={{ marginRight: 6 }} />
                      <Text style={styles.crewLabel}>Director: </Text>
                      <Text style={styles.crewValue}>{movieDetails.director}</Text>
                    </View>
                  )}

                  {movieDetails.castMembers && (
                    <View style={styles.crewItem}>
                      <Ionicons name="star" size={14} color="#FFD700" style={{ marginRight: 6 }} />
                      <Text style={styles.crewLabel}>Cast: </Text>
                      <Text style={styles.crewValue} numberOfLines={2}>{movieDetails.castMembers}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Showtimes Header */}
          <View style={styles.showtimesHeaderSection}>
            <Text style={styles.showtimesHeaderTitle}>Showtimes</Text>
            <Text style={styles.showtimesHeaderCount}>
              {filteredShowtimes.length} showing{filteredShowtimes.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderShowtimeCard = (showtime: ScrapedShowtime, index: number) => (
    <View
      key={`${showtime.movieTitle}-${showtime.startTime}-${index}`}
      style={[
        styles.showtimeCard,
        isLandscape && styles.showtimeCardLandscape
      ]}
    >
      <View style={styles.showtimeHeader}>
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={18} color="#e50914" style={{ marginRight: 6 }} />
          <Text style={styles.showtimeTime}>{formatTime(showtime.startTime)}</Text>
        </View>

        {viewMode === 'list' && (
          <Text style={styles.dateText}>
            {formatDate(new Date(showtime.startTime).toISOString().split('T')[0])}
          </Text>
        )}
      </View>

      {viewMode === 'calendar' && (
        <Text style={styles.movieTitle}>{showtime.movieTitle}</Text>
      )}

      <View style={styles.cinemaRow}>
        <Ionicons name="location-outline" size={14} color="#888" style={{ marginRight: 6 }} />
        <Text style={styles.cinemaName}>{showtime.cinemaName}</Text>
      </View>

      <View style={styles.locationRow}>
        <Ionicons name="navigate-outline" size={14} color="#666" style={{ marginRight: 6 }} />
        <Text style={styles.location}>{showtime.cinemaLocation}</Text>
        <View style={styles.islandBadge}>
          <Text style={styles.islandText}>{showtime.island}</Text>
        </View>
      </View>

      <View style={styles.voseBadge}>
        <Text style={styles.voseText}>VOSE</Text>
      </View>
    </View>
  );

  const renderCalendarView = () => {
    const sortedDates = Object.keys(groupedByDate).sort();

    return (
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#e50914" />
        }
      >
        {/* Date Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dateSelector}
          contentContainerStyle={styles.dateSelectorContent}
        >
          {availableDates.map(date => (
            <TouchableOpacity
              key={date}
              style={[
                styles.dateButton,
                selectedDate === date && styles.dateButtonActive
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[
                styles.dateButtonText,
                selectedDate === date && styles.dateButtonTextActive
              ]}>
                {formatDate(date)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {sortedDates.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#666" />
            <Text style={styles.emptyTitle}>No showtimes found</Text>
            <Text style={styles.emptySubtitle}>
              {movieTitle ? `No VOSE showtimes for "${movieTitle}"` : 'Try selecting a different date'}
            </Text>
          </View>
        ) : (
          sortedDates.map(date => (
            <View key={date} style={styles.dateSection}>
              <View style={styles.dateSectionHeader}>
                <Text style={styles.dateSectionTitle}>{formatDate(date)}</Text>
                <Text style={styles.dateSectionCount}>
                  {groupedByDate[date].length} showtime{groupedByDate[date].length !== 1 ? 's' : ''}
                </Text>
              </View>

              <View style={styles.showtimesContainer}>
                {isLandscape ? (
                  // Grid layout for landscape
                  (() => {
                    const showtimes = groupedByDate[date];
                    const rows = [];
                    for (let i = 0; i < showtimes.length; i += numColumns) {
                      rows.push(
                        <View key={`row-${i}`} style={styles.row}>
                          {showtimes.slice(i, i + numColumns).map((showtime, idx) =>
                            renderShowtimeCard(showtime, i + idx)
                          )}
                        </View>
                      );
                    }
                    return rows;
                  })()
                ) : (
                  // Single column for portrait
                  groupedByDate[date].map((showtime, index) => renderShowtimeCard(showtime, index))
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderListView = () => {
    const movies = Object.keys(groupedByMovie).sort();

    return (
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#e50914" />
        }
      >
        {/* Cinema Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.cinemaSelector}
          contentContainerStyle={styles.cinemaSelectorContent}
        >
          <TouchableOpacity
            style={[
              styles.cinemaButton,
              selectedCinema === 'all' && styles.cinemaButtonActive
            ]}
            onPress={() => setSelectedCinema('all')}
          >
            <Text style={[
              styles.cinemaButtonText,
              selectedCinema === 'all' && styles.cinemaButtonTextActive
            ]}>
              All Cinemas
            </Text>
          </TouchableOpacity>

          {availableCinemas.map(cinema => (
            <TouchableOpacity
              key={cinema}
              style={[
                styles.cinemaButton,
                selectedCinema === cinema && styles.cinemaButtonActive
              ]}
              onPress={() => setSelectedCinema(cinema)}
            >
              <Text style={[
                styles.cinemaButtonText,
                selectedCinema === cinema && styles.cinemaButtonTextActive
              ]}>
                {cinema}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {movies.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="film-outline" size={64} color="#666" />
            <Text style={styles.emptyTitle}>No showtimes found</Text>
            <Text style={styles.emptySubtitle}>
              {movieTitle ? `No VOSE showtimes for "${movieTitle}"` : 'Try refreshing or selecting a different cinema'}
            </Text>
          </View>
        ) : (
          movies.map(movie => (
            <View key={movie} style={styles.movieSection}>
              <View style={styles.movieSectionHeader}>
                <Text style={styles.movieSectionTitle}>{movie}</Text>
                <Text style={styles.movieSectionCount}>
                  {groupedByMovie[movie].length} showing{groupedByMovie[movie].length !== 1 ? 's' : ''}
                </Text>
              </View>

              <View style={styles.showtimesContainer}>
                {isLandscape ? (
                  // Grid layout for landscape
                  (() => {
                    const showtimes = groupedByMovie[movie];
                    const rows = [];
                    for (let i = 0; i < showtimes.length; i += numColumns) {
                      rows.push(
                        <View key={`row-${i}`} style={styles.row}>
                          {showtimes.slice(i, i + numColumns).map((showtime, idx) =>
                            renderShowtimeCard(showtime, i + idx)
                          )}
                        </View>
                      );
                    }
                    return rows;
                  })()
                ) : (
                  // Single column for portrait
                  groupedByMovie[movie].map((showtime, index) => renderShowtimeCard(showtime, index))
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  if (loading && showtimes.length === 0) {
    return <LoadingSpinner message="Loading VOSE showtimes..." />;
  }

  if (error && showtimes.length === 0) {
    return (
      <ErrorMessage
        message={error}
        onRetry={refresh}
      />
    );
  }

  return (
    <LinearGradient
      colors={theme.background.gradient}
      style={styles.container}
      locations={[0, 0.5, 1]}
    >
      {/* Simple Header for Movie View */}
      {!movieTitle && (
        // Full Header for All Showtimes View
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.title}>VOSE Showtimes</Text>
              <Text style={styles.subtitle}>
                {filteredShowtimes.length} showtime{filteredShowtimes.length !== 1 ? 's' : ''} found
              </Text>
            </View>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refresh}
              disabled={loading}
            >
              <Ionicons name="refresh" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* View Mode Toggle */}
          <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'calendar' && styles.toggleButtonActive
            ]}
            onPress={() => setViewMode('calendar')}
          >
            <Ionicons
              name="calendar"
              size={18}
              color={viewMode === 'calendar' ? '#fff' : '#888'}
              style={{ marginRight: 6 }}
            />
            <Text style={[
              styles.toggleButtonText,
              viewMode === 'calendar' && styles.toggleButtonTextActive
            ]}>
              Calendar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'list' && styles.toggleButtonActive
            ]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons
              name="list"
              size={18}
              color={viewMode === 'list' ? '#fff' : '#888'}
              style={{ marginRight: 6 }}
            />
            <Text style={[
              styles.toggleButtonText,
              viewMode === 'list' && styles.toggleButtonTextActive
            ]}>
              List
            </Text>
          </TouchableOpacity>
        </View>

          {lastUpdated && (
            <Text style={styles.lastUpdated}>
              Last updated: {new Date(lastUpdated).toLocaleTimeString()}
            </Text>
          )}
        </View>
      )}

      {/* Content */}
      {movieTitle ? (
        // Simple calendar view for specific movie - Full page scroll
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#e50914" />
          }
        >
          {/* Movie Header (when viewing specific movie) */}
          {renderMovieHeader()}

          {filteredShowtimes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#666" />
              <Text style={styles.emptyTitle}>No showtimes found</Text>
              <Text style={styles.emptySubtitle}>
                No VOSE showtimes available for this movie
              </Text>
            </View>
          ) : (
            // Show all dates with showtimes grouped by date, then by cinema
            Object.keys(groupedByDate).sort().map(date => (
              <View key={date}>
                {/* Group showtimes by cinema for this date */}
                {Object.entries(
                  groupedByDate[date].reduce((acc, showtime) => {
                    if (!acc[showtime.cinemaName]) {
                      acc[showtime.cinemaName] = [];
                    }
                    acc[showtime.cinemaName].push(showtime);
                    return acc;
                  }, {} as { [cinema: string]: ScrapedShowtime[] })
                ).map(([cinema, showtimes]) => (
                  <View key={`${date}-${cinema}`} style={styles.cinemaSection}>
                    {/* Combined Date + Cinema Header */}
                    <View style={styles.combinedHeader}>
                      <View style={styles.combinedHeaderTop}>
                        <Text style={styles.combinedHeaderDate}>{formatDate(date)}</Text>
                        <Text style={styles.combinedHeaderCinema}>{cinema}</Text>
                      </View>
                      <Text style={styles.combinedHeaderFullDate}>
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </Text>
                    </View>

                    {/* Showtimes for this cinema */}
                    <View style={styles.cinemaShowtimesContainer}>
                      <View style={styles.versionBadge}>
                        <Text style={styles.versionText}>Original version (Spanish subtitles)</Text>
                      </View>

                      <View style={styles.timesRow}>
                        {showtimes.map((showtime, index) => {
                          const isPast = isShowtimePast(showtime.startTime);
                          return (
                            <TouchableOpacity
                              key={`${showtime.startTime}-${index}`}
                              style={[
                                styles.timeButton,
                                isPast && styles.timeButtonPast
                              ]}
                              disabled={isPast}
                              onPress={() => handleShowtimePress(showtime.url)}
                            >
                              <Text style={[
                                styles.timeButtonText,
                                isPast && styles.timeButtonTextPast
                              ]}>
                                {formatTime(showtime.startTime)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        // Full view with calendar/list toggle
        viewMode === 'calendar' ? renderCalendarView() : renderListView()
      )}

      {/* Poster Modal */}
      <Modal
        visible={posterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPosterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPosterModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setPosterModalVisible(false)}
            >
              <Ionicons name="close-circle" size={40} color="#fff" />
            </TouchableOpacity>
            {movieDetails?.posterUrl && (
              <Image
                source={{ uri: movieDetails.posterUrl }}
                style={styles.modalPoster}
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Trailer Modal */}
      <TrailerModal
        visible={trailerModalVisible}
        trailerKey={movieDetails?.trailerKey}
        movieTitle={movieDetails?.title}
        movieYear={movieDetails?.releaseYear}
        onClose={() => setTrailerModalVisible(false)}
      />

      {/* External Link Confirmation Modal */}
      <Modal
        visible={externalLinkModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelExternalLink}
      >
        <View style={styles.externalLinkModalOverlay}>
          <View style={styles.externalLinkModalContent}>
            <View style={styles.externalLinkIconContainer}>
              <Ionicons name="open-outline" size={48} color="#4A90E2" />
            </View>

            <Text style={styles.externalLinkTitle}>Leaving Popcorn Pal</Text>
            <Text style={styles.externalLinkMessage}>
              You're about to open the cinema's booking page in your browser. This will take you outside the app.
            </Text>

            <View style={styles.externalLinkButtons}>
              <TouchableOpacity
                style={styles.externalLinkCancelButton}
                onPress={handleCancelExternalLink}
              >
                <Text style={styles.externalLinkCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.externalLinkConfirmButton}
                onPress={handleConfirmExternalLink}
              >
                <Text style={styles.externalLinkConfirmText}>Continue</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#1f1f1f',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingTop: 50,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
  },
  refreshButton: {
    padding: 8,
  },
  viewModeToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#141414',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#e50914',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  lastUpdated: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    paddingBottom: 12,
  },
  content: {
    flex: 1,
  },
  dateSelector: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dateSelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1f1f1f',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  dateButtonActive: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  dateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  dateButtonTextActive: {
    color: '#fff',
  },
  cinemaSelector: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  cinemaSelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cinemaButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1f1f1f',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  cinemaButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  cinemaButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  cinemaButtonTextActive: {
    color: '#fff',
  },
  dateSection: {
    marginBottom: 24,
  },
  dateSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1f1f1f',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dateSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  dateSectionCount: {
    fontSize: 13,
    color: '#888',
  },
  movieSection: {
    marginBottom: 24,
  },
  movieSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1f1f1f',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  movieSectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  movieSectionCount: {
    fontSize: 13,
    color: '#888',
  },
  showtimesContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  row: {
    justifyContent: 'space-between',
  },
  showtimeCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
    position: 'relative',
  },
  showtimeCardLandscape: {
    flex: 1,
    marginHorizontal: 4,
    maxWidth: '31%',
  },
  showtimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  showtimeTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e50914',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  cinemaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cinemaName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  islandBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  islandText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  voseBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  voseText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  simpleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  movieHeaderContainer: {
    marginBottom: 0,
  },
  backdrop: {
    width: '100%',
    height: 180,
    marginTop: 60,
  },
  backdropGradient: {
    flex: 1,
  },
  movieInfoSection: {
    marginTop: -60,
    paddingHorizontal: 16,
  },
  movieInfoContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  moviePoster: {
    width: 100,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#1f1f1f',
    borderWidth: 2,
    borderColor: '#333',
  },
  movieMeta: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  movieMainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  metaText: {
    fontSize: 14,
    color: '#aaa',
    marginRight: 12,
  },
  genresText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  trailerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e50914',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  trailerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  overviewContainer: {
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  overviewText: {
    fontSize: 13,
    color: '#ccc',
    lineHeight: 20,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  readMoreText: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '600',
  },
  // Cast & Crew Compact Styles
  castCrewCompact: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  crewItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  crewLabel: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '600',
  },
  crewValue: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    fontWeight: '400',
    lineHeight: 18,
  },
  showtimesHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 0,
  },
  showtimesHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  showtimesHeaderCount: {
    fontSize: 13,
    color: '#888',
  },
  certificationBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FF8C5A',
  },
  certificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: -50,
    right: 10,
    zIndex: 10,
  },
  modalPoster: {
    width: '100%',
    height: '100%',
  },
  // Cinema-grouped layout styles
  cinemaSection: {
    marginBottom: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  combinedHeader: {
    backgroundColor: 'rgba(74, 144, 226, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  combinedHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  combinedHeaderDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5AA9E6',
  },
  combinedHeaderCinema: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  combinedHeaderFullDate: {
    fontSize: 13,
    color: '#888',
  },
  cinemaShowtimesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
  },
  versionBadge: {
    marginBottom: 10,
  },
  versionText: {
    fontSize: 13,
    color: '#bbb',
    fontStyle: 'italic',
    opacity: 0.9,
  },
  timesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeButton: {
    backgroundColor: '#00BCD4',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 75,
    alignItems: 'center',
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  timeButtonPast: {
    backgroundColor: '#3a3a3a',
    opacity: 0.6,
  },
  timeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  timeButtonTextPast: {
    color: '#888',
  },
  // External Link Modal Styles
  externalLinkModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  externalLinkModalContent: {
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  externalLinkIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  externalLinkTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  externalLinkMessage: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  externalLinkButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  externalLinkCancelButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  externalLinkCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  externalLinkConfirmButton: {
    flex: 1,
    backgroundColor: '#00BCD4',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  externalLinkConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
