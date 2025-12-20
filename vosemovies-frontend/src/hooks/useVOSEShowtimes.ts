import { useState, useEffect, useCallback } from 'react';
import { showtimeDataService, ShowtimeData } from '../services/data/ShowtimeDataService';
import { ScrapedShowtime } from '../types/Cinema';
import { ConnectionTestService } from '../services/api/ConnectionTest';

export interface UseVOSEShowtimesReturn {
  showtimes: ScrapedShowtime[];
  voseTonightShowtimes: ScrapedShowtime[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  clearCache: () => Promise<void>;
  totalShowtimes: number;
  voseCount: number;
}

export function useVOSEShowtimes(): UseVOSEShowtimesReturn {
  const [data, setData] = useState<ShowtimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadShowtimes = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      // Test connection first on initial load
      if (!data || forceRefresh) {
        console.log('[useVOSEShowtimes] Testing backend connection...');
        const connectionTest = await ConnectionTestService.testConnection();

        if (!connectionTest.success) {
          throw new Error(
            `Cannot connect to backend server.\n\n` +
            `${connectionTest.message}\n${connectionTest.details}\n\n` +
            `Backend URL: ${connectionTest.url}\n\n` +
            `Please ensure:\n` +
            `1. Backend server is running\n` +
            `2. You're on the same WiFi network (192.168.50.x)\n` +
            `3. Firewall isn't blocking port 8000`
          );
        }
        console.log('[useVOSEShowtimes] Connection test passed ✅');
      }

      console.log('[useVOSEShowtimes] Loading showtimes...');
      const showtimeData = await showtimeDataService.getShowtimes(forceRefresh);

      console.log(`[useVOSEShowtimes] Loaded ${showtimeData.totalShowtimes} showtimes`);
      console.log(`[useVOSEShowtimes] VOSE count: ${showtimeData.voseShowtimes}`);

      setData(showtimeData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load showtimes';
      console.error('[useVOSEShowtimes] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [data]);

  const refresh = useCallback(async () => {
    console.log('[useVOSEShowtimes] Refreshing showtimes...');
    await loadShowtimes(true);
  }, [loadShowtimes]);

  const clearCache = useCallback(async () => {
    console.log('[useVOSEShowtimes] Clearing cache...');
    await showtimeDataService.clearCache();
  }, []);

  // Load on mount
  useEffect(() => {
    loadShowtimes(false);
  }, [loadShowtimes]);

  // Get VOSE showtimes for tonight
  const voseTonightShowtimes = data?.showtimes.filter(showtime => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const showtimeDate = new Date(showtime.startTime);
    return (
      showtime.isVOSE &&
      showtimeDate >= today &&
      showtimeDate < tomorrow
    );
  }) || [];

  return {
    showtimes: data?.showtimes || [],
    voseTonightShowtimes,
    loading,
    error,
    lastUpdated: data?.lastUpdated || null,
    refresh,
    clearCache,
    totalShowtimes: data?.totalShowtimes || 0,
    voseCount: data?.voseShowtimes || 0
  };
}
