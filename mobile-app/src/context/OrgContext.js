import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ACTIVE_ORG_STORAGE_KEY = 'examsphere_active_org_id';

export const DEFAULT_ORGS = [
  {
    id: 'org_1',
    _id: 'org_1',
    name: 'Apex Institute of Technology',
    shortName: 'Apex Tech',
    code: 'APEX-TECH',
    logoIcon: '🏛️',
    brandColor: '#4F46E5',
    plan: 'Institutional Tier',
    domain: 'apex.examsphere.io',
    verified: true,
    memberRole: 'Candidate / Student',
    proctorPolicies: {
      snapshotIntervalSec: 30,
      violationLimit: 3,
      screenCaptureLock: true,
      appSwitchDetection: true,
      strictAudioCheck: false,
    },
    stats: {
      totalExams: 18,
      activeCandidates: 450,
      avgPassingRate: '87.4%',
    },
  },
  {
    id: 'org_2',
    _id: 'org_2',
    name: 'St. Jude Health Sciences Academy',
    shortName: 'St. Jude Med',
    code: 'ST-JUDE',
    logoIcon: '🩺',
    brandColor: '#0D9488',
    plan: 'Enterprise Tier',
    domain: 'stjude.examsphere.io',
    verified: true,
    memberRole: 'Student Evaluator',
    proctorPolicies: {
      snapshotIntervalSec: 15,
      violationLimit: 2,
      screenCaptureLock: true,
      appSwitchDetection: true,
      strictAudioCheck: true,
    },
    stats: {
      totalExams: 24,
      activeCandidates: 620,
      avgPassingRate: '91.2%',
    },
  },
  {
    id: 'org_3',
    _id: 'org_3',
    name: 'Global STEM Polytechnic',
    shortName: 'Global STEM',
    code: 'STEM-POLY',
    logoIcon: '🔬',
    brandColor: '#6366F1',
    plan: 'Standard Tier',
    domain: 'stempoly.examsphere.io',
    verified: true,
    memberRole: 'Candidate / Student',
    proctorPolicies: {
      snapshotIntervalSec: 45,
      violationLimit: 4,
      screenCaptureLock: true,
      appSwitchDetection: true,
      strictAudioCheck: false,
    },
    stats: {
      totalExams: 12,
      activeCandidates: 280,
      avgPassingRate: '82.0%',
    },
  },
];

const OrgContext = createContext({
  activeOrg: DEFAULT_ORGS[0],
  organizations: DEFAULT_ORGS,
  switchOrg: () => {},
  updateOrgPolicies: () => {},
});

export const OrgProvider = ({ children }) => {
  const [organizations, setOrganizations] = useState(DEFAULT_ORGS);
  const [activeOrgId, setActiveOrgId] = useState(DEFAULT_ORGS[0].id);

  useEffect(() => {
    const loadStoredOrg = async () => {
      try {
        const stored = await AsyncStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
        if (stored && DEFAULT_ORGS.some((o) => o.id === stored)) {
          setActiveOrgId(stored);
        }
      } catch (err) {
        console.warn('[OrgContext] Error loading active org:', err);
      }
    };
    loadStoredOrg();
  }, []);

  const switchOrg = async (orgId) => {
    setActiveOrgId(orgId);
    try {
      await AsyncStorage.setItem(ACTIVE_ORG_STORAGE_KEY, orgId);
    } catch (err) {
      console.warn('[OrgContext] Error saving active org:', err);
    }
  };

  const updateOrgPolicies = (orgId, newPolicies) => {
    setOrganizations((prev) =>
      prev.map((org) =>
        org.id === orgId
          ? {
              ...org,
              proctorPolicies: { ...org.proctorPolicies, ...newPolicies },
            }
          : org
      )
    );
  };

  const activeOrg = organizations.find((o) => o.id === activeOrgId) || organizations[0];

  return (
    <OrgContext.Provider
      value={{
        activeOrg,
        organizations,
        switchOrg,
        updateOrgPolicies,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => useContext(OrgContext);

export default OrgContext;
