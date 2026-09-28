import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getStoredToken } from './api';

/**
 * Retrieve Socket server URL from app config, env, or default localhost/emulator
 */
export const getSocketUrl = () => {
  if (Platform.OS === 'web') {
    const host = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
    return `http://${host}:5000`;
  }

  if (Platform.OS === 'ios') {
    return 'http://localhost:5000';
  }

  return (
    process.env.EXPO_PUBLIC_SOCKET_URL ||
    Constants.expoConfig?.extra?.socketUrl ||
    'http://10.0.2.2:5000'
  );
};

let socket = null;
let connectionListeners = new Set();

export const initSocket = async () => {
  if (socket && socket.connected) {
    return socket;
  }

  const token = await getStoredToken();
  const socketUrl = getSocketUrl();

  try {
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 6000,
      auth: {
        token: token || '',
      },
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to ExamSphere realtime service:', socket.id);
      connectionListeners.forEach((fn) => fn(true));
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected from realtime service:', reason);
      connectionListeners.forEach((fn) => fn(false));
    });

    socket.on('connect_error', (error) => {
      console.log('[Socket] Realtime connection fallback (mock active):', error.message);
      connectionListeners.forEach((fn) => fn(false));
    });

    return socket;
  } catch (err) {
    console.warn('[Socket] Initialization error:', err);
    return null;
  }
};

export const getSocket = () => socket;

export const isSocketConnected = () => !!(socket && socket.connected);

export const subscribeConnectionState = (listener) => {
  connectionListeners.add(listener);
  listener(isSocketConnected());
  return () => connectionListeners.delete(listener);
};

export const joinExamRoom = (examId) => {
  if (socket && socket.connected) {
    socket.emit('join:exam', { examId });
    socket.emit('join:leaderboard', { examId });
  }
};

export const leaveExamRoom = (examId) => {
  if (socket && socket.connected) {
    socket.emit('leave:exam', { examId });
    socket.emit('leave:leaderboard', { examId });
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
