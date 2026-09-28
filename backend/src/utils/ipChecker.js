/**
 * Utility for verifying whether a client IP matches an allowed IP range or CIDR list.
 */

function normalizeIp(ip) {
  if (!ip) return '127.0.0.1';
  let cleanIp = ip.trim();
  if (cleanIp.startsWith('::ffff:')) {
    cleanIp = cleanIp.substring(7);
  }
  if (cleanIp === '::1') {
    cleanIp = '127.0.0.1';
  }
  return cleanIp;
}

function ipToLong(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  return (
    ((parseInt(parts[0], 10) << 24) >>> 0) +
    ((parseInt(parts[1], 10) << 16) >>> 0) +
    ((parseInt(parts[2], 10) << 8) >>> 0) +
    (parseInt(parts[3], 10) >>> 0)
  );
}

function isIpInCidr(ip, cidr) {
  const [range, bitsStr] = cidr.split('/');
  const bits = parseInt(bitsStr, 10);
  if (isNaN(bits) || bits < 0 || bits > 32) return false;

  const ipLong = ipToLong(ip);
  const rangeLong = ipToLong(range);
  if (ipLong === null || rangeLong === null) return false;

  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipLong & mask) === (rangeLong & mask);
}

function isIpAllowed(rawClientIp, allowedRangeString) {
  if (!allowedRangeString || !allowedRangeString.trim()) {
    return { allowed: true };
  }

  const clientIp = normalizeIp(rawClientIp);
  const rules = allowedRangeString
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);

  if (rules.length === 0) return { allowed: true };

  for (const rule of rules) {
    // Exact match or localhost equivalence
    if (rule === clientIp) return { allowed: true };
    if ((rule === 'localhost' || rule === '127.0.0.1') && (clientIp === '127.0.0.1' || clientIp === 'localhost')) {
      return { allowed: true };
    }

    // Wildcard match (e.g., "192.168.1.*")
    if (rule.includes('*')) {
      const prefix = rule.replace(/\*+$/, '');
      if (clientIp.startsWith(prefix)) return { allowed: true };
    }

    // CIDR match (e.g., "10.0.0.0/16")
    if (rule.includes('/')) {
      if (isIpInCidr(clientIp, rule)) return { allowed: true };
    }
  }

  return {
    allowed: false,
    clientIp,
    allowedRange: allowedRangeString
  };
}

module.exports = {
  normalizeIp,
  isIpAllowed
};
