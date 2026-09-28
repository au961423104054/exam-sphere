import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { downloadAndShareCertificate } from '../services/certificateService';
import Badge from '../components/Badge';
import Button from '../components/Button';
import BottomNavBar from '../components/BottomNavBar';

export default function ResultsScreen({ route, navigation }) {
  const params = route.params || {};
  const score = params.score ?? 85;
  const totalMarks = params.totalMarks ?? 100;
  const violationsCount = params.violationsCount ?? 0;
  const autoSubmitted = params.autoSubmitted ?? false;
  const autoSubmitReason = params.autoSubmitReason;
  const examId = params.examId || 'exam_101';
  const examTitle = params.examTitle || 'Full-Stack MERN Architecture Assessment';
  const candidateName = params.candidateName || 'Alex Student';
  const isPassed = score >= 50 && violationsCount < 3;

  const [isDownloadingCert, setIsDownloadingCert] = useState(false);

  const handleDownloadCertificate = async () => {
    try {
      setIsDownloadingCert(true);
      const res = await downloadAndShareCertificate({
        candidateName,
        examTitle,
        score,
        totalMarks,
        percentage: `${Math.round((score / totalMarks) * 100)}%`,
        grade: score >= 80 ? 'Grade A - Distinction' : 'Grade B - Credit',
        issueDate: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      });

      if (!res.success && res.error) {
        Alert.alert('Notice', 'Unable to generate scorecard PDF.');
      }
    } finally {
      setIsDownloadingCert(false);
    }
  };

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
              ? 'Congratulations! You have passed the official assessment criteria.'
              : 'Your score has been computed. Review performance metrics below.'}
          </Text>
        </View>

        {/* Score Card */}
        <View style={styles.card}>
          <Text style={styles.scoreLabel}>Final Assessment Score</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreValue, isPassed ? styles.textIndigo : styles.textRed]}>
              {score}
            </Text>
            <Text style={styles.scoreTotal}> / {totalMarks}</Text>
          </View>

          <Badge
            variant={isPassed ? 'success' : 'danger'}
            label={isPassed ? 'Status: PASSED (Grade A)' : autoSubmitted ? 'FLAGGED / AUTO-SUBMITTED' : 'Status: FAILED'}
            style={styles.statusBadge}
          />
        </View>

        {/* Proctoring Verification Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Proctoring & Integrity Audit</Text>

          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Violations Triggered</Text>
            <Badge
              variant={violationsCount === 0 ? 'success' : violationsCount < 3 ? 'warning' : 'danger'}
              label={`${violationsCount} Incidents`}
            />
          </View>

          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Screen Capture Shield</Text>
            <Text style={styles.auditValue}>Hardware Enforced</Text>
          </View>

          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>App-Switching Monitor</Text>
            <Text style={styles.auditValue}>Verified</Text>
          </View>

          <View style={[styles.auditRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.auditLabel}>Integrity Status</Text>
            <Text style={[styles.auditValue, violationsCount < 3 ? styles.textGreen : styles.textRed]}>
              {violationsCount < 3 ? 'Verified Valid Session' : 'Breach Limit Exceeded'}
            </Text>
          </View>
        </View>

        {/* Grading Engine Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Grading Engine Summary</Text>
          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Objective Grading</Text>
            <Text style={styles.auditValue}>Automated (MCQ/TF)</Text>
          </View>
          <View style={styles.auditRow}>
            <Text style={styles.auditLabel}>Code Test Runner</Text>
            <Text style={styles.auditValue}>Automated Sandbox Executed</Text>
          </View>
          <View style={[styles.auditRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.auditLabel}>Recorded In Database</Text>
            <Text style={styles.auditValue}>MongoDB Submission Audit Log</Text>
          </View>
        </View>

        {/* Scorecard Action */}
        {isPassed && (
          <Button
            title="📄 Download Official Scorecard (PDF)"
            onPress={handleDownloadCertificate}
            loading={isDownloadingCert}
            variant="accent"
            size="lg"
            style={styles.actionBtn}
          />
        )}

        {/* Leaderboard CTA */}
        <Button
          title="🏆 View Live Leaderboard Rankings"
          onPress={() =>
            navigation.navigate('Leaderboard', {
              examId,
              examTitle,
              score,
              totalMarks,
            })
          }
          variant="secondary"
          size="lg"
          style={styles.actionBtn}
        />

        {/* Return to Dashboard */}
        <Button
          title="Return to Examinations →"
          onPress={() => navigation.navigate('ExamList')}
          variant="primary"
          size="lg"
          style={styles.actionBtn}
        />
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNavBar activeScreen="ExamList" navigation={navigation} />
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
    paddingBottom: 28,
    alignItems: 'center',
  },
  bannerBox: {
    alignItems: 'center',
    marginBottom: 18,
    width: '100%',
  },
  bannerEmoji: {
    fontSize: 42,
    marginBottom: 8,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 320,
    fontFamily: 'Inter_400Regular',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Inter_600SemiBold',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 8,
  },
  scoreValue: {
    fontSize: 46,
    fontWeight: '900',
    fontFamily: 'Inter_700Bold',
  },
  scoreTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#94A3B8',
    fontFamily: 'Inter_600SemiBold',
  },
  textIndigo: {
    color: '#4F46E5',
  },
  textRed: {
    color: '#EF4444',
  },
  textGreen: {
    color: '#10B981',
  },
  statusBadge: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    alignSelf: 'flex-start',
    marginBottom: 10,
    fontFamily: 'Inter_700Bold',
  },
  auditRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  auditLabel: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Inter_500Medium',
  },
  auditValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter_600SemiBold',
  },
  actionBtn: {
    width: '100%',
    marginBottom: 10,
  },
});
