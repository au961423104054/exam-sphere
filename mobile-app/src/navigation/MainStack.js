import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExamListScreen from '../screens/ExamListScreen';
import ExamDetailScreen from '../screens/ExamDetailScreen';
import ExamTakingScreen from '../screens/ExamTakingScreen';
import ResultsScreen from '../screens/ResultsScreen';

const Stack = createNativeStackNavigator();

export default function MainStack() {
  return (
    <Stack.Navigator
      initialRouteName="ExamList"
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#0F172A',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#F8FAFC' },
      }}
    >
      <Stack.Screen
        name="ExamList"
        component={ExamListScreen}
        options={{ headerShown: false, title: 'Examinations' }}
      />
      <Stack.Screen
        name="ExamDetail"
        component={ExamDetailScreen}
        options={{ title: 'Exam Guidelines' }}
      />
      <Stack.Screen
        name="ExamTaking"
        component={ExamTakingScreen}
        options={{
          title: 'Active Assessment',
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={{
          title: 'Performance Report',
          headerBackVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}
