const VALID_VIOLATIONS = [
  'tab-switch',
  'fullscreen-exit',
  'devtools-opened',
  'screenshot-attempt',
  'copy-paste-attempt',
  'multiple-faces',
  'no-face'
];

const normalizeViolationType = (raw) => {
  if (!raw) return null;
  const value = String(raw).toLowerCase().trim();
  const compact = value.replace(/[\s_]+/g, '-');
  if (VALID_VIOLATIONS.includes(compact)) return compact;
  if (compact.includes('tab') || compact.includes('blur')) return 'tab-switch';
  if (compact.includes('fullscreen')) return 'fullscreen-exit';
  if (compact.includes('devtools') || compact.includes('inspect')) return 'devtools-opened';
  if (compact.includes('screenshot') || compact.includes('screen-recording') || compact.includes('capture')) {
    return 'screenshot-attempt';
  }
  if (compact.includes('copy') || compact.includes('paste') || compact.includes('clipboard')) {
    return 'copy-paste-attempt';
  }
  if (compact.includes('multiple') && compact.includes('face')) return 'multiple-faces';
  if (compact.includes('no-face') || compact.includes('noface') || compact.includes('face')) return 'no-face';
  return null;
};

module.exports = { VALID_VIOLATIONS, normalizeViolationType };
