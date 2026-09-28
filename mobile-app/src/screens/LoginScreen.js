import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Switch,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { loginUser, forgotPassword, resetPassword } from '../services/api';
import Button from '../components/Button';

const REMEMBER_ME_KEY = 'examsphere_mobile_remember_me';
const SAVED_EMAIL_KEY = 'examsphere_mobile_saved_email';

export default function LoginScreen({ navigation }) {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('candidate@examsphere.io');
  const [password, setPassword] = useState('Password@123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Forgot Password Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1 = request code, 2 = set password
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const { signIn } = useAuth();

  // Load remembered credentials on mount
  useEffect(() => {
    const loadRemembered = async () => {
      try {
        const savedRemember = await AsyncStorage.getItem(REMEMBER_ME_KEY);
        const savedEmail = await AsyncStorage.getItem(SAVED_EMAIL_KEY);
        if (savedRemember === 'true' && savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        } else if (savedRemember === 'false') {
          setRememberMe(false);
        }
      } catch (err) {
        console.warn('Failed to load remembered email:', err);
      }
    };
    loadRemembered();
  }, []);

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setErrorMsg('');
    setSuccessMsg('');
    if (!rememberMe) {
      if (selectedRole === 'student') {
        setEmail('candidate@examsphere.io');
        setPassword('Password@123');
      } else {
        setEmail('teacher@examsphere.edu');
        setPassword('teacher123');
      }
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Save or remove Remember Me
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBER_ME_KEY, 'true');
        await AsyncStorage.setItem(SAVED_EMAIL_KEY, email);
      } else {
        await AsyncStorage.setItem(REMEMBER_ME_KEY, 'false');
        await AsyncStorage.removeItem(SAVED_EMAIL_KEY);
      }

      const res = await loginUser({ email, password });
      const token = res.data?.token || 'demo_token_' + Date.now();
      const userData = res.data?.user || {
        email,
        role,
        name: role === 'teacher' ? 'Prof. Alan Turing' : 'Candidate Student',
      };

      await signIn(token, userData);

      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Main');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Open Forgot Password Modal
  const openForgotModal = () => {
    setForgotEmail(email || 'candidate@examsphere.io');
    setModalStep(1);
    setResetCode('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setModalError('');
    setModalSuccess('');
    setModalVisible(true);
  };

  // Step 1: Request Reset Code
  const handleRequestReset = async () => {
    if (!forgotEmail) {
      setModalError('Please enter your account email.');
      return;
    }

    setModalLoading(true);
    setModalError('');
    setModalSuccess('');

    try {
      const res = await forgotPassword(forgotEmail);
      const data = res.data || {};
      if (data.resetToken) setResetToken(data.resetToken);
      if (data.resetCode) setResetCode(data.resetCode);

      setModalSuccess(res.message || 'Reset code generated! Check your email or use the code below.');
      setModalStep(2);
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to request reset code.');
    } finally {
      setModalLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setModalError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalError('Passwords do not match.');
      return;
    }

    setModalLoading(true);
    setModalError('');
    setModalSuccess('');

    try {
      const res = await resetPassword({
        email: forgotEmail,
        token: resetToken || resetCode,
        newPassword,
      });

      setModalSuccess(res.message || 'Password reset successfully!');
      setEmail(forgotEmail);
      setPassword(newPassword);
      setSuccessMsg('Password updated! You can now sign in with your new password.');

      setTimeout(() => {
        setModalVisible(false);
      }, 1600);
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to reset password.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header & Logo */}
          <View style={styles.header}>
            <View style={styles.logoSquircle}>
              <Image
                source={require('../../assets/branding/examsphere-mark.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.logoTitle}>
              Exam<Text style={styles.logoAccent}>Sphere</Text>
            </Text>
            <Text style={styles.subtitle}>
              Secure institutional assessment & proctoring platform
            </Text>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            {/* Role Switcher */}
            <Text style={styles.sectionLabel}>Select Portal Role</Text>
            <View style={styles.roleGrid}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.roleCard, role === 'student' && styles.roleCardActive]}
                onPress={() => handleRoleChange('student')}
              >
                <Text style={styles.roleEmoji}>👨‍🎓</Text>
                <View>
                  <Text style={[styles.roleTitle, role === 'student' && styles.roleTitleActive]}>
                    Candidate
                  </Text>
                  <Text style={styles.roleSub}>Student Portal</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.roleCard, role === 'teacher' && styles.roleCardActive]}
                onPress={() => handleRoleChange('teacher')}
              >
                <Text style={styles.roleEmoji}>👨‍🏫</Text>
                <View>
                  <Text style={[styles.roleTitle, role === 'teacher' && styles.roleTitleActive]}>
                    Educator
                  </Text>
                  <Text style={styles.roleSub}>Teacher Studio</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Success Notification */}
            {successMsg ? (
              <View style={styles.successBox}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            ) : null}

            {/* Error Notification */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Institutional Email</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrorMsg('');
                  }}
                  placeholder="name@university.edu"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={openForgotModal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.forgotLink}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrorMsg('');
                  }}
                  placeholder="••••••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me Toggle */}
            <View style={styles.rememberMeRow}>
              <View style={styles.rememberMeLeft}>
                <Switch
                  value={rememberMe}
                  onValueChange={(val) => setRememberMe(val)}
                  trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
                  thumbColor={rememberMe ? '#4F46E5' : '#F1F5F9'}
                  style={styles.switchControl}
                />
                <Text style={styles.rememberMeText}>Remember me on this device</Text>
              </View>
            </View>

            {/* Primary Submit */}
            <Button
              title="Sign In to Portal →"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={styles.submitBtn}
            />

            {/* Create Account Link */}
            <Button
              title="Create New Account (Register)"
              onPress={() => navigation.navigate('Register')}
              variant="secondary"
              size="md"
              style={styles.registerBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboardContainer}
          >
            <View style={styles.modalCard}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitleRow}>
                  <Text style={styles.modalHeaderIcon}>🔑</Text>
                  <View>
                    <Text style={styles.modalTitle}>Reset Account Password</Text>
                    <Text style={styles.modalSubtitle}>
                      {modalStep === 1 ? 'Step 1: Request verification code' : 'Step 2: Enter code & set password'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Modal Alerts */}
              {modalSuccess ? (
                <View style={styles.successBox}>
                  <Text style={styles.successIcon}>✅</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.successText}>{modalSuccess}</Text>
                    {resetCode ? (
                      <Text style={styles.codeBadge}>Verification Code: {resetCode}</Text>
                    ) : null}
                  </View>
                </View>
              ) : null}

              {modalError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{modalError}</Text>
                </View>
              ) : null}

              {/* Step 1: Request Code Form */}
              {modalStep === 1 ? (
                <View style={styles.modalBody}>
                  <Text style={styles.modalDesc}>
                    Enter your registered email address to receive a secure password reset verification code.
                  </Text>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Account Email</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputIcon}>✉️</Text>
                      <TextInput
                        style={styles.input}
                        value={forgotEmail}
                        onChangeText={(t) => {
                          setForgotEmail(t);
                          setModalError('');
                        }}
                        placeholder="candidate@examsphere.io"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalCancelBtn}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalPrimaryBtn}
                      onPress={handleRequestReset}
                      disabled={modalLoading}
                    >
                      {modalLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.modalPrimaryText}>Send Reset Code →</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* Step 2: Set New Password Form */
                <View style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Verification Code / OTP</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputIcon}>🔢</Text>
                      <TextInput
                        style={styles.input}
                        value={resetCode}
                        onChangeText={(t) => {
                          setResetCode(t);
                          setModalError('');
                        }}
                        placeholder="Enter 6-digit code"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>New Password (min. 6 chars)</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputIcon}>🔒</Text>
                      <TextInput
                        style={styles.input}
                        value={newPassword}
                        onChangeText={(t) => {
                          setNewPassword(t);
                          setModalError('');
                        }}
                        placeholder="••••••••••••"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showNewPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        style={styles.eyeBtn}
                      >
                        <Text style={styles.eyeIcon}>{showNewPassword ? '👁️' : '👁️‍🗨️'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm New Password</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputIcon}>🔒</Text>
                      <TextInput
                        style={styles.input}
                        value={confirmPassword}
                        onChangeText={(t) => {
                          setConfirmPassword(t);
                          setModalError('');
                        }}
                        placeholder="Repeat new password"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showNewPassword}
                      />
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalBackStepBtn}
                      onPress={() => {
                        setModalStep(1);
                        setModalError('');
                      }}
                    >
                      <Text style={styles.modalBackStepText}>← Resend</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalPrimaryBtn}
                      onPress={handleResetPassword}
                      disabled={modalLoading}
                    >
                      {modalLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.modalPrimaryText}>Update Password</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoSquircle: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: '#4F46E5',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 280,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  roleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 8,
  },
  roleCardActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
  },
  roleEmoji: {
    fontSize: 20,
  },
  roleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  roleTitleActive: {
    color: '#312E81',
    fontWeight: '800',
  },
  roleSub: {
    fontSize: 10,
    color: '#64748B',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  successIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  successText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
  },
  codeBadge: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#047857',
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '700',
    paddingVertical: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  eyeBtn: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 14,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 2,
  },
  rememberMeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchControl: {
    transform: Platform.OS === 'ios' ? [{ scaleX: 0.8 }, { scaleY: 0.8 }] : [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  rememberMeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 4,
  },
  registerBtn: {
    marginTop: 10,
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalKeyboardContainer: {
    width: '100%',
    maxWidth: 420,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalHeaderIcon: {
    fontSize: 22,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '700',
  },
  modalDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  modalBody: {
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalBackStepBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  modalBackStepText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  modalPrimaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
