/**
 * Deterministic seeded shuffle or random shuffle utility.
 */

function shuffleWithSeed(array, seedStr) {
  if (!Array.isArray(array) || array.length <= 1) return array;

  const result = [...array];
  // Compute integer hash from seed string
  let hash = 0;
  if (seedStr) {
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }
  } else {
    hash = Math.floor(Math.random() * 1000000);
  }

  // Linear congruential pseudo-random number generator
  let seed = Math.abs(hash) || 1234567;
  const nextRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Fisher-Yates shuffle using pseudo-random generator
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

module.exports = {
  shuffleWithSeed
};
