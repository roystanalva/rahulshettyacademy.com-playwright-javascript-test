// Passive, non-destructive security checks only.
const EXPECTED_HEADERS = {
  'strict-transport-security': 'HSTS',
  'x-content-type-options': 'MIME sniffing protection',
  'content-security-policy': 'CSP',
  'x-frame-options': 'Clickjacking protection (or CSP frame-ancestors)',
  'referrer-policy': 'Referrer policy',
};

function evaluateHeaders(headers) {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  const missing = [];
  const present = [];
  for (const [h, label] of Object.entries(EXPECTED_HEADERS)) {
    if (h === 'x-frame-options' && /frame-ancestors/i.test(lower['content-security-policy'] || '')) {
      present.push(h);
      continue;
    }
    if (lower[h]) present.push(h);
    else missing.push(`${h} (${label})`);
  }
  return { present, missing };
}

function infoLeakHeaders(headers) {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  const leaks = [];
  if (/\d+\.\d+/.test(lower['server'] || '')) leaks.push(`server: ${lower['server']}`);
  if (lower['x-powered-by']) leaks.push(`x-powered-by: ${lower['x-powered-by']}`);
  return leaks;
}

function cookieIssues(setCookieHeaders) {
  const issues = [];
  for (const raw of setCookieHeaders) {
    const name = raw.split('=')[0].trim();
    if (!/;\s*secure/i.test(raw)) issues.push(`${name}: missing Secure`);
    if (!/;\s*httponly/i.test(raw)) issues.push(`${name}: missing HttpOnly`);
    if (!/;\s*samesite=/i.test(raw)) issues.push(`${name}: missing SameSite`);
  }
  return issues;
}

function findMixedContent(requestUrls, pageUrl) {
  if (!pageUrl.startsWith('https:')) return [];
  return requestUrls.filter((u) => u.startsWith('http:'));
}

const XSS_PAYLOADS = [
  `<script>window.__xss=1</script>`,
  `"><img src=x onerror="window.__xss=1">`,
  `'><svg onload="window.__xss=1">`,
];

const SQLI_PAYLOADS = [`' OR '1'='1`, `admin' --`, `" OR ""="`, `'; SELECT 1; --`];

module.exports = { EXPECTED_HEADERS, evaluateHeaders, infoLeakHeaders, cookieIssues, findMixedContent, XSS_PAYLOADS, SQLI_PAYLOADS };
