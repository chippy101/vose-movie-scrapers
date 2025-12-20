import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScrapingOrchestrator } from '../../services/scraping/orchestration/ScrapingOrchestrator';
import { ScrapedShowtime } from '../../types/Cinema';

export default function ScrapingTestScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showtimes, setShowtimes] = useState<ScrapedShowtime[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runScrapingTest = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    setShowtimes([]);

    try {
      console.log('🎬 Starting scraping test...');

      const orchestrator = new ScrapingOrchestrator();

      // Start with MajorcaDailyBulletin only (proven to work)
      const result = await orchestrator.executeFullScraping(['MajorcaDailyBulletin']);

      console.log('✅ Scraping completed:', result);

      setResults({
        totalShowtimes: result.totalShowtimes,
        successfulSources: result.performanceMetrics.successfulSources,
        failedSources: result.performanceMetrics.failedSources,
        duration: result.performanceMetrics.totalDuration,
        errors: result.errors.length,
      });

      // Get the showtimes from sourceResults
      const allShowtimes: ScrapedShowtime[] = [];
      Object.values(result.sourceResults).forEach(sourceResult => {
        // Note: sourceResults don't contain the actual showtimes, only counts
        // You would need to modify the orchestrator to return actual showtimes if needed
      });
      setShowtimes(allShowtimes.slice(0, 20)); // Show first 20

    } catch (err: any) {
      console.error('❌ Scraping failed:', err);
      setError(err.message || 'Scraping failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testSystemHealth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const orchestrator = new ScrapingOrchestrator();
      const health = await orchestrator.getSystemHealth();

      setResults({
        systemHealth: health.overallHealthy ? 'Healthy' : 'Unhealthy',
        sources: Object.entries(health.sourceHealth).map(([name, status]) => ({
          name,
          healthy: status.isHealthy,
          successRate: (status.successRate * 100).toFixed(1) + '%',
        })),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎬 Scraping Test</Text>
        <Text style={styles.subtitle}>
          Test the web scraping system for VOSE showtimes
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Actions</Text>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runScrapingTest}
          disabled={isLoading}
        >
          <Ionicons name="download" size={20} color="#fff" />
          <Text style={styles.buttonText}>
            {isLoading ? 'Scraping...' : 'Run Scraping Test'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={testSystemHealth}
          disabled={isLoading}
        >
          <Ionicons name="pulse" size={20} color="#fff" />
          <Text style={styles.buttonText}>Check System Health</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e50914" />
          <Text style={styles.loadingText}>
            Scraping cinema websites...
          </Text>
          <Text style={styles.loadingSubtext}>
            This may take 10-30 seconds
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={40} color="#e50914" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {results && !isLoading && (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsTitleContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.resultsTitle}>Results</Text>
          </View>

          {results.totalShowtimes !== undefined && (
            <>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Total Showtimes:</Text>
                <Text style={styles.statValue}>{results.totalShowtimes}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Successful Sources:</Text>
                <Text style={styles.statValue}>{results.successfulSources}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Failed Sources:</Text>
                <Text style={styles.statValue}>{results.failedSources}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Duration:</Text>
                <Text style={styles.statValue}>{results.duration}ms</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Errors:</Text>
                <Text style={styles.statValue}>{results.errors}</Text>
              </View>
            </>
          )}

          {results.systemHealth && (
            <View style={styles.healthSection}>
              <Text style={styles.healthTitle}>
                System Health: {results.systemHealth}
              </Text>
              {results.sources?.map((source: any, index: number) => (
                <View key={index} style={styles.sourceRow}>
                  <Ionicons
                    name={source.healthy ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={source.healthy ? '#4CAF50' : '#e50914'}
                  />
                  <Text style={styles.sourceName}>{source.name}</Text>
                  <Text style={styles.sourceRate}>{source.successRate}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {showtimes.length > 0 && (
        <View style={styles.showtimesContainer}>
          <Text style={styles.showtimesTitle}>
            📽️ Scraped Showtimes ({showtimes.length})
          </Text>

          {showtimes.map((showtime, index) => (
            <View key={index} style={styles.showtimeCard}>
              <View style={styles.showtimeHeader}>
                <Text style={styles.movieTitle}>{showtime.movieTitle}</Text>
                {showtime.isVOSE && (
                  <View style={styles.voseBadge}>
                    <Text style={styles.voseBadgeText}>VOSE</Text>
                  </View>
                )}
              </View>

              <View style={styles.showtimeDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="business" size={14} color="#888" />
                  <Text style={styles.detailText}>{showtime.cinemaName}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="time" size={14} color="#888" />
                  <Text style={styles.detailText}>
                    {new Date(showtime.startTime).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="language" size={14} color="#888" />
                  <Text style={styles.detailText}>{showtime.language}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="analytics" size={14} color="#888" />
                  <Text style={styles.detailText}>
                    Confidence: {(showtime.confidence * 100).toFixed(0)}%
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="document" size={14} color="#888" />
                  <Text style={styles.detailText}>Source: {showtime.source}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>ℹ️ About This Test</Text>
        <Text style={styles.infoText}>
          This test scrapes the Majorca Daily Bulletin website for VOSE (English
          with Spanish subtitles) movie showtimes across Mallorca cinemas.
        </Text>
        <Text style={styles.infoText}>
          • CineCiutat (VOSE specialist){'\n'}
          • Ocimax{'\n'}
          • Cinesa Festival Park{'\n'}
          • Other Mallorca cinemas
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    lineHeight: 22,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#e50914',
  },
  secondaryButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  loadingSubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    color: '#e50914',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  errorText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  resultsContainer: {
    margin: 20,
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  resultsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statLabel: {
    color: '#ccc',
    fontSize: 16,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  healthSection: {
    marginTop: 20,
  },
  healthTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sourceName: {
    color: '#ccc',
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  sourceRate: {
    color: '#888',
    fontSize: 14,
  },
  showtimesContainer: {
    padding: 20,
  },
  showtimesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  showtimeCard: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  showtimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  voseBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  voseBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  showtimeDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 8,
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    margin: 20,
    borderRadius: 8,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});
