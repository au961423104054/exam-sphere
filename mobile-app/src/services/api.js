import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const AUTH_TOKEN_KEY = 'exam_sphere_auth_token';

/**
 * Retrieve the API base URL from app.config.js extras, falling back
 * to EXPO_PUBLIC_API_BASE_URL or local emulator default.
 */
export const getApiBaseUrl = () => {
  return (
    Constants.expoConfig?.extra?.apiBaseUrl ||
    Constants.manifest2?.extra?.expoClient?.extra?.apiBaseUrl ||
    Constants.manifest?.extra?.apiBaseUrl ||
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    'http://10.0.2.2:5000/api'
  );
};

/**
 * Get JWT token from SecureStore (or AsyncStorage on web).
 */
export const getStoredToken = async () => {
  try {
    if (Platform.OS !== 'web' && (await SecureStore.isAvailableAsync())) {
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    }
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.warn('[API Service] Error reading auth token:', error);
    return null;
  }
};

/**
 * Save JWT token into SecureStore (or AsyncStorage on web).
 */
export const setStoredToken = async (token) => {
  try {
    if (Platform.OS !== 'web' && (await SecureStore.isAvailableAsync())) {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    } else {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  } catch (error) {
    console.warn('[API Service] Error saving auth token:', error);
  }
};

/**
 * Remove JWT token from SecureStore (or AsyncStorage on web).
 */
export const removeStoredToken = async () => {
  try {
    if (Platform.OS !== 'web' && (await SecureStore.isAvailableAsync())) {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    } else {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch (error) {
    console.warn('[API Service] Error removing auth token:', error);
  }
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: attaches the JWT token from SecureStore to Authorization header
api.interceptors.request.use(
  async (config) => {
    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: passes response or handles errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
