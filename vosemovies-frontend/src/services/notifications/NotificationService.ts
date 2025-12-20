import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface VOSENotificationData extends Record<string, unknown> {
  type: 'vose_alert' | 'weekend_roundup' | 'showtime_reminder';
  movieTitle?: string;
  cinemaName?: string;
  showtime?: string;
  data?: any;
}

export interface NotificationPreferences {
  voseAlerts: boolean;
  weekendRoundup: boolean;
  showtimeReminders: boolean;
  notificationTime: string; // HH:MM format
  preferredCinemas: string[];
}

class VOSENotificationService {
  private initialized = false;

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('vose-alerts', {
          name: 'VOSE Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#e50914',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('vose-reminders', {
          name: 'VOSE Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4CAF50',
          sound: 'default',
        });
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  async scheduleVOSEAlert(
    movieTitle: string,
    cinemaName: string,
    showtime: string,
    delayMinutes: number = 0
  ): Promise<string | null> {
    try {
      await this.initialize();

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎬 VOSE Movie Available!',
          body: `${movieTitle} is showing in VOSE at ${cinemaName} at ${showtime}`,
          data: {
            type: 'vose_alert',
            movieTitle,
            cinemaName,
            showtime,
          } as VOSENotificationData,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: delayMinutes * 60,
          channelId: Platform.OS === 'android' ? 'vose-alerts' : undefined,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling VOSE alert:', error);
      return null;
    }
  }

  async scheduleWeekendRoundup(
    moviesCount: number,
    dayOfWeek: number = 5, // Friday
    hour: number = 18 // 6 PM
  ): Promise<string | null> {
    try {
      await this.initialize();

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📅 Weekend VOSE Roundup',
          body: `${moviesCount} English movies with Spanish subtitles available this weekend!`,
          data: {
            type: 'weekend_roundup',
            data: { moviesCount },
          } as VOSENotificationData,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          weekday: dayOfWeek,
          hour,
          minute: 0,
          repeats: true,
          channelId: Platform.OS === 'android' ? 'vose-alerts' : undefined,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling weekend roundup:', error);
      return null;
    }
  }

  async scheduleShowtimeReminder(
    movieTitle: string,
    cinemaName: string,
    showtime: Date,
    reminderMinutesBefore: number = 60
  ): Promise<string | null> {
    try {
      await this.initialize();

      const reminderTime = new Date(showtime.getTime() - (reminderMinutesBefore * 60 * 1000));

      // Don't schedule if reminder time is in the past
      if (reminderTime <= new Date()) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ VOSE Showtime Reminder',
          body: `${movieTitle} starts in ${reminderMinutesBefore} minutes at ${cinemaName}`,
          data: {
            type: 'showtime_reminder',
            movieTitle,
            cinemaName,
            showtime: showtime.toISOString(),
          } as VOSENotificationData,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderTime,
          channelId: Platform.OS === 'android' ? 'vose-reminders' : undefined,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling showtime reminder:', error);
      return null;
    }
  }

  async sendImmediateVOSEAlert(
    movieTitle: string,
    cinemaName: string,
    showtime: string
  ): Promise<void> {
    try {
      await this.initialize();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 New VOSE Showtime!',
          body: `${movieTitle} just became available in VOSE at ${cinemaName} for ${showtime}`,
          data: {
            type: 'vose_alert',
            movieTitle,
            cinemaName,
            showtime,
          } as VOSENotificationData,
          sound: 'default',
        },
        trigger: null, // Immediate notification
      });
    } catch (error) {
      console.error('Error sending immediate VOSE alert:', error);
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status as 'granted' | 'denied' | 'undetermined';
    } catch (error) {
      console.error('Error getting permission status:', error);
      return 'undetermined';
    }
  }

  // Helper method to create a test notification
  async sendTestNotification(): Promise<void> {
    try {
      await this.initialize();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🍿 Popcorn Pal Test',
          body: 'Your VOSE notifications are working correctly!',
          data: {
            type: 'vose_alert',
            data: { test: true },
          } as VOSENotificationData,
          sound: 'default',
        },
        trigger: null, // Immediate notification
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  // Monitor for new VOSE listings and send notifications
  async checkForNewVOSEListings(
    previousShowtimes: any[],
    currentShowtimes: any[],
    preferences: NotificationPreferences
  ): Promise<void> {
    if (!preferences.voseAlerts) return;

    try {
      // Find new showtimes that weren't in the previous list
      const newShowtimes = currentShowtimes.filter(current =>
        !previousShowtimes.some(previous =>
          previous.id === current.id ||
          (previous.movieTitle === current.movieTitle &&
           previous.cinemaId === current.cinemaId &&
           previous.startTime === current.startTime)
        )
      );

      // Filter by preferred cinemas if specified
      const filteredShowtimes = preferences.preferredCinemas.length > 0
        ? newShowtimes.filter(showtime =>
            preferences.preferredCinemas.includes(showtime.cinemaId)
          )
        : newShowtimes;

      // Send notifications for new VOSE showtimes
      for (const showtime of filteredShowtimes.slice(0, 3)) { // Limit to 3 notifications
        if (showtime.isVOSE && showtime.confidence >= 0.8) {
          await this.sendImmediateVOSEAlert(
            showtime.movieTitle,
            this.getCinemaName(showtime.cinemaId),
            showtime.startTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          );

          // Small delay between notifications to avoid overwhelming
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Error checking for new VOSE listings:', error);
    }
  }

  private getCinemaName(cinemaId: string): string {
    const cinemaNames: { [key: string]: string } = {
      'cineciutat': 'CineCiutat',
      'ocimax': 'Ocimax Palma',
      'festivalpark': 'Festival Park',
      'cinesaporto': 'Cinesa Porto Pi',
    };
    return cinemaNames[cinemaId] || cinemaId;
  }

  // Schedule daily check for new VOSE listings
  async scheduleDailyVOSECheck(hour: number = 9): Promise<string | null> {
    try {
      await this.initialize();

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔄 Checking for new VOSE movies...',
          body: 'We\'re scanning cinemas for new English movies with Spanish subtitles',
          data: {
            type: 'vose_alert',
            data: { action: 'daily_check' },
          } as VOSENotificationData,
          sound: undefined, // Silent notification
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour,
          minute: 0,
          repeats: true,
          channelId: Platform.OS === 'android' ? 'vose-alerts' : undefined,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling daily VOSE check:', error);
      return null;
    }
  }
}

// Export a singleton instance
export default new VOSENotificationService();