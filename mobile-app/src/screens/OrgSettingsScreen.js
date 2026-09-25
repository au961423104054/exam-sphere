import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import { useOrg } from '../context/OrgContext';
import { useAuth } from '../context/AuthContext';

export default function OrgSettingsScreen({ navigation }) {
  const { activeOrg, organizations, switchOrg, updateOrgPolicies } = useOrg();
  const { user } = useAuth();

  const [strictAudio, setStrictAudio] = useState(
    activeOrg.proctorPolicies?.strictAudioCheck || false
  );
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  const handleToggleStrictAudio = (val) => {
    setStrictAudio(val);
    updateOrgPolicies(activeOrg.id, { strictAudioCheck: val });
  };

  const handleSwitchOrg = (org) => {
    switchOrg(org.id);
    setStrictAudio(org.proctorPolicies?.strictAudioCheck || false);
    Alert.alert(
      'Organization Switched',
      `You are now viewing assessments and records for ${org.name}.`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Organization Hero Card */}
        <View style={[styles.heroCard, { borderTopColor: activeOrg.brandColor || '#4F46E5' }]}>
          <View style={[styles.logoCircle, { backgroundColor: `${activeOrg.brandColor}15` }]}>
            <Text style={styles.logoIcon}>{activeOrg.logoIcon || '🏛️'}</Text>
          </View>

          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.orgName} numberOfLines={2}>
                {activeOrg.name}
              </Text>
              {activeOrg.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ VERIFIED</Text>
                </View>
              )}
            </View>

            <Text style={styles.orgDomain}>🌐 {activeOrg.domain}</Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.planPill}>
                <Text style={styles.planPillText}>{activeOrg.plan}</Text>
              </View>
              <Text style={styles.codeText}>Code: {activeOrg.code}</Text>
            </View>
          </View>
        </View>

        {/* Multi-Tenancy Organization Switcher */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Your Academic Institutions</Text>
          <Text style={styles.sectionSub}>
            Switch active organization to access different department exams
          </Text>

          {organizations.map((org) => {
            const isSelected = org.id === activeOrg.id;
            return (
              <TouchableOpacity
                key={org.id}
                style={[styles.orgItem, isSelected && styles.orgItemSelected]}
                onPress={() => handleSwitchOrg(org)}
                activeOpacity={0.7}
              >
                <View style={styles.orgItemLeft}>
                  <View style={styles.orgItemIconCircle}>
                    <Text style={styles.orgItemIcon}>{org.logoIcon}</Text>
                  </View>
                  <View style={styles.orgItemInfo}>
                    <Text style={[styles.orgItemName, isSelected && styles.textIndigoBold]}>
                      {org.name}
                    </Text>
                    <Text style={styles.orgItemRole}>
                      {org.memberRole} • {org.code}
                    </Text>
                  </View>
                </View>

                {isSelected ? (
                  <View style={styles.activeCheckPill}>
                    <Text style={styles.activeCheckText}>Active ✓</Text>
                  </View>
                ) : (
                  <Text style={styles.switchPromptText}>Switch →</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Institutional Proctoring Policies */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Proctoring & Integrity Enforcement</Text>
          <Text style={styles.sectionSub}>
            Rules mandated by {activeOrg.shortName} Academic Senate
          </Text>

          <View style={styles.policyRow}>
            <View style={styles.policyTextCol}>
              <Text style={styles.policyTitle}>Camera Snapshot Cadence</Text>
              <Text style={styles.policyDesc}>Automated front webcam capture interval</Text>
            </View>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>
                Every {activeOrg.proctorPolicies?.snapshotIntervalSec || 30}s
              </Text>
            </View>
          </View>

          <View style={styles.policyRow}>
            <View style={styles.policyTextCol}>
              <Text style={styles.policyTitle}>Breach Violation Threshold</Text>
              <Text style={styles.policyDesc}>Maximum allowed app-switching incidents</Text>
            </View>
            <View style={styles.pillBadgeAmber}>
              <Text style={styles.pillBadgeAmberText}>
                {activeOrg.proctorPolicies?.violationLimit || 3} Incidents
              </Text>
            </View>
          </View>

          <View style={styles.policyRow}>
            <View style={styles.policyTextCol}>
              <Text style={styles.policyTitle}>Screen Capture & Recording Shield</Text>
              <Text style={styles.policyDesc}>Native hardware prevention flag</Text>
            </View>
            <View style={styles.pillBadgeGreen}>
              <Text style={styles.pillBadgeGreenText}>Enforced ✓</Text>
            </View>
          </View>

          <View style={[styles.policyRow, { borderBottomWidth: 0 }]}>
            <View style={styles.policyTextCol}>
              <Text style={styles.policyTitle}>Strict Audio Monitor</Text>
              <Text style={styles.policyDesc}>Flag elevated ambient acoustic anomalies</Text>
            </View>
            <Switch
              value={strictAudio}
              onValueChange={handleToggleStrictAudio}
              trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
              thumbColor={strictAudio ? '#4F46E5' : '#F1F5F9'}
            />
          </View>
        </View>

        {/* Organization Academic Metrics */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Institutional Analytics</Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{activeOrg.stats?.totalExams || 18}</Text>
              <Text style={styles.metricLbl}>Examinations</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{activeOrg.stats?.activeCandidates || 450}</Text>
              <Text style={styles.metricLbl}>Candidates</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={[styles.metricVal, styles.textGreen]}>
                {activeOrg.stats?.avgPassingRate || '87%'}
              </Text>
              <Text style={styles.metricLbl}>Pass Rate</Text>
            </View>
          </View>
        </View>

        {/* Member Profile in this Org */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Your Academic Credentials</Text>
          <View style={styles.credRow}>
            <Text style={styles.credLabel}>Candidate Name</Text>
            <Text style={styles.credValue}>{user?.name || 'Alex Student'}</Text>
          </View>
          <View style={styles.credRow}>
            <Text style={styles.credLabel}>Registered Email</Text>
            <Text style={styles.credValue}>{user?.email || 'alex.student@examsphere.io'}</Text>
          </View>
          <View style={[styles.credRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.credLabel}>Institutional Role</Text>
            <Text style={styles.credValue}>{activeOrg.memberRole}</Text>
          </View>
        </View>

        {/* Done / Return Action */}
        <TouchableOpacity
          style={styles.doneBtn}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneBtnText}>← Return to Examinations</Text>
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
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderTopWidth: 4,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  logoIcon: {
    fontSize: 30,
  },
  heroInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  orgName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    color: '#15803D',
    fontSize: 9,
    fontWeight: '800',
  },
  orgDomain: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  planPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  planPillText: {
    color: '#4338CA',
    fontSize: 10,
    fontWeight: '700',
  },
  codeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  orgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  orgItemSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
    borderWidth: 1.5,
  },
  orgItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  orgItemIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  orgItemIcon: {
    fontSize: 20,
  },
  orgItemInfo: {
    flex: 1,
  },
  orgItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  textIndigoBold: {
    color: '#312E81',
    fontWeight: '800',
  },
  orgItemRole: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  activeCheckPill: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeCheckText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  switchPromptText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  policyTextCol: {
    flex: 1,
    marginRight: 10,
  },
  policyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  policyDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pillBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  pillBadgeAmber: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillBadgeAmberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  pillBadgeGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillBadgeGreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLbl: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  textGreen: {
    color: '#10B981',
  },
  credRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  credLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  credValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  doneBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
});
