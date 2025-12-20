export interface GeoLocation {
  lat: number;
  lng: number;
  address: string;
  city: string;
  postalCode?: string;
  region: string;
}

export interface CinemaLocation extends GeoLocation {
  district?: string;
  landmarks?: string[];
}

export type CinemaChain = 'CineCiutat' | 'Ocimax' | 'Cinesa' | 'Aficine' | 'Artesiete' | 'Independent' | 'Other';

export type VOSESupport = 'specialist' | 'frequent' | 'occasional' | 'rare' | 'unknown';

export interface TicketPricing {
  regular: number;
  currency: 'EUR';
  discounts: {
    day: string;
    price: number;
    description?: string;
  }[];
}

export interface Cinema {
  id: string;
  name: string;
  chain: CinemaChain;
  location: CinemaLocation;
  voseSupport: VOSESupport;
  logoUrl?: string; // Cinema or chain logo
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  ticketPricing?: TicketPricing;
  features?: {
    imax?: boolean;
    dolbyAtmos?: boolean;
    parking?: boolean;
    restaurant?: boolean;
  };
  source: ScrapingSource;
  lastUpdated: string;
  verificationStatus: 'pending' | 'verified' | 'needs_update';
  metadata?: Record<string, any>;
}

export type ScrapingSource = 'MajorcaDailyBulletin' | 'CineCiutat' | 'CinesMoixNegre' | 'Aficine' | 'Manual';

export interface ScrapedCinema extends Omit<Cinema, 'id' | 'lastUpdated'> {
  rawData?: string;
  confidence?: number;
}

export interface VOSEShowtime {
  id: string;
  movieId?: string; // TMDb ID if matched
  movieTitle: string;
  cinemaId: string;
  startTime: Date;
  endTime?: Date;
  language: 'VOSE' | 'Spanish' | 'Catalan' | 'Other' | 'Unknown';
  isVOSE: boolean;
  confidence: number; // 0-1 confidence in VOSE detection
  source: ScrapingSource;
  rawText: string;
  ticketUrl?: string;
  price?: number;
  format?: 'Standard' | 'IMAX' | '4DX' | 'Dolby Atmos';
  lastVerified?: Date;
  verificationStatus: 'pending' | 'confirmed' | 'rejected' | 'expired';
}

export interface ScrapedShowtime extends Omit<VOSEShowtime, 'id' | 'cinemaId'> {
  cinemaName: string;
  cinemaLocation?: string;
  island?: string;
  scrapedAt: Date;

  // TMDB metadata
  posterUrl?: string;
  backdropUrl?: string;
  overview?: string;
  rating?: number; // Changed from string to number to match TMDB (0-10)
  releaseYear?: number;
  runtime?: number; // in minutes
  genres?: string;
  certification?: string; // Age rating: G, PG, PG-13, R, etc.
  trailerKey?: string; // YouTube video key for trailer
  director?: string; // Director name
  castMembers?: string; // Comma-separated cast names (camelCase for compatibility)
  cast_members?: string; // API returns snake_case

  // Legacy fields (keeping for backwards compatibility)
  duration?: number; // deprecated, use runtime
  genre?: string; // deprecated, use genres
  metadata?: Record<string, any>;
}