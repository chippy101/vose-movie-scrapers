import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/Navigation';
import NotificationSettings from '../../components/common/NotificationSettings';
import { theme } from '../../styles/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <LinearGradient
      colors={theme.background.gradient}
      style={styles.container}
      locations={[0, 0.5, 1]}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Image
            source={require('../../../assets/popcornpal_v2.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Profile & Settings</Text>
        </View>

        <NotificationSettings />

      <View style={styles.versionSection}>
        <Image
          source={require('../../../assets/popcornpal_v2.png')}
          style={styles.versionLogo}
          resizeMode="contain"
        />
        <Text style={styles.versionText}>Popcorn Pal v1.1.0</Text>
        <Text style={styles.versionSubtext}>Find VOSE Movies in the Balearic Islands</Text>
      </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.card.border,
    alignItems: 'center',
  },
  headerLogo: {
    width: 180,
    height: 50,
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.text.primary,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.card.border,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.card.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    color: theme.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuSubtitle: {
    color: theme.text.secondary,
    fontSize: 14,
  },
  versionSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 40,
    alignItems: 'center',
  },
  versionLogo: {
    width: 120,
    height: 35,
    marginBottom: theme.spacing.md,
    opacity: 0.6,
  },
  versionText: {
    color: theme.text.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  versionSubtext: {
    color: theme.text.muted,
    fontSize: 12,
    textAlign: 'center',
  },
});