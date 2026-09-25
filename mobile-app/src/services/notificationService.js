import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api, { getStoredToken } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_STORAGE_KEY = '@examsphere_push_token';
const NOTIFICATIONS_STORAGE_KEY = '@examsphere_local_notifications';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Initial Mock Notifications for Phase 2 UI & Contract Testing
 */
export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Upcoming Assessment Reminder',
    message: 'Your scheduled examination "Full-Stack MERN Architecture Assessment" starts in 30 minutes.',
    timestamp: '10 mins ago',
    type: 'warning',
    read: false,
    examId: 'exam_101',
    route: 'ExamDetail',
  },
  {
    id: 'notif-2',
    title: 'Examination Graded & Published',
    message: 'Official results for "Database Systems & MongoDB Indexing" have been evaluated and released.',
    timestamp: '2 hours ago',
    type: 'success',
    read: false,
    examId: 'exam_102',
    route: 'Results',
  },
  {
    id: 'notif-3',
    title: 'Security Monitor Verification',
    message: 'Your webcam proctoring session from yesterday was reviewed and verified with zero violations.',
    timestamp: 'Yesterday',
    type: 'info',
    read: true,
    examId: 'exam_101',
    route: 'ExamDetail',
  },
];

/**
 * Register device for Push Notifications and transmit token to backend
 */
export async function registerForPushNotificationsAsync() {
  let token = null;

  if (Platform.OS === 'web') {
    console.log('[Push Notification] Push notifications are mocked on web browser environment.');
    return 'mock-web-push-token-' + Date.now();
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Push Notification] Permission was not granted for push notifications.');
      return null;
    }

    // Attempt to get Expo Push Token
    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'exam-sphere-project-id',
      });
      token = pushTokenData.data;
    } catch {
      // Fallback for standalone/bare without configured EAS projectId
      token = (await Notifications.getDevicePushTokenAsync()).data;
    }

    if (token) {
      await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);

      // Register device FCM token with backend according to /shared/api-contract
      try {
        await api.post('/notifications/fcm-token', {
          token,
          platform: Platform.OS,
          registeredAt: new Date().toISOString(),
        });
        console.log('[Push Notification] Successfully registered push token with backend:', token);
      } catch {
        console.log('[Push Notification] Backend unreachable, stored push token locally:', token);
      }
    }
  } catch (error) {
    console.warn('[Push Notification] Error registering for push notifications:', error);
  }

  return token;
}

/**
 * Fetch all notifications (combining API response with offline storage)
 */
export async function fetchNotifications() {
  try {
    const res = await api.get('/notifications');
    if (res.data?.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  } catch {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    return INITIAL_NOTIFICATIONS;
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId) {
  try {
    await api.put(`/notifications/${notificationId}/read`);
  } catch {
    // Local fallback update
  }

  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const list = stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
    const updated = list.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead() {
  try {
    await api.put('/notifications/read-all');
  } catch {
    // Local fallback update
  }

  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const list = stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
    const updated = list.map((n) => ({ ...n, read: true }));
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Send an immediate local notification (used to simulate incoming push notifications)
 */
export async function sendLocalNotification({ title, message, data = {} }) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: message,
        data,
        sound: 'default',
        badge: 1,
      },
      trigger: null, // deliver immediately
    });

    // Also append to local notification list
    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: 'Just now',
      type: data.type || 'info',
      read: false,
      examId: data.examId || 'exam_101',
      route: data.route || 'ExamDetail',
    };

    const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const list = stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
    const updated = [newNotif, ...list];
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));

    return newNotif;
  } catch (error) {
    console.warn('[NotificationService] Error scheduling local notification:', error);
    return null;
  }
}
