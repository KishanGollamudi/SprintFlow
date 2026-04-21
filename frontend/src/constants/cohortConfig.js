// Cohort color palette — stable per cohort name
const COHORT_COLOR_PALETTE = ['#0d9488','#f59e0b','#8b5cf6','#3b82f6','#ec4899','#06b6d4','#10b981'];
const _cohortColorCache = {};
let _cohortColorIdx = 0;
export function getCohortColor(cohort) {
  if (!_cohortColorCache[cohort]) {
    _cohortColorCache[cohort] = COHORT_COLOR_PALETTE[_cohortColorIdx % COHORT_COLOR_PALETTE.length];
    _cohortColorIdx++;
  }
  return _cohortColorCache[cohort];
}

export const COHORT_NAMES = {
  JC2: 'Java Cohort 2',
  JC3: 'Java Cohort 3',
  JC4: 'Java Cohort 4',
  PC1: 'Python Cohort 1',
  DC1: 'Devops Cohort 1',
};

// Colors per cohort — consistent across all chartss
export const COHORT_COLORS = {
  JC2: '#0d9488',
  JC3: '#f59e0b',
  JC4: '#8b5cf6',
  PC1: '#3b82f6',
  DC1: '#ec4899',
};

// Technologies and their cohorts
export const TECH_COHORTS = {
  Java:   ['JC2', 'JC3', 'JC4'],
  Python: ['PC1'],
  Devops: ['DC1'],
};

export const TECH_COLORS = {
  Java:   '#0d9488',
  Python: '#3b82f6',
  Devops: '#ec4899',
};

// All unique cohorts across all techs
export const ALL_COHORTS = ['JC2', 'JC3', 'JC4', 'PC1', 'DC1'];
export const ALL_TECHS   = ['Java', 'Python', 'Devops'];

// Heatmap color scale: 0% = red, 50% = amber, 100% = green
export function heatmapColor(pct) {
  if (pct === null || pct === undefined) return { bg: '#f3f4f6', text: '#9ca3af' };
  if (pct >= 90) return { bg: '#d1fae5', text: '#065f46' };
  if (pct >= 75) return { bg: '#a7f3d0', text: '#047857' };
  if (pct >= 60) return { bg: '#fef3c7', text: '#92400e' };
  if (pct >= 40) return { bg: '#fed7aa', text: '#9a3412' };
  return { bg: '#fee2e2', text: '#991b1b' };
}
