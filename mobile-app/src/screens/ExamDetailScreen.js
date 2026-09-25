import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { fetchExamDetails } from '../services/api';
import Skeleton from '../components/Skeleton';

export default function ExamDetailScreen({ route, navigation }) {
  const initialExam = route.params?.exam || {};
  const [exam, setExam] = useState(initialExam);
  const [loading, setLoading] = useState(!initialExam.questions);

  useEffect(() => {
    if (!initialExam.questions) {
      const load = async () => {
        const details = await fetchExamDetails(initialExam.id || initialExam._id || 'exam_101');
        setExam(details);
        setLoading(false);
      };
      load();
    }
  }, [initialExam]);

  const handleStartExam = () => {
    navigation.navigate('ExamTaking', { exam });
  };

  const hasCodingQuestions = (exam.questions || []).some((q) => q.type === 'coding');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Card */}
        <View style={styles.card} className="bg-white rounded-xl p-5 mb-4 border border-slate-200">
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{exam.category || 'Computer Science'}</Text>
          </View>
          <Text style={styles.title}>{exam.title || 'Examination'}</Text>
          <Text style={styles.desc}>
            {exam.description ||
              'Standard assessment containing objective multiple-choice and interactive algorithmic programming challenges.'}
          </Text>
        </View>

        {/* Specifications Grid */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Examination Structure</Text>

          {loading ? (
            <View style={{ gap: 10, marginVertical: 8 }}>
              <Skeleton width="100%" height={24} />
              <Skeleton width="100%" height={24} />
              <Skeleton width="100%" height={24} />
            </View>
          ) : (
            <>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Duration</Text>
                <Text style={styles.specValue}>{exam.durationMinutes || exam.duration || 60} Minutes</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Total Questions</Text>
                <Text style={styles.specValue}>{exam.totalQuestions || exam.questions?.length || 4}</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Total Marks</Text>
                <Text style={styles.specValue}>{exam.totalMarks || 100} Points</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Negative Marking</Text>
                <Text style={[styles.specValue, exam.negativeMarking ? styles.textRed : styles.textGreen]}>
                  {exam.negativeMarking ? 'Active (-0.25 on MCQ)' : 'Disabled'}
                </Text>
              </View>
              <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.specLabel}>Programming Questions</Text>
                <Text style={[styles.specValue, { color: '#2563EB' }]}>
                  {hasCodingQuestions ? 'Yes (Live Runner Active)' : 'None'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Proctoring Protocol Card */}
        <View style={[styles.card, styles.proctorCard]}>
          <View style={styles.proctorHeader}>
            <Text style={styles.proctorIcon}>🛡️</Text>
            <View>
              <Text style={styles.proctorTitle}>Active Proctoring & Integrity Rules</Text>
              <Text style={styles.proctorSub}>
                Violation Threshold: Max {exam.violationThreshold || 3} incidents allowed
              </Text>
            </View>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>Screenshot & Screen Recording Prevention</Text> is enforced. Screen capture is blocked on Android; recording and capture attempts on iOS are logged as violations.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>App Switching Detection:</Text> Leaving or backgrounding this application records a violation. Reaching {exam.violationThreshold || 3} violations triggers automatic exam submission.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>Answer State Persistence:</Text> Code entries and answers are synchronized and cached for offline safety.
            </Text>
          </View>
        </View>

        {/* Start CTA */}
        <TouchableOpacity
          style={styles.startBtn}
          activeOpacity={0.8}
          onPress={handleStartExam}
          disabled={loading}
        >
          <Text style={styles.startBtnText}>Acknowledge & Begin Examination →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelBtnText}>← Return to Exam Dashboard</Text>
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
  },
  card: {
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
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 28,
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 14,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  specValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  textRed: {
    color: '#DC2626',
  },
  textGreen: {
    color: '#16A34A',
  },
  proctorCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  proctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  proctorIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  proctorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
  },
  proctorSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
    marginTop: 2,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#92400E',
    marginRight: 6,
    lineHeight: 20,
  },
  ruleText: {
    flex: 1,
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  ruleBold: {
    fontWeight: '700',
  },
  startBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
});
