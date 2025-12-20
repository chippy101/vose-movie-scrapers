import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationService, { NotificationPreferences } from '../../services/notifications/NotificationService';

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    voseAlerts: false,
    weekendRoundup: false,
    showtimeReminders: false,
    notificationTime: '18:00',
    preferredCinemas: [],
  });
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Check notification permissions
      const status = await NotificationService.getPermissionStatus();
      setPermissionStatus(status);

      // Load saved preferences (in a real app, this would come from AsyncStorage or a backend)
      // For now, using default values
      setPreferences({
        voseAlerts: status === 'granted',
        weekendRoundup: false,
        showtimeReminders: false,
        notificationTime: '18:00',
        preferredCinemas: [],
      });
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const success = await NotificationService.initialize();
      if (success) {
        setPermissionStatus('granted');
        setPreferences(prev => ({ ...prev, voseAlerts: true }));
      } else {
        Alert.alert(
          'Permission Denied',
          'Please enable notifications in your device settings to receive VOSE alerts.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    // In a real app, save to AsyncStorage or backend here
    console.log('Saving preference:', key, value);

    // Handle specific preference changes
    if (key === 'weekendRoundup' && value === true) {
      const scheduledId = await NotificationService.scheduleWeekendRoundup(5); // Mock 5 movies
      console.log('Scheduled weekend roundup:', scheduledId);
    }
  };

  const sendTestNotification = async () => {
    if (permissionStatus !== 'granted') {
      Alert.alert(
        'No Permission',
        'Please enable notifications first to test.',
        [{ text: 'OK' }]
      );
      return;
    }

    await NotificationService.sendTestNotification();
    Alert.alert(
      'Test Sent',
      'Check your notifications! You should see a test VOSE notification.',
      [{ text: 'OK' }]
    );
  };

  const SettingRow = ({
    title,
    subtitle,
    value,
    onValueChange,
    disabled = false
  }: {
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, disabled && styles.disabledText]}>
          {title}
        </Text>
        <Text style={[styles.settingSubtitle, disabled && styles.disabledText]}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#767577', true: '#e50914' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading notification settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="notifications" size={24} color="#e50914" />
        <Text style={styles.title}>VOSE Notifications</Text>
      </View>

      {permissionStatus !== 'granted' && (
        <View style={styles.permissionBanner}>
          <Ionicons name="warning" size={20} color="#FF9800" />
          <View style={styles.permissionText}>
            <Text style={styles.permissionTitle}>Notifications Disabled</Text>
            <Text style={styles.permissionSubtitle}>
              Enable notifications to get alerts about VOSE movies
            </Text>
          </View>
          <TouchableOpacity style={styles.enableButton} onPress={requestPermissions}>
            <Text style={styles.enableButtonText}>Enable</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Types</Text>

        <SettingRow
          title="VOSE Movie Alerts"
          subtitle="Get notified when new VOSE showtimes are available"
          value={preferences.voseAlerts}
          onValueChange={(value) => updatePreference('voseAlerts', value)}
          disabled={permissionStatus !== 'granted'}
        />

        <SettingRow
          title="Weekend Roundup"
          subtitle="Weekly summary of VOSE movies available this weekend"
          value={preferences.weekendRoundup}
          onValueChange={(value) => updatePreference('weekendRoundup', value)}
          disabled={permissionStatus !== 'granted'}
        />
      </View>

      {permissionStatus === 'granted' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Notifications</Text>
          <TouchableOpacity style={styles.testButton} onPress={sendTestNotification}>
            <Ionicons name="send" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          VOSE notifications help you stay updated on English movies with Spanish subtitles
          available at cinemas in your area. You can customize which types of alerts you
          receive and when.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    margin: 40,
  },
  permissionBanner: {
    backgroundColor: '#2a1f00',
    borderColor: '#FF9800',
    borderWidth: 1,
    borderRadius: 8,
    margin: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionText: {
    flex: 1,
    marginLeft: 12,
  },
  permissionTitle: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  permissionSubtitle: {
    color: '#ccc',
    fontSize: 14,
  },
  enableButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  enableButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#888',
  },
  disabledText: {
    color: '#666',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e50914',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
});