import { CinesaScraper } from './CinesaScraper';
import { YelmoScraper } from './YelmoScraper';
import { KinepolisScraper } from './KinepolisScraper';
import { MajorcaDailyBulletinScraper } from './MajorcaDailyBulletinScraper';
import { EnhancedVOSEDetector } from './EnhancedVOSEDetector';
import { ScrapedShowtime, ScrapingSource } from '../../types/Cinema';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RefreshConfig {
  // Scheduling
  intervalHours: number;
  maxRunTime: number; // Maximum time allowed per refresh cycle (ms)

  // Source configuration
  enabledSources: ScrapingSource[];
  priority: ScrapingSource[]; // Order of scraping priority

  // Rate limiting
  globalRateLimit: number; // ms between scraper calls
  sourceSpecificLimits: Record<ScrapingSource, number>;

  // Data management
  maxStorageEntries: number;
  cleanupOldDataAfterDays: number;
  validateDataAccuracy: boolean;

  // Error handling
  maxRetries: number;
  backoffMultiplier: number;
  failureNotificationThreshold: number;
}

export interface RefreshResult {
  success: boolean;
  timestamp: Date;
  totalShowtimes: number;
  sourceResults: Record<ScrapingSource, {
    success: boolean;
    showtimes: number;
    errors: string[];
    duration: number;
  }>;
  errors: string[];
  performanceMetrics: {
    totalDuration: number;
    averageResponseTime: number;
    successRate: number;
    voseAccuracyScore: number;
  };
  cacheStatus: {
    updated: boolean;
    size: number;
    oldestEntry: Date;
    newestEntry: Date;
  };
}

export class AutomatedDataRefreshSystem {
  private scrapers: Record<ScrapingSource, any>;
  private voseDetector: EnhancedVOSEDetector;
  private config: RefreshConfig;
  private isRefreshing: boolean = false;
  private refreshInterval: NodeJS.Timeout | null = null;
  private lastRefresh: Date | null = null;

  // Storage keys
  private readonly STORAGE_KEYS = {
    SHOWTIMES: 'vose_showtimes_cache',
    LAST_REFRESH: 'vose_last_refresh',
    REFRESH_HISTORY: 'vose_refresh_history',
    ERROR_LOG: 'vose_error_log',
    PERFORMANCE_STATS: 'vose_performance_stats'
  };

  constructor(config?: Partial<RefreshConfig>) {
    this.config = {
      intervalHours: 8, // Refresh every 8 hours
      maxRunTime: 900000, // 15 minutes max
      enabledSources: ['Cinesa', 'Yelmo', 'Kinépolis', 'MajorcaDailyBulletin'],
      priority: ['Cinesa', 'Yelmo', 'Kinépolis', 'MajorcaDailyBulletin'],
      globalRateLimit: 5000, // 5 seconds between sources
      sourceSpecificLimits: {
        'Cinesa': 3000,
        'Yelmo': 2500,
        'Kinépolis': 3500,
        'MajorcaDailyBulletin': 2000,
        'CineCiutat': 1500,
        'EuroWeeklyNews': 2000,
        'Manual': 0,
        'Ocimax': 2000
      },
      maxStorageEntries: 10000,
      cleanupOldDataAfterDays: 7,
      validateDataAccuracy: true,
      maxRetries: 3,
      backoffMultiplier: 2,
      failureNotificationThreshold: 3,
      ...config
    };

    this.scrapers = {
      'Cinesa': new CinesaScraper(),
      'Yelmo': new YelmoScraper(),
      'Kinépolis': new KinepolisScraper(),
      'MajorcaDailyBulletinScraper': new MajorcaDailyBulletinScraper()
    };

    this.voseDetector = new EnhancedVOSEDetector();
  }

  /**
   * Start the automated refresh system
   */
  async startAutomatedRefresh(): Promise<void> {
    if (this.refreshInterval) {
      console.log('[DataRefresh] Automated refresh already running');
      return;
    }

    console.log(`[DataRefresh] Starting automated refresh every ${this.config.intervalHours} hours`);

    // Initial refresh
    await this.performFullRefresh();

    // Schedule recurring refreshes
    this.refreshInterval = setInterval(async () => {
      try {
        await this.performFullRefresh();
      } catch (error) {
        console.error('[DataRefresh] Scheduled refresh failed:', error);
        await this.logError('scheduled_refresh_failed', error);
      }
    }, this.config.intervalHours * 60 * 60 * 1000);
  }

  /**
   * Stop the automated refresh system
   */
  stopAutomatedRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('[DataRefresh] Automated refresh stopped');
    }
  }

  /**
   * Perform a full data refresh from all enabled sources
   */
  async performFullRefresh(): Promise<RefreshResult> {
    if (this.isRefreshing) {
      throw new Error('Refresh already in progress');
    }

    this.isRefreshing = true;
    const startTime = Date.now();

    console.log('[DataRefresh] Starting full refresh cycle');

    const result: RefreshResult = {
      success: false,
      timestamp: new Date(),
      totalShowtimes: 0,
      sourceResults: {},
      errors: [],
      performanceMetrics: {
        totalDuration: 0,
        averageResponseTime: 0,
        successRate: 0,
        voseAccuracyScore: 0
      },
      cacheStatus: {
        updated: false,
        size: 0,
        oldestEntry: new Date(),
        newestEntry: new Date()
      }
    };

    try {
      // 1. Clean up old data first
      await this.cleanupOldData();

      // 2. Scrape each enabled source in priority order
      const allShowtimes: ScrapedShowtime[] = [];
      const responseTimes: number[] = [];

      for (const source of this.config.priority) {
        if (!this.config.enabledSources.includes(source)) {
          continue;
        }

        const sourceStartTime = Date.now();

        try {
          console.log(`[DataRefresh] Scraping ${source}...`);

          const sourceResult = await this.scrapeSource(source);
          const sourceDuration = Date.now() - sourceStartTime;

          result.sourceResults[source] = {
            success: sourceResult.success,
            showtimes: sourceResult.data.length,
            errors: sourceResult.errors,
            duration: sourceDuration
          };

          if (sourceResult.success) {
            allShowtimes.push(...sourceResult.data);
            responseTimes.push(sourceDuration);
            console.log(`[DataRefresh] ${source}: ${sourceResult.data.length} showtimes in ${sourceDuration}ms`);
          } else {
            result.errors.push(`${source} failed: ${sourceResult.errors.join(', ')}`);
            console.error(`[DataRefresh] ${source} failed:`, sourceResult.errors);
          }

          // Rate limiting between sources
          await this.sleep(this.config.sourceSpecificLimits[source] || this.config.globalRateLimit);

        } catch (error) {
          const sourceDuration = Date.now() - sourceStartTime;
          result.sourceResults[source] = {
            success: false,
            showtimes: 0,
            errors: [error instanceof Error ? error.message : String(error)],
            duration: sourceDuration
          };
          result.errors.push(`${source} exception: ${error}`);
          console.error(`[DataRefresh] ${source} exception:`, error);
        }

        // Check timeout
        if (Date.now() - startTime > this.config.maxRunTime) {
          result.errors.push('Refresh timeout reached, stopping early');
          console.warn('[DataRefresh] Timeout reached, stopping refresh');
          break;
        }
      }

      // 3. Process and validate scraped data
      const processedShowtimes = await this.processScrapedData(allShowtimes);

      // 4. Update cache
      await this.updateCache(processedShowtimes);

      // 5. Calculate performance metrics
      const totalDuration = Date.now() - startTime;
      const successfulSources = Object.values(result.sourceResults).filter(r => r.success).length;
      const totalSources = Object.keys(result.sourceResults).length;

      result.totalShowtimes = processedShowtimes.length;
      result.performanceMetrics = {
        totalDuration,
        averageResponseTime: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b) / responseTimes.length : 0,
        successRate: totalSources > 0 ? successfulSources / totalSources : 0,
        voseAccuracyScore: await this.calculateVOSEAccuracy(processedShowtimes)
      };

      // 6. Update cache status
      result.cacheStatus = await this.getCacheStatus();

      result.success = result.totalShowtimes > 0 && result.errors.length < this.config.failureNotificationThreshold;

      // 7. Save refresh history
      await this.saveRefreshHistory(result);

      this.lastRefresh = new Date();
      await AsyncStorage.setItem(this.STORAGE_KEYS.LAST_REFRESH, this.lastRefresh.toISOString());

      console.log(`[DataRefresh] Refresh completed: ${result.totalShowtimes} showtimes in ${totalDuration}ms`);

    } catch (error) {
      result.errors.push(`Refresh failed: ${error}`);
      result.success = false;
      console.error('[DataRefresh] Full refresh failed:', error);
      await this.logError('full_refresh_failed', error);
    } finally {
      this.isRefreshing = false;
      result.performanceMetrics.totalDuration = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Scrape a specific source with retry logic
   */
  private async scrapeSource(source: ScrapingSource, attempt: number = 1): Promise<any> {
    try {
      const scraper = this.scrapers[source];
      if (!scraper) {
        throw new Error(`No scraper available for ${source}`);
      }

      return await scraper.scrapeShowtimes();

    } catch (error) {
      if (attempt < this.config.maxRetries) {
        const backoffTime = 1000 * Math.pow(this.config.backoffMultiplier, attempt - 1);
        console.log(`[DataRefresh] ${source} attempt ${attempt} failed, retrying in ${backoffTime}ms`);

        await this.sleep(backoffTime);
        return this.scrapeSource(source, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Process and enhance scraped data
   */
  private async processScrapedData(showtimes: ScrapedShowtime[]): Promise<ScrapedShowtime[]> {
    const processed: ScrapedShowtime[] = [];

    for (const showtime of showtimes) {
      try {
        // Re-analyze with enhanced VOSE detector
        const enhancedResult = this.voseDetector.detectVOSE(
          showtime.rawText,
          undefined,
          showtime.movieTitle
        );

        // Update VOSE detection results
        const enhancedShowtime: ScrapedShowtime = {
          ...showtime,
          isVOSE: enhancedResult.isVOSE,
          confidence: enhancedResult.confidence,
          language: enhancedResult.detectedLanguage,
          verificationStatus: enhancedResult.confidence > 0.8 ? 'confirmed' :
                            enhancedResult.confidence > 0.6 ? 'pending' : 'rejected'
        };

        // Data validation
        if (this.config.validateDataAccuracy && this.isValidShowtime(enhancedShowtime)) {
          processed.push(enhancedShowtime);
        } else if (!this.config.validateDataAccuracy) {
          processed.push(enhancedShowtime);
        }

      } catch (error) {
        console.error(`[DataRefresh] Failed to process showtime:`, error);
      }
    }

    // Remove duplicates
    return this.removeDuplicateShowtimes(processed);
  }

  /**
   * Validate a showtime entry
   */
  private isValidShowtime(showtime: ScrapedShowtime): boolean {
    // Basic validation rules
    if (!showtime.movieTitle || showtime.movieTitle.trim().length < 2) {
      return false;
    }

    if (!showtime.cinemaName || showtime.cinemaName.trim().length < 3) {
      return false;
    }

    if (!showtime.startTime || isNaN(showtime.startTime.getTime())) {
      return false;
    }

    // Check if showtime is in the future (not too far past)
    const now = new Date();
    const maxPastHours = 6; // Allow up to 6 hours in the past
    const minPastTime = new Date(now.getTime() - (maxPastHours * 60 * 60 * 1000));

    if (showtime.startTime < minPastTime) {
      return false;
    }

    // Check if showtime is not too far in the future (max 2 weeks)
    const maxFutureTime = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
    if (showtime.startTime > maxFutureTime) {
      return false;
    }

    return true;
  }

  /**
   * Remove duplicate showtimes
   */
  private removeDuplicateShowtimes(showtimes: ScrapedShowtime[]): ScrapedShowtime[] {
    const uniqueShowtimes = new Map<string, ScrapedShowtime>();

    for (const showtime of showtimes) {
      // Create a unique key based on movie, cinema, and time
      const key = `${showtime.movieTitle.toLowerCase()}_${showtime.cinemaName.toLowerCase()}_${showtime.startTime.getTime()}`;

      // Keep the one with higher confidence
      const existing = uniqueShowtimes.get(key);
      if (!existing || showtime.confidence > existing.confidence) {
        uniqueShowtimes.set(key, showtime);
      }
    }

    return Array.from(uniqueShowtimes.values());
  }

  /**
   * Update the local cache with new showtime data
   */
  private async updateCache(showtimes: ScrapedShowtime[]): Promise<void> {
    try {
      // Get existing cache
      const existingData = await this.getCachedShowtimes();

      // Merge with new data (new data takes precedence)
      const mergedData = [...showtimes];

      // Add existing data that's still valid and not replaced
      for (const existing of existingData) {
        const isDuplicate = showtimes.some(newShowtime =>
          newShowtime.movieTitle.toLowerCase() === existing.movieTitle.toLowerCase() &&
          newShowtime.cinemaName.toLowerCase() === existing.cinemaName.toLowerCase() &&
          Math.abs(newShowtime.startTime.getTime() - existing.startTime.getTime()) < 60000 // Within 1 minute
        );

        if (!isDuplicate && this.isValidShowtime(existing)) {
          mergedData.push(existing);
        }
      }

      // Sort by start time and limit entries
      const sortedData = mergedData
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
        .slice(0, this.config.maxStorageEntries);

      await AsyncStorage.setItem(this.STORAGE_KEYS.SHOWTIMES, JSON.stringify(sortedData));
      console.log(`[DataRefresh] Cache updated with ${sortedData.length} showtimes`);

    } catch (error) {
      console.error('[DataRefresh] Failed to update cache:', error);
      await this.logError('cache_update_failed', error);
    }
  }

  /**
   * Get cached showtimes
   */
  async getCachedShowtimes(): Promise<ScrapedShowtime[]> {
    try {
      const cachedData = await AsyncStorage.getItem(this.STORAGE_KEYS.SHOWTIMES);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        // Convert date strings back to Date objects
        return parsed.map((showtime: any) => ({
          ...showtime,
          startTime: new Date(showtime.startTime),
          endTime: showtime.endTime ? new Date(showtime.endTime) : undefined,
          scrapedAt: new Date(showtime.scrapedAt),
          lastVerified: showtime.lastVerified ? new Date(showtime.lastVerified) : undefined
        }));
      }
    } catch (error) {
      console.error('[DataRefresh] Failed to get cached showtimes:', error);
    }
    return [];
  }

  /**
   * Clean up old data
   */
  private async cleanupOldData(): Promise<void> {
    try {
      const cachedData = await this.getCachedShowtimes();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.cleanupOldDataAfterDays);

      const filteredData = cachedData.filter(showtime =>
        showtime.startTime > cutoffDate || showtime.scrapedAt > cutoffDate
      );

      if (filteredData.length < cachedData.length) {
        await AsyncStorage.setItem(this.STORAGE_KEYS.SHOWTIMES, JSON.stringify(filteredData));
        console.log(`[DataRefresh] Cleaned up ${cachedData.length - filteredData.length} old entries`);
      }

    } catch (error) {
      console.error('[DataRefresh] Failed to cleanup old data:', error);
    }
  }

  /**
   * Calculate VOSE detection accuracy
   */
  private async calculateVOSEAccuracy(showtimes: ScrapedShowtime[]): Promise<number> {
    if (showtimes.length === 0) return 0;

    const highConfidenceCount = showtimes.filter(s => s.confidence > 0.8).length;
    const totalCount = showtimes.length;

    return totalCount > 0 ? highConfidenceCount / totalCount : 0;
  }

  /**
   * Get cache status information
   */
  private async getCacheStatus(): Promise<RefreshResult['cacheStatus']> {
    const cachedData = await this.getCachedShowtimes();

    if (cachedData.length === 0) {
      return {
        updated: false,
        size: 0,
        oldestEntry: new Date(),
        newestEntry: new Date()
      };
    }

    const sortedByDate = cachedData.sort((a, b) => a.scrapedAt.getTime() - b.scrapedAt.getTime());

    return {
      updated: true,
      size: cachedData.length,
      oldestEntry: sortedByDate[0].scrapedAt,
      newestEntry: sortedByDate[sortedByDate.length - 1].scrapedAt
    };
  }

  /**
   * Save refresh history for analytics
   */
  private async saveRefreshHistory(result: RefreshResult): Promise<void> {
    try {
      const history = await this.getRefreshHistory();
      history.push({
        timestamp: result.timestamp,
        success: result.success,
        showtimes: result.totalShowtimes,
        duration: result.performanceMetrics.totalDuration,
        errors: result.errors.length
      });

      // Keep only last 50 refresh records
      const limitedHistory = history.slice(-50);

      await AsyncStorage.setItem(this.STORAGE_KEYS.REFRESH_HISTORY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('[DataRefresh] Failed to save refresh history:', error);
    }
  }

  /**
   * Get refresh history
   */
  async getRefreshHistory(): Promise<any[]> {
    try {
      const historyData = await AsyncStorage.getItem(this.STORAGE_KEYS.REFRESH_HISTORY);
      return historyData ? JSON.parse(historyData) : [];
    } catch (error) {
      console.error('[DataRefresh] Failed to get refresh history:', error);
      return [];
    }
  }

  /**
   * Log errors for debugging
   */
  private async logError(type: string, error: any): Promise<void> {
    try {
      const errorLog = {
        timestamp: new Date(),
        type,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      };

      const existingLogs = await this.getErrorLogs();
      existingLogs.push(errorLog);

      // Keep only last 100 error logs
      const limitedLogs = existingLogs.slice(-100);

      await AsyncStorage.setItem(this.STORAGE_KEYS.ERROR_LOG, JSON.stringify(limitedLogs));
    } catch (logError) {
      console.error('[DataRefresh] Failed to log error:', logError);
    }
  }

  /**
   * Get error logs
   */
  async getErrorLogs(): Promise<any[]> {
    try {
      const logsData = await AsyncStorage.getItem(this.STORAGE_KEYS.ERROR_LOG);
      return logsData ? JSON.parse(logsData) : [];
    } catch (error) {
      console.error('[DataRefresh] Failed to get error logs:', error);
      return [];
    }
  }

  /**
   * Get system status and statistics
   */
  async getSystemStatus(): Promise<{
    isRunning: boolean;
    lastRefresh: Date | null;
    nextRefresh: Date | null;
    cacheSize: number;
    errorCount: number;
    successRate: number;
  }> {
    const history = await this.getRefreshHistory();
    const errors = await this.getErrorLogs();
    const cached = await this.getCachedShowtimes();

    const recentHistory = history.slice(-10);
    const successCount = recentHistory.filter(h => h.success).length;
    const successRate = recentHistory.length > 0 ? successCount / recentHistory.length : 0;

    const nextRefresh = this.lastRefresh
      ? new Date(this.lastRefresh.getTime() + (this.config.intervalHours * 60 * 60 * 1000))
      : null;

    return {
      isRunning: this.refreshInterval !== null,
      lastRefresh: this.lastRefresh,
      nextRefresh,
      cacheSize: cached.length,
      errorCount: errors.length,
      successRate
    };
  }

  /**
   * Force a manual refresh
   */
  async forceRefresh(): Promise<RefreshResult> {
    console.log('[DataRefresh] Manual refresh requested');
    return this.performFullRefresh();
  }

  /**
   * Utility: Sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}