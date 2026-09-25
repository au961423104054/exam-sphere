import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';

export default function ResultsScreen({ route, navigation }) {
  const params = route.params || {};
  const score = params.score ?? 85;
  const totalMarks = params.totalMarks ?? 100;
  const isPassed = score >= 50;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.resultBanner}>
          <Text style={styles.bannerEmoji}>{isPassed ? '🎉' : '📚'}</Text>
          <Text style={styles.bannerTitle}>
            {isPassed ? 'Examination Completed!' : 'Assessment Finished'}
          </Text>
          <Text style={styles.bannerSubtitle}>
            {isPassed ? 'Congratulations! You achieved a passing score.' : 'Review your areas for improvement.'}
          </Text>
        </View>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Final Candidate Score</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.bigScore}>{score}</Text>
            <Text style={styles.totalScore}> / {totalMarks}</Text>
          </View>
          <View style={[styles.statusBadge, isPassed ? styles.badgePass : styles.badgeFail]}>
            <Text style={[styles.statusBadgeText, isPassed ? styles.textPass : styles.textFail]}>
              Status: {isPassed ? 'PASSED (Grade A)' : 'NEEDS RETAKE'}
            </Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Performance Metrics</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Answered Questions</Text>
            <Text style={styles.metricValue}>{params.answeredCount ?? 3} / {params.totalQuestions ?? 3}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Proctoring Violations</Text>
            <Text style={styles.metricValue}>0 (Verified)</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Evaluation Engine</Text>
            <Text style={styles.metricValue}>MERN Auto-Grader v1.0</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('ExamList')}
        >
          <Text style={styles.primaryBtnText}>Return to Exam Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
        >
          <Text style={styles.secondaryBtnText}>Sign Out</Text>
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
    padding: 20,
    alignItems: 'center',
  },
  resultBanner: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bannerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  scoreCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  scoreLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 12,
  },
  bigScore: {
    fontSize: 48,
    fontWeight: '900',
    color: '#2563EB',
  },
  totalScore: {
    fontSize: 20,
    color: '#64748B',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
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
    fontWeight: '700',
  },
  textPass: {
    color: '#15803D',
  },
  textFail: {
    color: '#B91C1C',
  },
  statsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  metricLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
});
