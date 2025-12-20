import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/Navigation';
import TabNavigator from './TabNavigator';
import MovieDetailScreen from '../screens/movie/MovieDetailScreen';
import CinemaDetailScreen from '../screens/cinema/CinemaDetailScreen';
import ShowtimesScreen from '../screens/home/ShowtimesScreen';
import ScrapingTestScreen from '../screens/home/ScrapingTestScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
      <Stack.Screen
        name="CinemaDetail"
        component={CinemaDetailScreen}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#141414',
          },
          headerTintColor: '#ffffff',
          headerTitle: 'Cinema Details',
        }}
      />
      <Stack.Screen
        name="Showtimes"
        component={ShowtimesScreen}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#141414',
          },
          headerTintColor: '#ffffff',
          headerTitle: 'Showtimes',
        }}
      />
      <Stack.Screen
        name="ScrapingTest"
        component={ScrapingTestScreen}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#141414',
          },
          headerTintColor: '#ffffff',
          headerTitle: '🎬 Scraping Test',
        }}
      />
    </Stack.Navigator>
  );
}