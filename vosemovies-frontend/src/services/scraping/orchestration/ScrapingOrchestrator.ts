import { MajorcaDailyBulletinScraper } from '../scrapers/MajorcaDailyBulletinScraper';
import { AficineScraper } from '../scrapers/AficineScraper';
import { CineCiutatScraper } from '../scrapers/CineCiutatScraper';
import { CinesMoixNegreScraper } from '../scrapers/CinesMoixNegreScraper';
import { EnhancedVOSEDetector } from '../detectors/EnhancedVOSEDetector';
import { DataValidationSystem } from '../../validation/DataValidationSystem';
import { ScrapedShowtime, ScrapingSource } from '../../../types/Cinema';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScrapingError {
  source: ScrapingSource;
  error: Error | string;
  timestamp: Date;
  attemptNumber: number;
  recoverable: boolean;
  context?: Record<string, any>;
}

export interface CircuitBreakerState {
  source: ScrapingSource;
  failures: number;
  lastFailure: Date | null;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  nextAttempt: Date | null;
}

export interface HealthStatus {
  source: ScrapingSource;
  isHealthy: boolean;
  responseTime: number;
  successRate: number;
  lastCheck: Date;
  issues: string[];
}

export interface ScrapingResult {
  success: boolean;
  totalShowtimes: number;
  showtimes: ScrapedShowtime[]; // Actual showtime data
  sourceResults: Partial<Record<ScrapingSource, {
    success: boolean;
    showtimes: number;
    errors: ScrapingError[];
    responseTime: number;
    healthStatus: HealthStatus;
  }>>;
  errors: ScrapingError[];
  validationReport?: any;
  performanceMetrics: {
    totalDuration: number;
    averageResponseTime: number;
    successfulSources: number;
    failedSources: number;
  };
}

export class ScrapingOrchestrator {
  private scrapers: Partial<Record<ScrapingSource, any>>;
  private voseDetector: EnhancedVOSEDetector;
  private validator: DataValidationSystem;
  private circuitBreakers: Map<ScrapingSource, CircuitBreakerState>;
  private healthStatuses: Map<ScrapingSource, HealthStatus>;

  // Error handling configuration
  private readonly errorConfig = {
    maxRetries: 3,
    retryDelay: 2000, // Base delay in ms
    backoffMultiplier: 2,
    maxDelay: 30000, // Max delay in ms
    circuitBreakerThreshold: 5, // Failures before opening circuit
    circuitBreakerTimeout: 300000, // 5 minutes before trying again
    healthCheckInterval: 600000, // 10 minutes between health checks
  };

  // Storage keys
  private readonly STORAGE_KEYS = {
    CIRCUIT_BREAKERS: 'scraping_circuit_breakers',
    HEALTH_STATUS: 'scraping_health_status',
    ERROR_LOG: 'scraping_error_log',
    PERFORMANCE_METRICS: 'scraping_performance'
  };

  constructor() {
    this.scrapers = {
      // Active scrapers for Balearic Islands
      'Aficine': new AficineScraper(),              // 6 cinemas across all islands
      'CineCiutat': new CineCiutatScraper(),        // VOSE specialist in Palma
      'MajorcaDailyBulletin': new MajorcaDailyBulletinScraper(), // Curated VOSE listings
      'CinesMoixNegre': new CinesMoixNegreScraper() // Menorca independent
    } as Partial<Record<ScrapingSource, any>>;

    this.voseDetector = new EnhancedVOSEDetector();
    this.validator = new DataValidationSystem();
    this.circuitBreakers = new Map();
    this.healthStatuses = new Map();

    this.initializeErrorHandling();
  }

  /**
   * Initialize error handling systems
   */
  private async initializeErrorHandling(): Promise<void> {
    // Load circuit breaker states from storage
    await this.loadCircuitBreakerStates();

    // Load health statuses
    await this.loadHealthStatuses();

    // Initialize circuit breakers for all sources
    Object.keys(this.scrapers).forEach(source => {
      if (!this.circuitBreakers.has(source as ScrapingSource)) {
        this.circuitBreakers.set(source as ScrapingSource, {
          source: source as ScrapingSource,
          failures: 0,
          lastFailure: null,
          state: 'CLOSED',
          nextAttempt: null
        });
      }
    });

    console.log('[ScrapingOrchestrator] Error handling initialized');
  }

  /**
   * Execute comprehensive scraping with full error handling
   */
  async executeFullScraping(sources?: ScrapingSource[]): Promise<ScrapingResult> {
    const startTime = Date.now();
    const sourcesToScrape = sources || Object.keys(this.scrapers) as ScrapingSource[];

    console.log(`[ScrapingOrchestrator] Starting scraping for sources: ${sourcesToScrape.join(', ')}`);

    const result: ScrapingResult = {
      success: false,
      totalShowtimes: 0,
      showtimes: [],
      sourceResults: {},
      errors: [],
      performanceMetrics: {
        totalDuration: 0,
        averageResponseTime: 0,
        successfulSources: 0,
        failedSources: 0
      }
    };

    const allShowtimes: ScrapedShowtime[] = [];
    const responseTimes: number[] = [];

    // Scrape each source with comprehensive error handling
    for (const source of sourcesToScrape) {
      const sourceStartTime = Date.now();

      try {
        console.log(`[ScrapingOrchestrator] Processing source: ${source}`);

        // Check circuit breaker
        if (!this.canAttemptScraping(source)) {
          const error: ScrapingError = {
            source,
            error: 'Circuit breaker is OPEN - source temporarily unavailable',
            timestamp: new Date(),
            attemptNumber: 0,
            recoverable: true,
            context: { circuitBreakerState: this.circuitBreakers.get(source)?.state }
          };

          result.sourceResults[source] = {
            success: false,
            showtimes: 0,
            errors: [error],
            responseTime: 0,
            healthStatus: this.getHealthStatus(source)
          };

          result.errors.push(error);
          console.warn(`[ScrapingOrchestrator] Skipping ${source} - circuit breaker open`);
          continue;
        }

        // Attempt scraping with retries
        const sourceResult = await this.scrapeWithRetries(source);
        const responseTime = Date.now() - sourceStartTime;

        if (sourceResult.success) {
          // Success - reset circuit breaker
          this.recordSuccess(source);

          allShowtimes.push(...sourceResult.data);
          responseTimes.push(responseTime);

          result.sourceResults[source] = {
            success: true,
            showtimes: sourceResult.data.length,
            errors: [],
            responseTime,
            healthStatus: this.updateHealthStatus(source, true, responseTime)
          };

          console.log(`[ScrapingOrchestrator] ${source}: ${sourceResult.data.length} showtimes in ${responseTime}ms`);

        } else {
          // Failure - record for circuit breaker
          const scrapingErrors = sourceResult.errors.map((errorMsg: string) => ({
            source,
            error: errorMsg,
            timestamp: new Date(),
            attemptNumber: this.errorConfig.maxRetries,
            recoverable: this.isRecoverableError(errorMsg),
            context: { finalAttempt: true }
          } as ScrapingError));

          this.recordFailure(source);

          result.sourceResults[source] = {
            success: false,
            showtimes: 0,
            errors: scrapingErrors,
            responseTime,
            healthStatus: this.updateHealthStatus(source, false, responseTime, sourceResult.errors)
          };

          result.errors.push(...scrapingErrors);
          console.error(`[ScrapingOrchestrator] ${source} failed after retries:`, sourceResult.errors);
        }

      } catch (exception) {
        const responseTime = Date.now() - sourceStartTime;
        const error: ScrapingError = {
          source,
          error: exception instanceof Error ? exception : String(exception),
          timestamp: new Date(),
          attemptNumber: 0,
          recoverable: this.isRecoverableError(String(exception)),
          context: { exception: true }
        };

        this.recordFailure(source);

        result.sourceResults[source] = {
          success: false,
          showtimes: 0,
          errors: [error],
          responseTime,
          healthStatus: this.updateHealthStatus(source, false, responseTime, [String(exception)])
        };

        result.errors.push(error);
        console.error(`[ScrapingOrchestrator] ${source} exception:`, exception);
      }
    }

    // Process and validate all scraped data
    let processedShowtimes = allShowtimes;

    try {
      const validationResult = await this.validator.validateShowtimes(allShowtimes);
      processedShowtimes = validationResult.validatedShowtimes;
      result.validationReport = validationResult.report;

      console.log(`[ScrapingOrchestrator] Validation: ${processedShowtimes.length}/${allShowtimes.length} showtimes passed`);

    } catch (validationError) {
      const error: ScrapingError = {
        source: 'Manual' as ScrapingSource, // System error
        error: `Validation failed: ${validationError}`,
        timestamp: new Date(),
        attemptNumber: 1,
        recoverable: false,
        context: { validationError: true }
      };
      result.errors.push(error);
      console.error('[ScrapingOrchestrator] Validation failed:', validationError);
    }

    // Calculate performance metrics
    const totalDuration = Date.now() - startTime;
    const successfulSources = Object.values(result.sourceResults).filter(r => r.success).length;
    const failedSources = Object.values(result.sourceResults).length - successfulSources;

    result.totalShowtimes = processedShowtimes.length;
    result.showtimes = processedShowtimes; // Add actual showtimes to result
    result.performanceMetrics = {
      totalDuration,
      averageResponseTime: responseTimes.length > 0 ?
        responseTimes.reduce((a, b) => a + b) / responseTimes.length : 0,
      successfulSources,
      failedSources
    };

    result.success = successfulSources > 0 && result.totalShowtimes > 0;

    // Save state and metrics
    await this.saveCircuitBreakerStates();
    await this.saveHealthStatuses();
    await this.logErrors(result.errors);
    await this.savePerformanceMetrics(result.performanceMetrics);

    console.log(`[ScrapingOrchestrator] Scraping completed: ${result.totalShowtimes} showtimes, ${successfulSources}/${sourcesToScrape.length} sources successful`);

    return result;
  }

  /**
   * Scrape a source with retry logic
   */
  private async scrapeWithRetries(source: ScrapingSource): Promise<any> {
    let lastError: any;
    let attempt = 0;

    while (attempt < this.errorConfig.maxRetries) {
      attempt++;

      try {
        console.log(`[ScrapingOrchestrator] ${source} attempt ${attempt}/${this.errorConfig.maxRetries}`);

        const scraper = this.scrapers[source];
        const result = await scraper.scrapeShowtimes();

        if (result.success && result.data.length > 0) {
          return result;
        } else if (result.success && result.data.length === 0) {
          // Successful scrape but no data - might not be an error
          console.warn(`[ScrapingOrchestrator] ${source} returned no data`);
          return result;
        } else {
          // Failed scrape
          lastError = result.errors?.join(', ') || 'Unknown scraping error';
          throw new Error(lastError);
        }

      } catch (error) {
        lastError = error;
        console.error(`[ScrapingOrchestrator] ${source} attempt ${attempt} failed:`, error);

        // If this is a non-recoverable error, don't retry
        if (!this.isRecoverableError(String(error))) {
          console.log(`[ScrapingOrchestrator] ${source} non-recoverable error, stopping retries`);
          break;
        }

        // If not the last attempt, wait before retrying
        if (attempt < this.errorConfig.maxRetries) {
          const delay = Math.min(
            this.errorConfig.retryDelay * Math.pow(this.errorConfig.backoffMultiplier, attempt - 1),
            this.errorConfig.maxDelay
          );

          console.log(`[ScrapingOrchestrator] ${source} waiting ${delay}ms before retry ${attempt + 1}`);
          await this.sleep(delay);
        }
      }
    }

    // All attempts failed
    throw lastError || new Error(`Failed after ${this.errorConfig.maxRetries} attempts`);
  }

  /**
   * Check if an error is recoverable (worth retrying)
   */
  private isRecoverableError(errorString: string): boolean {
    const errorLower = errorString.toLowerCase();

    // Non-recoverable errors (don't retry)
    const nonRecoverablePatterns = [
      '404', 'not found', 'page not found',
      '403', 'forbidden', 'access denied', 'cloudflare', // Cloudflare blocks
      '401', 'unauthorized',
      'parse error', 'invalid json', 'malformed',
      'no such host', 'dns', 'domain not found',
      'does not have locations', 'does not operate', 'skipping scraper' // Our custom messages
    ];

    if (nonRecoverablePatterns.some(pattern => errorLower.includes(pattern))) {
      return false;
    }

    // Recoverable errors (worth retrying)
    const recoverablePatterns = [
      'timeout', 'network error', 'connection',
      '500', '502', '503', '504',
      'server error', 'service unavailable',
      'too many requests', 'rate limit'
    ];

    return recoverablePatterns.some(pattern => errorLower.includes(pattern));
  }

  /**
   * Circuit breaker management
   */
  private canAttemptScraping(source: ScrapingSource): boolean {
    const breaker = this.circuitBreakers.get(source);
    if (!breaker) return true;

    const now = new Date();

    switch (breaker.state) {
      case 'CLOSED':
        return true;

      case 'OPEN':
        // Check if enough time has passed to try again
        if (breaker.nextAttempt && now >= breaker.nextAttempt) {
          // Move to half-open state
          breaker.state = 'HALF_OPEN';
          return true;
        }
        return false;

      case 'HALF_OPEN':
        // Allow one attempt in half-open state
        return true;

      default:
        return true;
    }
  }

  private recordSuccess(source: ScrapingSource): void {
    const breaker = this.circuitBreakers.get(source);
    if (breaker) {
      breaker.failures = 0;
      breaker.lastFailure = null;
      breaker.state = 'CLOSED';
      breaker.nextAttempt = null;
    }
  }

  private recordFailure(source: ScrapingSource): void {
    const breaker = this.circuitBreakers.get(source);
    if (!breaker) return;

    breaker.failures++;
    breaker.lastFailure = new Date();

    if (breaker.failures >= this.errorConfig.circuitBreakerThreshold) {
      breaker.state = 'OPEN';
      breaker.nextAttempt = new Date(Date.now() + this.errorConfig.circuitBreakerTimeout);
      console.warn(`[ScrapingOrchestrator] Circuit breaker OPEN for ${source} until ${breaker.nextAttempt}`);
    }
  }

  /**
   * Health status management
   */
  private getHealthStatus(source: ScrapingSource): HealthStatus {
    return this.healthStatuses.get(source) || {
      source,
      isHealthy: false,
      responseTime: 0,
      successRate: 0,
      lastCheck: new Date(),
      issues: []
    };
  }

  private updateHealthStatus(
    source: ScrapingSource,
    success: boolean,
    responseTime: number,
    issues: string[] = []
  ): HealthStatus {
    const existing = this.healthStatuses.get(source);

    const healthStatus: HealthStatus = {
      source,
      isHealthy: success,
      responseTime,
      successRate: success ? 1.0 : 0.0, // Simplified for now - would calculate over time
      lastCheck: new Date(),
      issues: issues.slice(0, 5) // Keep only latest 5 issues
    };

    // If we have existing data, update success rate
    if (existing) {
      // Simple moving average - in production, you'd want more sophisticated tracking
      healthStatus.successRate = (existing.successRate * 0.8) + (success ? 0.2 : 0);
    }

    this.healthStatuses.set(source, healthStatus);
    return healthStatus;
  }

  /**
   * Persistence methods
   */
  private async loadCircuitBreakerStates(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.CIRCUIT_BREAKERS);
      if (stored) {
        const states = JSON.parse(stored);
        Object.entries(states).forEach(([source, state]: [string, any]) => {
          this.circuitBreakers.set(source as ScrapingSource, {
            ...state,
            lastFailure: state.lastFailure ? new Date(state.lastFailure) : null,
            nextAttempt: state.nextAttempt ? new Date(state.nextAttempt) : null
          });
        });
      }
    } catch (error) {
      console.error('[ScrapingOrchestrator] Failed to load circuit breaker states:', error);
    }
  }

  private async saveCircuitBreakerStates(): Promise<void> {
    try {
      const states: Record<string, any> = {};
      this.circuitBreakers.forEach((state, source) => {
        states[source] = state;
      });
      await AsyncStorage.setItem(this.STORAGE_KEYS.CIRCUIT_BREAKERS, JSON.stringify(states));
    } catch (error) {
      console.error('[ScrapingOrchestrator] Failed to save circuit breaker states:', error);
    }
  }

  private async loadHealthStatuses(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.HEALTH_STATUS);
      if (stored) {
        const statuses = JSON.parse(stored);
        Object.entries(statuses).forEach(([source, status]: [string, any]) => {
          this.healthStatuses.set(source as ScrapingSource, {
            ...status,
            lastCheck: new Date(status.lastCheck)
          });
        });
      }
    } catch (error) {
      console.error('[ScrapingOrchestrator] Failed to load health statuses:', error);
    }
  }

  private async saveHealthStatuses(): Promise<void> {
    try {
      const statuses: Record<string, any> = {};
      this.healthStatuses.forEach((status, source) => {
        statuses[source] = status;
      });
      await AsyncStorage.setItem(this.STORAGE_KEYS.HEALTH_STATUS, JSON.stringify(statuses));
    } catch (error) {
      console.error('[ScrapingOrchestrator] Failed to save health statuses:', error);
    }
  }

  private async logErrors(errors: ScrapingError[]): Promise<void> {
    try {
      const existingLogs = await AsyncStorage.getItem(this.STORAGE_KEYS.ERROR_LOG);
      const logs = existingLogs ? JSON.parse(existingLogs) : [];

      logs.push(...errors);

      // Keep only last 500 errors
      const limitedLogs = logs.slice(-500);

      await AsyncStorage.setItem(this.STORAGE_KEYS.ERROR_LOG, JSON.stringify(limitedLogs));
    } catch (error) {
      console.error('[ScrapingOrchestrator] Failed to log errors:', error);
    }
  }

  private async savePerformanceMetrics(metrics: ScrapingResult['performanceMetrics']): Promise<void> {
    try {
      const entry = {
        timestamp: new Date(),
        metrics
      };

      const existing = await AsyncStorage.getItem(this.STORAGE_KEYS.PERFORMANCE_METRICS);
      const history = existing ? JSON.parse(existing) : [];

      history.push(entry);

      // Keep only last 100 performance records
      const limitedHistory = history.slice(-100);

      await AsyncStorage.setItem(this.STORAGE_KEYS.PERFORMANCE_METRICS, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('[ScrapingOrchestrator] Failed to save performance metrics:', error);
    }
  }

  /**
   * Public API methods
   */

  // Get overall system health
  async getSystemHealth(): Promise<{
    overallHealthy: boolean;
    sourceHealth: Record<ScrapingSource, HealthStatus>;
    circuitBreakers: Record<ScrapingSource, CircuitBreakerState>;
    lastErrors: ScrapingError[];
  }> {
    const sourceHealth: Record<string, HealthStatus> = {};
    this.healthStatuses.forEach((status, source) => {
      sourceHealth[source] = status;
    });

    const circuitBreakers: Record<string, CircuitBreakerState> = {};
    this.circuitBreakers.forEach((state, source) => {
      circuitBreakers[source] = state;
    });

    const errorLogs = await AsyncStorage.getItem(this.STORAGE_KEYS.ERROR_LOG);
    const lastErrors = errorLogs ? JSON.parse(errorLogs).slice(-10) : [];

    const healthySources = Object.values(sourceHealth).filter(h => h.isHealthy).length;
    const totalSources = Object.values(sourceHealth).length;
    const overallHealthy = healthySources / Math.max(totalSources, 1) >= 0.5;

    return {
      overallHealthy,
      sourceHealth: sourceHealth as Record<ScrapingSource, HealthStatus>,
      circuitBreakers: circuitBreakers as Record<ScrapingSource, CircuitBreakerState>,
      lastErrors
    };
  }

  // Force reset circuit breakers
  async resetCircuitBreakers(sources?: ScrapingSource[]): Promise<void> {
    const sourcesToReset = sources || Array.from(this.circuitBreakers.keys());

    sourcesToReset.forEach(source => {
      const breaker = this.circuitBreakers.get(source);
      if (breaker) {
        breaker.failures = 0;
        breaker.lastFailure = null;
        breaker.state = 'CLOSED';
        breaker.nextAttempt = null;
      }
    });

    await this.saveCircuitBreakerStates();
    console.log(`[ScrapingOrchestrator] Reset circuit breakers for: ${sourcesToReset.join(', ')}`);
  }

  // Test individual source health
  async testSourceHealth(source: ScrapingSource): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const scraper = this.scrapers[source];
      if (!scraper) {
        throw new Error(`No scraper available for ${source}`);
      }

      // Simple health check - try to scrape a small amount
      const result = await scraper.scrapeShowtimes();
      const responseTime = Date.now() - startTime;

      return this.updateHealthStatus(source, result.success, responseTime, result.errors || []);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return this.updateHealthStatus(source, false, responseTime, [String(error)]);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}