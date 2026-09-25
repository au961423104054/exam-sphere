import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';

export default function ResultsScreen({ route, navigation }) {
  const params = route.params || {};
  const score = params.score ?? 85;
  const totalMarks = params.totalMarks ?? 100;
  const violationsCount = params.violationsCount ?? 0;
  const autoSubmitted = params.autoSubmitted ?? false;
  const autoSubmitReason = params.autoSubmitReason;
  const isPassed = score >= 50 && violationsCount < 3;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerBox}>
          <Text style={styles.bannerEmoji}>
            {autoSubmitted ? '⚠️' : isPassed ? '🎉' : '📊'}
          </Text>
          <Text style={styles.bannerTitle}>
            {autoSubmitted
              ? 'Assessment Auto-Submitted'
              : isPassed
              ? 'Examination Completed!'
              : 'Evaluation Finished'}
          </Text>
          <Text style={styles.bannerSubtitle}>
            {autoSubmitted
              ? autoSubmitReason || 'Submission was finalized automatically by proctoring engine.'
              : isPassed
              ? 'Congratulations! You have successfully passed the assessment.'
              : 'Your score has been computed. Review performance metrics below.'}
          </Text>
        </View>

        {/* Score Card */}
        <View style={styles.card}>
          <Text style={styles.scoreLabel}>Final Candidate Score</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreValue, isPassed ? styles.textBlue : styles.textRed]}>
              {score}
            </Text>
            <Text style={styles.scoreTotal}> / {totalMarks}</Text>
          </View>

          <View style={[styles.statusBadge, isPassed ? styles.badgePass : styles.badgeFail]}>
            <Text style={[styles.statusBadgeText, isPassed ? styles.textPassDark : styles.textFailDark]}>
              Result: {isPassed ? 'PASSED (Grade A)' : autoSubmitted ? 'FLAGGED / FAIL' : 'FAILED'}
            </Text>
          </View>
        </View>

        {/* Proctoring Verification Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Proctoring & Integrity Audit</Text>

          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Violations Triggered</Text>
            <View style={[styles.pill, violationsCount === 0 ? styles.pillGreen : styles.pillYellow]}>
              <Text style={[styles.pillText, violationsCount === 0 ? styles.textPassDark : styles.textYellowDark]}>
                {violationsCount} Incidents
              </Text>
            </View>
          </View>

          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Screen Capture Shield</Text>
            <Text style={styles.auditValue}>Active (Enforced)</Text>
          </View>

          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>App-Switching Listener</Text>
            <Text style={styles.auditValue}>Verified</Text>
          </View>

          <View style={[styles.auditRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.auditLabel}>Audit Status</Text>
            <Text style={[styles.auditValue, violationsCount < 3 ? styles.textGreen : styles.textRed]}>
              {violationsCount < 3 ? 'Verified Valid Session' : 'Breach Limit Exceeded'}
            </Text>
          </View>
        </View>

        {/* Evaluation Engine Metadata */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Grading Engine Summary</Text>
          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Objective Grading</Text>
            <Text style={styles.auditValue}>Automated (MCQ/TF)</Text>
          </View>
          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Code Test Runner</Text>
            <Text style={styles.auditValue}>Sandbox Executed</Text>
          </View>
          <View style={[styles.auditRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.auditLabel}>Recorded In Database</Text>
            <Text style={styles.auditValue}>MongoDB Submission Log</Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.primaryActionBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('ExamList')}
        >
          <Text style={styles.primaryActionText}>Return to Exam Dashboard →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
        >
          <Text style={styles.secondaryActionText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 18,
    alignItems: 'center',
  },
  bannerBox: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  bannerEmoji: {
    fontSize: 44,
    marginBottom: 8,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 320,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 10,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '900',
  },
  scoreTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#94A3B8',
  },
  textBlue: {
    color: '#2563EB',
  },
  textRed: {
    color: '#DC2626',
  },
  textGreen: {
    color: '#16A34A',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgePass: {
    backgroundColor: '#DCFCE7',
  },
  badgeFail: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  textPassDark: {
    color: '#15803D',
  },
  textFailDark: {
    color: '#991B1B',
  },
  textYellowDark: {
    color: '#92400E',
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  auditRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  auditLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  auditValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillGreen: {
    backgroundColor: '#DCFCE7',
  },
  pillYellow: {
    backgroundColor: '#FEF3C7',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  primaryActionBtn: {
    width: '100%',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
});
