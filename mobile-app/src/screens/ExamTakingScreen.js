import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';

const SAMPLE_QUESTIONS = [
  {
    id: 'q1',
    prompt: 'In Node.js event-driven architecture, what mechanism handles asynchronous I/O operations non-blockingly?',
    options: [
      'The V8 Garbage Collector',
      'The Libuv Event Loop',
      'Child Process Forking Pool',
      'Synchronous Thread Pool',
    ],
    correctIndex: 1,
  },
  {
    id: 'q2',
    prompt: 'Which MongoDB index type is most suitable for queries performing text searches across string content?',
    options: [
      'Compound Index',
      'Geospatial 2dsphere Index',
      'Text Index',
      'Hashed Index',
    ],
    correctIndex: 2,
  },
  {
    id: 'q3',
    prompt: 'Which React Native component provides optimal virtualization performance for large, dynamic scrollable lists?',
    options: [
      'ScrollView',
      'FlatList',
      'View with overflow scroll',
      'VirtualizedSectionMatrix',
    ],
    correctIndex: 1,
  },
];

export default function ExamTakingScreen({ route, navigation }) {
  const exam = route.params?.exam || { title: 'Exam in Progress' };
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [secondsRemaining, setSecondsRemaining] = useState(3600);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (idx) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentIdx]: idx,
    });
  };

  const handleFinishExam = () => {
    // Calculate sample score
    let score = 0;
    SAMPLE_QUESTIONS.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctIndex) {
        score += 33.33;
      }
    });

    const roundedScore = Math.min(100, Math.round(score));
    navigation.navigate('Results', {
      exam,
      score: roundedScore,
      totalMarks: 100,
      answeredCount: Object.keys(selectedAnswers).length,
      totalQuestions: SAMPLE_QUESTIONS.length,
    });
  };

  const question = SAMPLE_QUESTIONS[currentIdx];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.examName} numberOfLines={1}>{exam.title}</Text>
          <Text style={styles.questionCounter}>
            Question {currentIdx + 1} of {SAMPLE_QUESTIONS.length}
          </Text>
        </View>
        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>Time Left</Text>
          <Text style={styles.timerValue}>{formatTimer(secondsRemaining)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.questionCard}>
          <Text style={styles.questionPrompt}>{question.prompt}</Text>
        </View>

        <View style={styles.optionsList}>
          {question.options.map((opt, idx) => {
            const isSelected = selectedAnswers[currentIdx] === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => handleSelectOption(idx)}
              >
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navBtn, currentIdx === 0 && styles.navBtnDisabled]}
          disabled={currentIdx === 0}
          onPress={() => setCurrentIdx((i) => Math.max(0, i - 1))}
        >
          <Text style={styles.navBtnText}>← Previous</Text>
        </TouchableOpacity>

        {currentIdx < SAMPLE_QUESTIONS.length - 1 ? (
          <TouchableOpacity
            style={styles.navBtnPrimary}
            onPress={() => setCurrentIdx((i) => Math.min(SAMPLE_QUESTIONS.length - 1, i + 1))}
          >
            <Text style={styles.navBtnPrimaryText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleFinishExam}
          >
            <Text style={styles.submitBtnText}>Submit Exam ✓</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  examName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: 220,
  },
  questionCounter: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  timerBox: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 10,
    color: '#991B1B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timerValue: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  content: {
    padding: 16,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  questionPrompt: {
    fontSize: 16,
    lineHeight: 24,
    color: '#0F172A',
    fontWeight: '600',
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: '#2563EB',
  },
  radioDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  optionText: {
    fontSize: 14,
    color: '#334155',
    flex: 1,
    lineHeight: 20,
  },
  optionTextSelected: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    color: '#475569',
    fontWeight: '600',
  },
  navBtnPrimary: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  navBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submitBtn: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    backgroundColor: '#16A34A',
    borderRadius: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
