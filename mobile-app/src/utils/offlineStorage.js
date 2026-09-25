import AsyncStorage from '@react-native-async-storage/async-storage';

const EXAM_PROGRESS_PREFIX = '@examsphere_exam_progress_';

/**
 * Save in-progress exam answers and timer to AsyncStorage for offline resume.
 */
export const saveExamProgress = async (examId, progressData) => {
  try {
    const key = `${EXAM_PROGRESS_PREFIX}${examId}`;
    const payload = JSON.stringify({
      ...progressData,
      updatedAt: new Date().toISOString(),
    });
    await AsyncStorage.setItem(key, payload);
  } catch (error) {
    console.warn('[OfflineStorage] Error saving exam progress:', error);
  }
};

/**
 * Retrieve saved in-progress exam state.
 */
export const getExamProgress = async (examId) => {
  try {
    const key = `${EXAM_PROGRESS_PREFIX}${examId}`;
    const stored = await AsyncStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('[OfflineStorage] Error retrieving exam progress:', error);
    return null;
  }
};

/**
 * Clear stored progress once exam is submitted.
 */
export const clearExamProgress = async (examId) => {
  try {
    const key = `${EXAM_PROGRESS_PREFIX}${examId}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn('[OfflineStorage] Error clearing exam progress:', error);
  }
};
