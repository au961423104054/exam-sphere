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
import Badge from '../components/Badge';
import Button from '../components/Button';

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
        {/* Main Overview Card */}
        <View style={styles.card}>
          <View style={styles.topBadgeRow}>
            <Badge variant="default" label={exam.category || 'Computer Science'} />
            <Badge variant="accent" label="Proctoring Enforced" />
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
                <Text style={styles.specValue}>{exam.totalQuestions || exam.questions?.length || 4} Questions</Text>
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
                <Text style={[styles.specValue, styles.textIndigo]}>
                  {hasCodingQuestions ? 'Yes (Live Runner Active)' : 'None'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Proctoring Protocol Card */}
        <View style={[styles.card, styles.proctorCard]}>
          <View style={styles.proctorHeader}>
            <View style={styles.proctorIconBox}>
              <Text style={styles.proctorIcon}>🛡️</Text>
            </View>
            <View style={styles.proctorHeaderTitleBlock}>
              <Text style={styles.proctorTitle}>Active Proctoring & Integrity Rules</Text>
              <Text style={styles.proctorSub}>
                Violation Threshold: Max {exam.violationThreshold || 3} incidents permitted
              </Text>
            </View>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>Screen Capture & Recording Prevention:</Text> Screen recording and screenshot captures are intercepted and logged directly to the supervisory audit trail.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>App Switching Detection:</Text> Leaving or minimizing this exam session registers a violation. Reaching {exam.violationThreshold || 3} incidents will trigger immediate automatic submission.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>Answer State Persistence:</Text> Code entries and selected choices are continually synchronized and cached locally for offline tolerance.
            </Text>
          </View>
        </View>

        {/* Start Assessment CTA */}
        <Button
          title="Acknowledge & Begin Examination →"
          onPress={handleStartExam}
          disabled={loading}
          size="lg"
          variant="primary"
          style={styles.startBtn}
        />

        <Button
          title="← Return to Exam Dashboard"
          onPress={() => navigation.goBack()}
          variant="secondary"
          size="md"
          style={styles.cancelBtn}
        />
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
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  topBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
    lineHeight: 26,
    marginBottom: 8,
  },
  desc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    fontFamily: 'Inter_400Regular',
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specLabel: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Inter_500Medium',
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
  },
  textRed: {
    color: '#EF4444',
  },
  textGreen: {
    color: '#10B981',
  },
  textIndigo: {
    color: '#4F46E5',
  },
  proctorCard: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FDE68A',
  },
  proctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  proctorIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  proctorIcon: {
    fontSize: 20,
  },
  proctorHeaderTitleBlock: {
    flex: 1,
  },
  proctorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    fontFamily: 'Inter_700Bold',
  },
  proctorSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
    marginTop: 2,
    fontFamily: 'Inter_500Medium',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#B45309',
    marginRight: 6,
    lineHeight: 18,
  },
  ruleText: {
    flex: 1,
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
    fontFamily: 'Inter_400Regular',
  },
  ruleBold: {
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  startBtn: {
    marginBottom: 10,
  },
  cancelBtn: {
    marginBottom: 10,
  },
});
