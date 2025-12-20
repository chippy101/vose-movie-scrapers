import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/home/HomeScreen';
import CinemaListScreen from '../screens/cinema/CinemaListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

// Custom Header Logo Component
const HeaderLogo = () => (
  <View style={styles.headerLogoContainer}>
    <TouchableOpacity
      style={styles.logoTapArea}
      activeOpacity={0.7}
    >
      <Image
        source={require('../../assets/popcornpal_v2.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />
    </TouchableOpacity>
    <Text style={styles.logoText}>Popcorn Pal</Text>
  </View>
);

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333333',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#888888',
        headerStyle: {
          backgroundColor: '#141414',
          borderBottomColor: '#333333',
          borderBottomWidth: 1,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Cinemas"
        component={CinemaListScreen}
        options={{
          headerShown: false,
          title: 'Cinemas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTapArea: {
    width: 56,  // Maximum recommended tap area (44-56dp range)
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoImage: {
    width: 44,  // Prominent header logo size (83% larger than original)
    height: 44,
  },
  logoText: {
    fontSize: 22,  // Slightly larger to balance with bigger icon
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});