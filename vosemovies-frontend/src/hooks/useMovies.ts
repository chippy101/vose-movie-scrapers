import { useState, useEffect, useCallback, useMemo } from 'react';
import { Movie } from '../types/Movie';
import { tmdbApi } from '../services/api/tmdbApi';

export interface UseMoviesResult {
  movies: Movie[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export interface MovieSections {
  popular: UseMoviesResult;
  nowPlaying: UseMoviesResult;
  upcoming: UseMoviesResult;
  topRated: UseMoviesResult;
  action: UseMoviesResult;
  sciFi: UseMoviesResult;
  drama: UseMoviesResult;
  comedy: UseMoviesResult;
}

// Generic hook for fetching movies with a specific API function
function useMoviesFetch(
  fetchFn: () => Promise<Movie[]>,
  errorMessage: string
): UseMoviesResult {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the fetch function to prevent infinite loops
  const stableFetchFn = useCallback(fetchFn, []);

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedMovies = await stableFetchFn();
      setMovies(fetchedMovies);
    } catch (err) {
      console.error(errorMessage, err);
      setError(err instanceof Error ? err.message : errorMessage);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [stableFetchFn, errorMessage]);

  const refresh = useCallback(() => {
    fetchMovies();
  }, [fetchMovies]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  return { movies, loading, error, refresh };
}

// Individual hooks for each movie section using the generic hook
// Note: We wrap in arrow functions to preserve 'this' context
function usePopularMovies(): UseMoviesResult {
  return useMoviesFetch(
    () => tmdbApi.getPopularMovies(),
    'Failed to fetch popular movies'
  );
}

function useNowPlayingMovies(): UseMoviesResult {
  return useMoviesFetch(
    () => tmdbApi.getNowPlayingMovies(),
    'Failed to fetch now playing movies'
  );
}

function useUpcomingMovies(): UseMoviesResult {
  return useMoviesFetch(
    () => tmdbApi.getUpcomingMovies(),
    'Failed to fetch upcoming movies'
  );
}

function useTopRatedMovies(): UseMoviesResult {
  return useMoviesFetch(
    () => tmdbApi.getTopRatedMovies(),
    'Failed to fetch top rated movies'
  );
}

function useActionMovies(): UseMoviesResult {
  return useMoviesFetch(
    () => tmdbApi.getActionMovies(),
    'Failed to fetch action movies'
  );
}

function useSciFiMovies(): UseMoviesResult {
  return useMoviesFetch(
    () => tmdbApi.getSciFiMovies(),
    'Failed to fetch sci-fi movies'
  );
}

function useDramaMovies(): UseMoviesResult {
  return useMoviesFetch(
    () => tmdbApi.getDramaMovies(),
    'Failed to fetch drama movies'
  );
}

function useComedyMovies(): UseMoviesResult {
  return useMoviesFetch(
    () => tmdbApi.getComedyMovies(),
    'Failed to fetch comedy movies'
  );
}

export function useMovieSections(): MovieSections {
  const popular = usePopularMovies();
  const nowPlaying = useNowPlayingMovies();
  const upcoming = useUpcomingMovies();
  const topRated = useTopRatedMovies();
  const action = useActionMovies();
  const sciFi = useSciFiMovies();
  const drama = useDramaMovies();
  const comedy = useComedyMovies();

  return {
    popular,
    nowPlaying,
    upcoming,
    topRated,
    action,
    sciFi,
    drama,
    comedy,
  };
}

export function useMovieSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchMovies = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const searchResults = await tmdbApi.searchMovies(searchQuery);
      setResults(searchResults);
    } catch (err) {
      console.error('Error searching movies:', err);
      setError(err instanceof Error ? err.message : 'Failed to search movies');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchMovies(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, searchMovies]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearSearch,
  };
}

export function useMovieDetails(movieId: string | null) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId) {
      setMovie(null);
      setError(null);
      return;
    }

    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const movieDetails = await tmdbApi.getMovieDetails(movieId);
        setMovie(movieDetails);
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch movie details');
        setMovie(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId]);

  return { movie, loading, error };
}