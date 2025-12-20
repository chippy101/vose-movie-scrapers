export interface CastMember {
  id: string;
  name: string;
  character: string;
  profileImage?: string;
}

export interface CrewMember {
  id: string;
  name: string;
  job: string;
}

export interface Movie {
  id: string;
  title: string;
  poster: string;
  backdrop?: string;
  rating: number;
  year: number;
  genre: string[];
  runtime?: number;
  synopsis?: string;
  cast?: CastMember[];
  crew?: CrewMember[];
  trailerKey?: string; // YouTube video key (e.g., "dQw4w9WgXcQ")
  // Additional optional fields for compatibility
  overview?: string; // Alternative to synopsis
  duration?: number; // Alternative to runtime
  releaseDate?: string; // ISO date string
}