import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrapingOrchestrator } from '../scraping/orchestration/ScrapingOrchestrator';
import { ScrapedShowtime, ScrapingSource } from '../../types/Cinema';
import { backendApi } from '../api/backendApi';

export interface ShowtimeData {
  showtimes: ScrapedShowtime[];
  lastUpdated: Date;
  totalShowtimes: number;
  voseShowtimes: number;
  sources: ScrapingSource[];
}

export class ShowtimeDataService {
  private static instance: ShowtimeDataService;
  private readonly STORAGE_KEY = 'vose_showtimes_data';
  private readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minutes (balanced for performance and freshness)
  private readonly STALE_DATA_MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours (max age for stale data)
  private orchestrator: ScrapingOrchestrator;
  private cachedData: ShowtimeData | null = null;
  private isFetching: boolean = false;

  private constructor() {
    this.orchestrator = new ScrapingOrchestrator();
  }

  static getInstance(): ShowtimeDataService {
    if (!ShowtimeDataService.instance) {
      ShowtimeDataService.instance = new ShowtimeDataService();
    }
    return ShowtimeDataService.instance;
  }

  /**
   * Get showtimes - uses stale-while-revalidate pattern
   * Always returns data quickly, fetches fresh data in background if needed
   */
  async getShowtimes(forceRefresh: boolean = false): Promise<ShowtimeData> {
    console.log('[ShowtimeData] getShowtimes called, forceRefresh:', forceRefresh);

    // Step 1: Try to load from storage FIRST (even if stale) for immediate display
    const stored = await this.loadFromStorage();
    console.log('[ShowtimeData] Loaded from storage:', stored ? `${stored.showtimes.length} showtimes` : 'null');

    // Step 2: Check if we have fresh cached data in memory
    if (!forceRefresh && this.cachedData && this.cachedData.showtimes.length > 0) {
      const age = Date.now() - new Date(this.cachedData.lastUpdated).getTime();
      if (age < this.CACHE_DURATION) {
        console.log('[ShowtimeData] Returning fresh cached data');
        return this.cachedData;
      }
    }

    // Step 3: Check if stored data is fresh enough AND has data
    if (!forceRefresh && stored && stored.showtimes.length > 0) {
      const age = Date.now() - new Date(stored.lastUpdated).getTime();

      if (age < this.CACHE_DURATION) {
        // Fresh data - return immediately
        console.log('[ShowtimeData] Returning fresh stored data');
        this.cachedData = stored;
        return stored;
      } else if (age < this.STALE_DATA_MAX_AGE) {
        // Stale but usable - return immediately, fetch in background
        console.log('[ShowtimeData] Returning stale data, fetching fresh in background...');
        this.cachedData = stored;

        // Fetch fresh data in background (don't await)
        if (!this.isFetching) {
          this.fetchFreshDataInBackground();
        }

        return stored;
      }
    }

    // Step 4: No cached/stored data OR it's empty OR too old - must fetch now
    console.log('[ShowtimeData] No valid cache (or empty data), fetching fresh data...');
    return await this.fetchFreshData();
  }

  /**
   * Fetch fresh data in background without blocking
   */
  private async fetchFreshDataInBackground(): Promise<void> {
    if (this.isFetching) {
      console.log('[ShowtimeData] Already fetching, skipping background fetch');
      return;
    }

    try {
      this.isFetching = true;
      const freshData = await this.fetchFreshData();
      console.log('[ShowtimeData] Background fetch completed');
      // Data is already cached by fetchFreshData
    } catch (error) {
      console.error('[ShowtimeData] Background fetch failed:', error);
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Fetch fresh data from backend API (with scraping fallback)
   */
  private async fetchFreshData(): Promise<ShowtimeData> {
    try {
      console.log('[ShowtimeData] 🌐 Fetching from backend API...');

      // Try backend API first
      console.log('[ShowtimeData] Calling backendApi.getShowtimesUpcoming()...');
      const backendShowtimes = await backendApi.getShowtimesUpcoming();
      console.log(`[ShowtimeData] ✅ Backend API returned ${backendShowtimes.length} showtimes`);

      // Log first showtime for debugging
      if (backendShowtimes.length > 0) {
        const first = backendShowtimes[0];
        console.log('[ShowtimeData] First backend showtime:');
        console.log(`  Title: ${first.title}`);
        console.log(`  Date: ${first.showtime_date}`);
        console.log(`  Time: ${first.showtime_time}`);
        console.log(`  Poster: ${first.poster_url || 'N/A'}`);
        console.log(`  Rating: ${first.rating || 'N/A'}`);
      }

      // If backend returns empty, fall back to scraping
      if (backendShowtimes.length === 0) {
        console.log('[ShowtimeData] ⚠️ Backend returned 0 showtimes, falling back to scraping...');
        return await this.fetchFromScrapers();
      }

      // Transform backend format to app format
      const transformedShowtimes: ScrapedShowtime[] = backendShowtimes.map(st => {
        const transformed = {
          movieTitle: st.title,
          cinemaName: st.cinema_name,
          cinemaLocation: st.cinema_location,
          island: st.island,
          startTime: new Date(`${st.showtime_date}T${st.showtime_time}`),
          language: st.version,
          isVOSE: st.version === 'VOSE',
          url: st.link || '',
          source: 'backend-api' as ScrapingSource,
          scrapedAt: new Date(st.scraped_at),
          // TMDB metadata
          posterUrl: st.poster_url,
          backdropUrl: st.backdrop_url,
          overview: st.overview,
          rating: st.rating,
          releaseYear: st.release_year,
          runtime: st.runtime,
          genres: st.genres,
          certification: st.certification,
          trailerKey: st.trailer_key,
          director: st.director,
          castMembers: st.cast_members
        };

        // Debug log for first few movies
        if (backendShowtimes.indexOf(st) < 2) {
          console.log(`[ShowtimeData] 🎬 Sample movie: ${st.title}`);
          console.log(`[ShowtimeData]   📷 Poster: ${st.poster_url ? 'YES' : 'NO'} ${st.poster_url || ''}`);
          console.log(`[ShowtimeData]   ⭐ Rating: ${st.rating || 'N/A'}`);
          console.log(`[ShowtimeData]   🎭 Director: ${st.director || 'N/A'}`);
        }

        return transformed;
      });

      const voseShowtimes = transformedShowtimes.filter(s => s.isVOSE).length;
      console.log(`[ShowtimeData] 🎭 VOSE showtimes: ${voseShowtimes}/${transformedShowtimes.length}`);

      // Log first transformed showtime
      if (transformedShowtimes.length > 0) {
        const firstTransformed = transformedShowtimes[0];
        console.log('[ShowtimeData] First TRANSFORMED showtime:');
        console.log(`  movieTitle: ${firstTransformed.movieTitle}`);
        console.log(`  startTime: ${firstTransformed.startTime}`);
        console.log(`  posterUrl: ${firstTransformed.posterUrl || 'N/A'}`);
        console.log(`  rating: ${firstTransformed.rating || 'N/A'}`);
      }

      const data: ShowtimeData = {
        showtimes: transformedShowtimes,
        lastUpdated: new Date(),
        totalShowtimes: transformedShowtimes.length,
        voseShowtimes,
        sources: ['backend-api' as ScrapingSource]
      };

      // Cache and store
      this.cachedData = data;
      await this.saveToStorage(data);

      return data;

    } catch (error) {
      console.error('[ShowtimeData] ❌ Backend API failed:', error);
      console.error('[ShowtimeData] Error details:', JSON.stringify(error, null, 2));

      // In production builds, DON'T fall back to scraping - it won't work
      // Instead, throw the error so the app shows a proper error message
      if (error instanceof Error) {
        throw new Error(`Backend connection failed: ${error.message}. Please check your internet connection and ensure the backend server is running.`);
      }
      throw error;
    }
  }

  /**
   * Fallback: Fetch data from client-side scraping
   */
  private async fetchFromScrapers(): Promise<ShowtimeData> {
    try {
      console.log('[ShowtimeData] 🎬 Starting live scraping...');

      const result = await this.orchestrator.executeFullScraping([
        'Aficine',
        'CineCiutat',
        'CinesMoixNegre',
        'MajorcaDailyBulletin'
      ]);

      console.log(`[ShowtimeData] ✅ Scraping complete: ${result.totalShowtimes} showtimes found`);

      const allShowtimes = result.showtimes || [];
      const voseShowtimes = allShowtimes.filter(s => s.isVOSE).length;

      const data: ShowtimeData = {
        showtimes: allShowtimes,
        lastUpdated: new Date(),
        totalShowtimes: allShowtimes.length,
        voseShowtimes,
        sources: ['Aficine', 'CineCiutat', 'CinesMoixNegre', 'MajorcaDailyBulletin']
      };

      this.cachedData = data;
      await this.saveToStorage(data);

      return data;

    } catch (error) {
      console.error('[ShowtimeData] ❌ Scraping failed:', error);

      // ALWAYS try to return stored data, even if very old
      const fallback = this.cachedData || await this.loadFromStorage();
      if (fallback) {
        console.log('[ShowtimeData] 💾 Returning fallback data (scraping failed)');
        return fallback;
      }

      // Only return empty data if absolutely nothing is available
      console.warn('[ShowtimeData] ⚠️ No fallback data available, returning empty');
      return {
        showtimes: [],
        lastUpdated: new Date(),
        totalShowtimes: 0,
        voseShowtimes: 0,
        sources: []
      };
    }
  }

  /**
   * Get VOSE showtimes for today
   */
  async getVOSETonight(): Promise<ScrapedShowtime[]> {
    const data = await this.getShowtimes();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return data.showtimes.filter(showtime => {
      const showtimeDate = new Date(showtime.startTime);
      return (
        showtime.isVOSE &&
        showtimeDate >= today &&
        showtimeDate < tomorrow
      );
    });
  }

  /**
   * Get showtimes by cinema
   */
  async getShowtimesByCinema(cinemaName: string): Promise<ScrapedShowtime[]> {
    const data = await this.getShowtimes();
    return data.showtimes.filter(s =>
      s.cinemaName.toLowerCase().includes(cinemaName.toLowerCase())
    );
  }

  /**
   * Get showtimes by movie
   */
  async getShowtimesByMovie(movieTitle: string): Promise<ScrapedShowtime[]> {
    const data = await this.getShowtimes();
    return data.showtimes.filter(s =>
      s.movieTitle.toLowerCase().includes(movieTitle.toLowerCase())
    );
  }

  /**
   * Manually refresh data
   */
  async refresh(): Promise<ShowtimeData> {
    return await this.getShowtimes(true);
  }

  /**
   * Get system health
   */
  async getSystemHealth() {
    return await this.orchestrator.getSystemHealth();
  }

  /**
   * Storage methods
   */
  private async saveToStorage(data: ShowtimeData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log('[ShowtimeData] Saved to storage');
    } catch (error) {
      console.error('[ShowtimeData] Failed to save to storage:', error);
    }
  }

  private async loadFromStorage(): Promise<ShowtimeData | null> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Reconstitute Date objects
        data.lastUpdated = new Date(data.lastUpdated);
        data.showtimes = data.showtimes.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          scrapedAt: new Date(s.scrapedAt)
        }));
        return data;
      }
    } catch (error) {
      console.error('[ShowtimeData] Failed to load from storage:', error);
    }
    return null;
  }

  /**
   * Clear cached data
   */
  async clearCache(): Promise<void> {
    this.cachedData = null;
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    console.log('[ShowtimeData] Cache cleared');
  }
}

export const showtimeDataService = ShowtimeDataService.getInstance();
