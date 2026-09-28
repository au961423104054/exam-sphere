import axios from 'axios';
import {
  mockUsers,
  mockExams,
  mockViolations,
  mockNotifications,
  mockSnapshots,
  executeMockCode,
} from './mockData';

/**
 * Check if the application is running in explicit Demo Mode.
 * Default is FALSE: real API calls are executed and errors are propagated.
 */
export const isDemoMode = () => {
  return localStorage.getItem('examSphere_demo_mode') === 'true';
};

/**
 * Toggle explicit demo mode.
 * @param {boolean} enabled
 */
export const setDemoMode = (enabled) => {
  if (enabled) {
    localStorage.setItem('examSphere_demo_mode', 'true');
  } else {
    localStorage.removeItem('examSphere_demo_mode');
  }
};

/**
 * Configured Axios instance for ExamSphere API requests.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: Attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: propagate errors without silent masking
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Production ExamSphere API Service
 */
export const examSphereApi = {
  // System Health
  checkHealth: async () => {
    if (isDemoMode()) {
      return { success: true, data: { status: 'demo', message: 'Demo Mode Active' } };
    }
    const res = await api.get('/health');
    return res.data;
  },

  // Authentication
  auth: {
    login: async (email, password) => {
      if (isDemoMode()) {
        const matched = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        const user = matched || {
          id: `demo-${Date.now()}`,
          name: email.split('@')[0],
          email,
          role: email.includes('admin') ? 'admin' : email.includes('teacher') ? 'teacher' : 'student',
        };
        const token = `demo-token-${user.role}-${Date.now()}`;
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, data: { user, token }, message: 'Logged in (Demo Mode)' };
      }

      const res = await api.post('/auth/login', { email, password });
      if (res.data?.data?.token) {
        localStorage.setItem('token', res.data.data.token);
        if (res.data.data.user) {
          localStorage.setItem('currentUser', JSON.stringify(res.data.data.user));
        }
      }
      return res.data;
    },

    register: async ({ name, email, password, role = 'student' }) => {
      if (isDemoMode()) {
        const user = {
          id: `demo-${Date.now()}`,
          name,
          email,
          role,
        };
        const token = `demo-token-${role}-${Date.now()}`;
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, data: { user, token }, message: 'Registered (Demo Mode)' };
      }

      const res = await api.post('/auth/register', { name, email, password, role });
      if (res.data?.data?.token) {
        localStorage.setItem('token', res.data.data.token);
        if (res.data.data.user) {
          localStorage.setItem('currentUser', JSON.stringify(res.data.data.user));
        }
      }
      return res.data;
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    },

    getCurrentUser: () => {
      try {
        const stored = localStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    },

    forgotPassword: async (email) => {
      if (isDemoMode()) {
        return {
          success: true,
          message: 'Password reset code sent to your email (Demo Mode: 123456)',
          data: { resetToken: 'demo_token_123456', resetCode: '123456' },
        };
      }
      const res = await api.post('/auth/forgot-password', { email });
      return res.data;
    },

    resetPassword: async ({ email, token, newPassword }) => {
      if (isDemoMode()) {
        return {
          success: true,
          message: 'Password has been reset successfully. Please sign in with your new credentials.',
        };
      }
      const res = await api.post('/auth/reset-password', { email, token, newPassword });
      return res.data;
    },
  },

  // Exam Management
  exams: {
    list: async () => {
      if (isDemoMode()) {
        return { success: true, data: mockExams };
      }
      const res = await api.get('/exams');
      return res.data;
    },

    getById: async (examId) => {
      if (isDemoMode()) {
        const exam = mockExams.find((e) => e.id === examId) || mockExams[0];
        return { success: true, data: exam };
      }
      const res = await api.get(`/exams/${examId}`);
      return res.data;
    },

    create: async (examData) => {
      if (isDemoMode()) {
        const newExam = { id: `exam-${Date.now()}`, ...examData, status: 'Ready' };
        mockExams.push(newExam);
        return { success: true, data: newExam };
      }
      const res = await api.post('/exams', examData);
      return res.data;
    },

    update: async (examId, examData) => {
      if (isDemoMode()) {
        return { success: true, data: { id: examId, ...examData } };
      }
      const res = await api.patch(`/exams/${examId}`, examData);
      return res.data;
    },

    delete: async (examId) => {
      if (isDemoMode()) {
        return { success: true, data: { id: examId } };
      }
      const res = await api.delete(`/exams/${examId}`);
      return res.data;
    },
  },

  // Question Management
  questions: {
    create: async (questionData) => {
      if (isDemoMode()) {
        return { success: true, data: { id: `q-${Date.now()}`, ...questionData } };
      }
      const res = await api.post('/questions', questionData);
      return res.data;
    },

    uploadBank: async ({ examId, file, questions, questionDistribution }) => {
      if (isDemoMode()) {
        return {
          success: true,
          data: {
            totalImported: questions?.length || 10,
            countsByType: { coding: 2, mcq: 5, tf: 2, subjective: 1 }
          }
        };
      }
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('examId', examId);
        if (questionDistribution) {
          formData.append('questionDistribution', JSON.stringify(questionDistribution));
        }
        const res = await api.post('/questions/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
      }
      const res = await api.post('/questions/upload', {
        examId,
        questions,
        questionDistribution
      });
      return res.data;
    },

    listByExam: async (examId) => {
      if (isDemoMode()) {
        return { success: true, data: [] };
      }
      const res = await api.get(`/questions/exam/${examId}`);
      return res.data;
    },

    getById: async (questionId) => {
      if (isDemoMode()) {
        return { success: true, data: { id: questionId } };
      }
      const res = await api.get(`/questions/${questionId}`);
      return res.data;
    },

    update: async (questionId, questionData) => {
      if (isDemoMode()) {
        return { success: true, data: { id: questionId, ...questionData } };
      }
      const res = await api.patch(`/questions/${questionId}`, questionData);
      return res.data;
    },

    delete: async (questionId) => {
      if (isDemoMode()) {
        return { success: true, data: { id: questionId } };
      }
      const res = await api.delete(`/questions/${questionId}`);
      return res.data;
    },
  },

  // Submissions & Exam Attempts
  submissions: {
    start: async (examId, verificationSnapshotUrl = null, candidateDetails = null) => {
      let payload = {};
      if (typeof examId === 'object' && examId !== null) {
        payload = examId;
      } else {
        payload = {
          examId,
          verificationSnapshotUrl,
          candidateDetails,
          ...(candidateDetails || {})
        };
      }
      if (isDemoMode()) {
        return {
          success: true,
          data: {
            submissionId: `sub-demo-${Date.now()}`,
            id: `sub-demo-${Date.now()}`,
            examId: payload.examId,
            status: 'in-progress',
            snapshotIntervalSeconds: 45,
            candidateDetails: payload.candidateDetails,
          },
        };
      }
      const res = await api.post('/submissions/start', payload);
      return res.data;
    },

    saveAnswer: async (submissionId, { questionId, selectedOption, answerText, code, language }) => {
      if (isDemoMode()) {
        return { success: true, data: { questionId, saved: true } };
      }
      const res = await api.post(`/submissions/${submissionId}/answer`, {
        questionId,
        selectedOption,
        answerText,
        code,
        language,
      });
      return res.data;
    },

    saveAnswers: async (submissionId, answers) => {
      if (isDemoMode()) {
        return { success: true, data: { count: answers.length } };
      }
      const res = await api.post(`/submissions/${submissionId}/answers`, { answers });
      return res.data;
    },

    runCode: async (submissionId, { code, language, questionId, testCases }) => {
      if (isDemoMode()) {
        const result = await executeMockCode(language, code, testCases);
        return { success: true, data: result };
      }
      const res = await api.post(`/submissions/${submissionId}/run-code`, {
        code,
        language,
        questionId,
        testCases,
      });
      return res.data;
    },

    submitCode: async (submissionId, { code, language, questionId }) => {
      if (isDemoMode()) {
        return {
          success: true,
          data: {
            questionId,
            marksAwarded: 25,
            allPassed: true,
            passedCount: 3,
            totalCount: 3,
          },
        };
      }
      const res = await api.post(`/submissions/${submissionId}/submit-code`, {
        code,
        language,
        questionId,
      });
      return res.data;
    },

    finalize: async (submissionId, answers = []) => {
      if (isDemoMode()) {
        return {
          success: true,
          data: {
            submissionId,
            score: 90,
            totalMarks: 100,
            status: 'graded',
            passed: true,
            submittedAt: new Date().toISOString(),
          },
        };
      }
      const res = await api.post(`/submissions/${submissionId}/finalize`, { answers });
      return res.data;
    },

    submit: async (submissionId, answers = []) => {
      return examSphereApi.submissions.finalize(submissionId, answers);
    },

    getMine: async () => {
      if (isDemoMode()) {
        return { success: true, data: [] };
      }
      const res = await api.get('/submissions/mine');
      return res.data;
    },

    getById: async (submissionId) => {
      if (isDemoMode()) {
        return {
          success: true,
          data: { id: submissionId, score: 90, totalMarks: 100, status: 'graded' },
        };
      }
      const res = await api.get(`/submissions/${submissionId}`);
      return res.data;
    },
  },

  // Anti-Cheat & Proctoring
  proctor: {
    logViolation: async (payload) => {
      if (isDemoMode()) {
        const record = { id: `violation-${Date.now()}`, timestamp: new Date().toISOString(), ...payload };
        mockViolations.unshift(record);
        return { success: true, data: record };
      }
      const res = await api.post('/proctor/log-violation', payload);
      return res.data;
    },

    uploadSnapshot: async ({ examId, candidateEmail, imageBase64, timestamp }) => {
      if (isDemoMode()) {
        const snapshot = {
          id: `snap-${Date.now()}`,
          examId,
          candidateEmail,
          timestamp: timestamp || new Date().toISOString(),
          url: imageBase64,
        };
        mockSnapshots.push(snapshot);
        return { success: true, data: snapshot };
      }
      const res = await api.post('/proctor/snapshot', {
        examId,
        candidateEmail,
        imageBase64,
        timestamp: timestamp || new Date().toISOString(),
      });
      return res.data;
    },

    verifyIdentity: async ({
      submissionId,
      examId,
      imageBase64,
      faceDetected,
      confidenceScore,
      metadata,
      collegeId,
      collegeName,
      collegeIdPhoto,
      name,
      email,
    }) => {
      if (
        metadata?.isShutterClosed ||
        metadata?.cameraBlocked ||
        (metadata?.avgLuminance !== undefined && Number(metadata.avgLuminance) < 22)
      ) {
        throw new Error(
          'Identity verification rejected: Camera shutter is closed or lens is obstructed. Open the physical shutter slider on your webcam.'
        );
      }
      if (isDemoMode()) {
        return {
          success: true,
          data: {
            verified: true,
            verificationSnapshotUrl: imageBase64,
            collegeIdPhotoUrl: collegeIdPhoto || null,
            candidateDetails: { name, email, collegeId, collegeName, collegeIdPhotoUrl: collegeIdPhoto },
            verifiedAt: new Date().toISOString(),
          },
        };
      }
      const res = await api.post('/proctor/verify-identity', {
        submissionId,
        examId,
        imageBase64,
        faceDetected,
        confidenceScore,
        metadata,
        collegeId,
        collegeName,
        collegeIdPhoto,
        name,
        email,
      });
      return res.data;
    },

    uploadPeriodicSnapshot: async ({ submissionId, examId, imageBase64, timestamp, metadata }) => {
      if (isDemoMode()) {
        return {
          success: true,
          data: {
            snapshotUrl: imageBase64,
            timestamp: timestamp || new Date().toISOString(),
          },
        };
      }
      const res = await api.post('/proctor/periodic-snapshot', {
        submissionId,
        examId,
        imageBase64,
        timestamp: timestamp || new Date().toISOString(),
        metadata,
      });
      return res.data;
    },

    getReport: async (submissionId) => {
      if (isDemoMode()) {
        return {
          success: true,
          data: {
            submission: { id: submissionId, candidateName: 'Candidate', status: 'submitted', score: 85 },
            filmstrip: [],
            violations: [],
            stats: { totalViolations: 0, totalSnapshots: 0 },
          },
        };
      }
      const res = await api.get(`/proctor/report/${submissionId}`);
      return res.data;
    },

    getViolations: async () => {
      const res = await api.get('/proctor/violations');
      return res.data;
    },
  },

  // Notifications
  notifications: {
    list: async () => {
      if (isDemoMode()) {
        return { success: true, data: mockNotifications };
      }
      const res = await api.get('/notifications');
      return res.data;
    },

    markAsRead: async (notificationId) => {
      if (isDemoMode()) {
        const item = mockNotifications.find((n) => n.id === notificationId);
        if (item) item.read = true;
        return { success: true, data: item };
      }
      const res = await api.put(`/notifications/${notificationId}/read`);
      return res.data;
    },

    markAllAsRead: async () => {
      if (isDemoMode()) {
        mockNotifications.forEach((n) => (n.read = true));
        return { success: true, data: mockNotifications };
      }
      const res = await api.put('/notifications/read-all');
      return res.data;
    },
  },

  // Admin Management
  admin: {
    getOverviewMetrics: async () => {
      if (isDemoMode()) {
        return {
          success: true,
          data: {
            totalUsers: mockUsers.length + 1840,
            totalExams: mockExams.length,
            activeExams: mockExams.length,
            totalSubmissions: 480,
            totalViolations: mockViolations.length,
            integrityHealth: '99.1%',
          },
        };
      }
      const res = await api.get('/admin/overview');
      return res.data;
    },

    getUsers: async () => {
      if (isDemoMode()) {
        return { success: true, data: mockUsers };
      }
      const res = await api.get('/admin/users');
      return res.data;
    },

    updateUserRole: async (userId, newRole) => {
      if (isDemoMode()) {
        const user = mockUsers.find((u) => u.id === userId);
        if (user) user.role = newRole;
        return { success: true, data: user };
      }
      const res = await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      return res.data;
    },

    deleteUser: async (userId) => {
      if (isDemoMode()) {
        return { success: true, message: 'User deleted (Demo Mode)' };
      }
      const res = await api.delete(`/admin/users/${userId}`);
      return res.data;
    },

    getViolations: async () => {
      if (isDemoMode()) {
        return { success: true, data: mockViolations };
      }
      const res = await api.get('/admin/violations');
      return res.data;
    },

    updateViolationStatus: async (violationId, status) => {
      if (isDemoMode()) {
        return { success: true, data: { id: violationId, status } };
      }
      const res = await api.patch(`/admin/violations/${violationId}/status`, { status });
      return res.data;
    },
  },
};

export default api;
