/**
 * Backend API Service
 * Connects to the Python FastAPI backend for VOSE movie data
 */

import { Environment } from '../../config/environment';

export const BACKEND_CONFIG = {
  BASE_URL: Environment.getBackendUrl(),
  REQUEST_TIMEOUT_MS: 30000, // 30 seconds
};

/**
 * Custom error types for better error handling
 */
export class TimeoutError extends Error {
  constructor(message: string = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export interface BackendShowtime {
  id: number;
  title: string;
  link: string;
  cinema_name: string;
  cinema_location: string;
  island: string;
  showtime_date: string;
  showtime_time: string;
  version: string;
  scraped_at: string;
  // TMDB metadata
  poster_url?: string;
  backdrop_url?: string;
  overview?: string;
  rating?: number;
  release_year?: number;
  runtime?: number;
  genres?: string;
  certification?: string;
  trailer_key?: string;
  director?: string;
  cast_members?: string;
}

export interface BackendMovie {
  id: number;
  title: string;
  link: string;
  version: string;
  created_at: string;
}

export interface BackendCinema {
  id: number;
  name: string;
  location: string;
  island: string;
  address: string | null;
  website: string | null;
  created_at: string;
}

class BackendApiService {
  private baseUrl: string;
  private timeoutMs: number;

  constructor() {
    this.baseUrl = BACKEND_CONFIG.BASE_URL;
    this.timeoutMs = BACKEND_CONFIG.REQUEST_TIMEOUT_MS;

    // Log configuration on initialization
    console.log('═══════════════════════════════════════════════');
    console.log('[BackendAPI] 🚀 INITIALIZING BACKEND API SERVICE');
    console.log('[BackendAPI] Base URL:', this.baseUrl);
    console.log('[BackendAPI] Request timeout:', this.timeoutMs, 'ms');
    console.log('═══════════════════════════════════════════════');
  }

  /**
   * Fetch with timeout using AbortController
   * Throws TimeoutError if request exceeds timeout duration
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error.name === 'AbortError') {
        throw new TimeoutError(
          `Request timed out after ${this.timeoutMs / 1000} seconds. ` +
          'Please check your internet connection and try again.'
        );
      }

      // Handle network errors
      if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
        throw new NetworkError(
          'Unable to connect to the backend server. ' +
          'Please check if the backend is running and your device is connected to the network.'
        );
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get all showtimes for today
   */
  async getShowtimesToday(): Promise<BackendShowtime[]> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/showtimes/today`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[BackendAPI] Error fetching showtimes:', error);
      throw error;
    }
  }

  /**
   * Get upcoming showtimes (next 7 days)
   */
  async getShowtimesUpcoming(days: number = 7): Promise<BackendShowtime[]> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/showtimes/upcoming?days=${days}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[BackendAPI] Error fetching upcoming showtimes:', error);
      throw error;
    }
  }

  /**
   * Get showtimes for a specific date
   */
  async getShowtimesByDate(date: string): Promise<BackendShowtime[]> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/showtimes/?showtime_date=${date}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[BackendAPI] Error fetching showtimes for date:', error);
      throw error;
    }
  }

  /**
   * Get all showtimes with optional filters
   */
  async getShowtimes(params?: {
    island?: string;
    cinema?: string;
    date?: string;
  }): Promise<BackendShowtime[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.island) queryParams.append('island', params.island);
      if (params?.cinema) queryParams.append('cinema', params.cinema);
      if (params?.date) queryParams.append('date', params.date);

      const url = `${this.baseUrl}/showtimes/?${queryParams}`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[BackendAPI] Error fetching filtered showtimes:', error);
      throw error;
    }
  }

  /**
   * Get all movies
   */
  async getMovies(): Promise<BackendMovie[]> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/movies/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[BackendAPI] Error fetching movies:', error);
      throw error;
    }
  }

  /**
   * Get all cinemas
   */
  async getCinemas(): Promise<BackendCinema[]> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/cinemas/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[BackendAPI] Error fetching cinemas:', error);
      throw error;
    }
  }

  /**
   * Get list of islands
   */
  async getIslands(): Promise<string[]> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/cinemas/islands`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[BackendAPI] Error fetching islands:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[BackendAPI] Health check failed:', error);
      throw error;
    }
  }

  /**
   * Get the configured backend URL (useful for debugging)
   */
  getBackendUrl(): string {
    return this.baseUrl;
  }
}

// Export singleton instance
export const backendApi = new BackendApiService();
