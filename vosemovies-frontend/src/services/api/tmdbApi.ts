import { TMDB_CONFIG, getPosterUrl, getBackdropUrl, getProfileUrl } from '../../config/api';
import { Movie, CastMember, CrewMember } from '../../types/Movie';

interface TMDbMovie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
  runtime?: number;
  overview: string;
  original_language: string;
  popularity: number;
}

interface TMDbVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
}

interface TMDbMovieDetails extends TMDbMovie {
  genres: { id: number; name: string }[];
  credits?: {
    cast: TMDbCastMember[];
    crew: TMDbCrewMember[];
  };
  videos?: {
    results: TMDbVideo[];
  };
}

interface TMDbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path?: string;
}

interface TMDbCrewMember {
  id: number;
  name: string;
  job: string;
}

interface TMDbResponse<T> {
  results: T[];
  total_pages: number;
  total_results: number;
  page: number;
}

export class TMDbApiService {
  private baseUrl = TMDB_CONFIG.BASE_URL;
  private apiKey = TMDB_CONFIG.API_KEY;

  private async fetchFromApi<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('api_key', this.apiKey);
    url.searchParams.append('language', TMDB_CONFIG.LANGUAGE);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`TMDb API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private mapGenreIds(genreIds: number[]): string[] {
    return genreIds
      .map(id => TMDB_CONFIG.GENRE_MAPPING[id as keyof typeof TMDB_CONFIG.GENRE_MAPPING])
      .filter(Boolean);
  }

  private mapTMDbMovieToMovie(tmdbMovie: TMDbMovie | TMDbMovieDetails, includeCredits = false): Movie {
    const year = new Date(tmdbMovie.release_date).getFullYear();

    let genres: string[];
    if ('genres' in tmdbMovie && tmdbMovie.genres) {
      genres = tmdbMovie.genres.map(g => g.name);
    } else {
      genres = this.mapGenreIds(tmdbMovie.genre_ids);
    }

    let cast: CastMember[] = [];
    let crew: CrewMember[] = [];

    if (includeCredits && 'credits' in tmdbMovie && tmdbMovie.credits) {
      cast = tmdbMovie.credits.cast.slice(0, 10).map(member => ({
        id: member.id.toString(),
        name: member.name,
        character: member.character,
        profileImage: member.profile_path ? getProfileUrl(member.profile_path) : undefined,
      }));

      crew = tmdbMovie.credits.crew
        .filter(member => ['Director', 'Writer', 'Producer', 'Music'].includes(member.job))
        .slice(0, 10)
        .map(member => ({
          id: member.id.toString(),
          name: member.name,
          job: member.job,
        }));
    }

    return {
      id: tmdbMovie.id.toString(),
      title: tmdbMovie.title,
      poster: getPosterUrl(tmdbMovie.poster_path),
      backdrop: tmdbMovie.backdrop_path ? getBackdropUrl(tmdbMovie.backdrop_path) : undefined,
      rating: Math.round(tmdbMovie.vote_average * 10) / 10,
      year,
      genre: genres,
      runtime: tmdbMovie.runtime || 0,
      synopsis: tmdbMovie.overview,
      cast,
      crew,
    };
  }

  // Get popular English movies (good for VOSE in Spain)
  async getPopularMovies(page: number = 1): Promise<Movie[]> {
    const response = await this.fetchFromApi<TMDbResponse<TMDbMovie>>('/movie/popular', {
      page: page.toString(),
      region: TMDB_CONFIG.REGION,
      with_original_language: 'en', // English movies for VOSE
    });

    return response.results
      .filter(movie => movie.original_language === 'en' && movie.popularity > 50)
      .map(movie => this.mapTMDbMovieToMovie(movie));
  }

  // Get now playing movies (current releases)
  async getNowPlayingMovies(page: number = 1): Promise<Movie[]> {
    const response = await this.fetchFromApi<TMDbResponse<TMDbMovie>>('/movie/now_playing', {
      page: page.toString(),
      region: TMDB_CONFIG.REGION,
      with_original_language: 'en',
    });

    return response.results
      .filter(movie => movie.original_language === 'en')
      .map(movie => this.mapTMDbMovieToMovie(movie));
  }

  // Get upcoming movies
  async getUpcomingMovies(page: number = 1): Promise<Movie[]> {
    const response = await this.fetchFromApi<TMDbResponse<TMDbMovie>>('/movie/upcoming', {
      page: page.toString(),
      region: TMDB_CONFIG.REGION,
      with_original_language: 'en',
    });

    return response.results
      .filter(movie => movie.original_language === 'en')
      .map(movie => this.mapTMDbMovieToMovie(movie));
  }

  // Get top rated English movies
  async getTopRatedMovies(page: number = 1): Promise<Movie[]> {
    const response = await this.fetchFromApi<TMDbResponse<TMDbMovie>>('/movie/top_rated', {
      page: page.toString(),
      with_original_language: 'en',
    });

    return response.results
      .filter(movie => movie.original_language === 'en' && movie.vote_average >= 7.0)
      .map(movie => this.mapTMDbMovieToMovie(movie));
  }

  // Get movies by genre
  async getMoviesByGenre(genreId: number, page: number = 1): Promise<Movie[]> {
    const response = await this.fetchFromApi<TMDbResponse<TMDbMovie>>('/discover/movie', {
      page: page.toString(),
      with_genres: genreId.toString(),
      with_original_language: 'en',
      sort_by: 'popularity.desc',
      'vote_count.gte': '100',
    });

    return response.results
      .filter(movie => movie.original_language === 'en')
      .map(movie => this.mapTMDbMovieToMovie(movie));
  }

  // Search movies
  async searchMovies(query: string, page: number = 1): Promise<Movie[]> {
    if (!query.trim()) return [];

    const response = await this.fetchFromApi<TMDbResponse<TMDbMovie>>('/search/movie', {
      query: query.trim(),
      page: page.toString(),
      include_adult: 'false',
    });

    return response.results
      .filter(movie => movie.original_language === 'en' && movie.poster_path)
      .map(movie => this.mapTMDbMovieToMovie(movie));
  }

  // Get movie details with cast and crew
  async getMovieDetails(movieId: string): Promise<Movie> {
    const response = await this.fetchFromApi<TMDbMovieDetails>(`/movie/${movieId}`, {
      append_to_response: 'credits,videos',
    });

    // Extract trailer key from videos
    let trailerKey: string | undefined;
    if (response.videos?.results) {
      // Look for official trailer on YouTube
      const trailer = response.videos.results.find(
        video => video.site === 'YouTube' && video.type === 'Trailer'
      );
      trailerKey = trailer?.key;
    }

    const movie = this.mapTMDbMovieToMovie(response, true);
    return {
      ...movie,
      trailerKey,
    };
  }

  // Get action movies (genre ID 28)
  async getActionMovies(page: number = 1): Promise<Movie[]> {
    return this.getMoviesByGenre(28, page);
  }

  // Get sci-fi movies (genre ID 878)
  async getSciFiMovies(page: number = 1): Promise<Movie[]> {
    return this.getMoviesByGenre(878, page);
  }

  // Get drama movies (genre ID 18)
  async getDramaMovies(page: number = 1): Promise<Movie[]> {
    return this.getMoviesByGenre(18, page);
  }

  // Get comedy movies (genre ID 35)
  async getComedyMovies(page: number = 1): Promise<Movie[]> {
    return this.getMoviesByGenre(35, page);
  }
}

export const tmdbApi = new TMDbApiService();