import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
  StatusBar,
  SafeAreaView,
  Platform,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Badge from '../components/Badge';
import BottomNavBar from '../components/BottomNavBar';

export default function ProfileScreen({ navigation }) {
  const { user, signOut, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = () => {
    setShowSignOutModal(true);
  };

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      const doSignOut = signOut || logout;
      if (doSignOut) {
        await doSignOut();
      }
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      setIsSigningOut(false);
      setShowSignOutModal(false);
    }
  };

  const role = user?.role || 'student';
  const roleBadgeVariant =
    role === 'admin' ? 'danger' : role === 'teacher' ? 'accent' : 'default';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile & Preferences</Text>
        <Text style={styles.headerSub}>
          ExamSphere Institutional Portal &bull; Role-Based Supervision
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.card}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'Exam Candidate'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'user@examsphere.edu'}</Text>
              <View style={styles.badgeRow}>
                <Badge variant={roleBadgeVariant} label={role.toUpperCase()} />
                <Text style={styles.verifiedText}>✓ Verified Profile</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.metaLabel}>Platform</Text>
              <Text style={styles.metaValue}>ExamSphere v1.0</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Integrity</Text>
              <Text style={[styles.metaValue, { color: '#0D9488' }]}>Proctor Active</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Access Scope</Text>
              <Text style={[styles.metaValue, { color: '#4F46E5' }]}>Institutional</Text>
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Notification & Security Controls</Text>

          <View style={styles.prefRow}>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefTitle}>Exam Reminders</Text>
              <Text style={styles.prefSub}>
                Push alerts 15 minutes before scheduled assessments
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.prefRow, { borderBottomWidth: 0 }]}>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefTitle}>Hardware Diagnostics</Text>
              <Text style={styles.prefSub}>
                Pre-test webcam and environment checks
              </Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: '#CBD5E1', true: '#0D9488' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Integrity Policy Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Anti-Cheat Integrity Compliance</Text>
          <Text style={styles.complianceText}>
            ExamSphere enforces real-time violation tracking (fullscreen exit, tab switches, and snapshot logging) in compliance with academic policies. All evaluations are role-gated and strictly audited.
          </Text>
        </View>

        {/* Logout Button */}
        <View style={styles.actionContainer}>
          <Button
            title="Sign Out of Session"
            variant="danger"
            size="lg"
            onPress={handleLogout}
          />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar activeScreen="Profile" navigation={navigation} />

      {/* Cross-Platform Sign Out Confirmation Modal */}
      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.signOutModalCard}>
            <View style={styles.signOutIconContainer}>
              <Text style={styles.signOutIcon}>🚪</Text>
            </View>

            <Text style={styles.signOutModalTitle}>Sign Out of ExamSphere?</Text>
            <Text style={styles.signOutModalSubtitle}>
              Are you sure you want to conclude your active session? You will be returned to the secure institutional login portal.
            </Text>

            <View style={styles.signOutBtnRow}>
              <TouchableOpacity
                style={styles.signOutCancelBtn}
                onPress={() => setShowSignOutModal(false)}
                disabled={isSigningOut}
              >
                <Text style={styles.signOutCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signOutConfirmBtn}
                onPress={handleConfirmSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.signOutConfirmText}>Yes, Sign Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  verifiedText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  metaLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  prefTextCol: {
    flex: 1,
    marginRight: 12,
  },
  prefTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  prefSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  complianceText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  actionContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  signOutModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  signOutIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signOutIcon: {
    fontSize: 28,
  },
  signOutModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  signOutModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  signOutBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  signOutCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  signOutConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
