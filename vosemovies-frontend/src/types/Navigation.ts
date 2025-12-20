import { NavigatorScreenParams } from '@react-navigation/native';
import { Movie } from './Movie';
import { Cinema } from './Cinema';

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList> | undefined;
  MovieDetail: { movie: Movie };
  CinemaDetail: { cinema: Cinema };
  Showtimes: { movieTitle?: string; cinemaId?: string } | undefined;
  ScrapingTest: undefined;
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Cinemas: undefined;
  Profile: undefined;
};