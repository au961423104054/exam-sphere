const { shuffleWithSeed } = require('./shuffleHelper');

/**
 * Samples and assigns questions from a question bank according to count and type configuration.
 *
 * @param {Array} allQuestions - All questions in the exam bank
 * @param {Object} rule - The questionDistribution configuration from Exam
 * @param {string} seedStr - Unique seed (e.g. student ID or submission ID) for deterministic assignment
 * @returns {Array} - The subset of assigned questions
 */
function sampleQuestionsByRule(allQuestions = [], rule = {}, seedStr = '') {
  if (!Array.isArray(allQuestions) || allQuestions.length === 0) return [];
  if (!rule || !rule.enabled) return allQuestions;

  const byType = rule.byType || {};
  const requestedCounts = {
    coding: Number(byType.coding) || 0,
    mcq: Number(byType.mcq) || 0,
    tf: Number(byType.tf) || 0,
    subjective: Number(byType.subjective) || 0,
  };

  const hasSpecificTypeRules = Object.values(requestedCounts).some((c) => c > 0);

  let selected = [];

  if (hasSpecificTypeRules) {
    // Group all questions in the bank by type
    const pools = {
      coding: [],
      mcq: [],
      tf: [],
      subjective: [],
    };

    allQuestions.forEach((q) => {
      const type = q.type || 'mcq';
      if (pools[type]) {
        pools[type].push(q);
      } else {
        pools.mcq.push(q);
      }
    });

    // Sample the requested count for each question type
    Object.keys(requestedCounts).forEach((type) => {
      const count = requestedCounts[type];
      const pool = pools[type] || [];
      if (count > 0 && pool.length > 0) {
        // Deterministically shuffle questions of this type using a type-specific seed
        const shuffledPool = shuffleWithSeed(pool, `${seedStr}_${type}`);
        const countToTake = Math.min(count, shuffledPool.length);
        selected.push(...shuffledPool.slice(0, countToTake));
      }
    });
  } else if (rule.totalCount && Number(rule.totalCount) > 0) {
    // General total count requested: sample randomly across the whole bank
    const shuffledAll = shuffleWithSeed(allQuestions, seedStr);
    const countToTake = Math.min(Number(rule.totalCount), shuffledAll.length);
    selected = shuffledAll.slice(0, countToTake);
  } else {
    // No specific counts, return all
    selected = [...allQuestions];
  }

  // Shuffle the final assigned list so types can be mixed
  return shuffleWithSeed(selected, `${seedStr}_final`);
}

module.exports = {
  sampleQuestionsByRule,
};
