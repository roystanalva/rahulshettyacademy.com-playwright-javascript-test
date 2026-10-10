// @unit — pure-function tests, no browser, no network
const { test, expect } = require('@playwright/test');
const df = require('../../utils/dataFactory');
const lu = require('../../utils/linkUtils');
const su = require('../../utils/securityUtils');
const pu = require('../../utils/perfUtils');

test.describe('@unit dataFactory', () => {
  test('randomEmail is valid and unique', () => {
    const a = df.randomEmail();
    const b = df.randomEmail();
    expect(a).toMatch(/^[\w.]+@example\.com$/);
    expect(a).not.toBe(b);
  });
  test('randomPhone is 10 digits starting 6-9', () => {
    for (let i = 0; i < 50; i++) expect(df.randomPhone()).toMatch(/^[6-9]\d{9}$/);
  });
  test('strongPassword meets complexity rules', () => {
    const p = df.strongPassword();
    expect(p).toMatch(/[A-Z]/);
    expect(p).toMatch(/[a-z]/);
    expect(p).toMatch(/\d/);
    expect(p).toMatch(/[^A-Za-z0-9]/);
    expect(p.length).toBeGreaterThanOrEqual(8);
  });
  test('registrationUser applies overrides and matches confirm password', () => {
    const u = df.registrationUser({ firstName: 'Roy' });
    expect(u.firstName).toBe('Roy');
    expect(u.confirmPassword).toBe(u.password);
  });
  test('longString length', () => expect(df.longString(300)).toHaveLength(300));
});

test.describe('@unit linkUtils', () => {
  const base = 'https://rahulshettyacademy.com/';
  test('isCheckable skips non-http schemes and anchors', () => {
    for (const h of ['#top', 'mailto:a@b.c', 'tel:123', 'javascript:void(0)', '', '  ', null, undefined]) {
      expect(lu.isCheckable(h)).toBe(false);
    }
    expect(lu.isCheckable('/about')).toBe(true);
  });
  test('normalizeUrl resolves relative, strips hash, rejects bad protocols', () => {
    expect(lu.normalizeUrl('/a#frag', base)).toBe('https://rahulshettyacademy.com/a');
    expect(lu.normalizeUrl('ftp://x.com', base)).toBeNull();
  });
  test('isInternal handles www and subdomains', () => {
    expect(lu.isInternal('https://www.rahulshettyacademy.com/x', base)).toBe(true);
    expect(lu.isInternal('https://courses.rahulshettyacademy.com', base)).toBe(true);
    expect(lu.isInternal('https://evilrahulshettyacademy.com', base)).toBe(false);
    expect(lu.isInternal('https://youtube.com', base)).toBe(false);
  });
  test('uniqueLinks dedupes and filters', () => {
    const out = lu.uniqueLinks(['/a', '/a#x', '#', 'mailto:x@y.z', '/b'], base);
    expect(out).toEqual(['https://rahulshettyacademy.com/a', 'https://rahulshettyacademy.com/b']);
  });
  test('classifyStatus', () => {
    expect(lu.classifyStatus(200)).toBe('ok');
    expect(lu.classifyStatus(301)).toBe('ok');
    expect(lu.classifyStatus(403)).toBe('restricted');
    expect(lu.classifyStatus(404)).toBe('broken');
    expect(lu.classifyStatus(500)).toBe('broken');
  });
});

test.describe('@unit securityUtils', () => {
  test('evaluateHeaders reports missing + present', () => {
    const r = su.evaluateHeaders({ 'Strict-Transport-Security': 'max-age=1', 'X-Content-Type-Options': 'nosniff' });
    expect(r.present).toContain('strict-transport-security');
    expect(r.missing.join()).toContain('content-security-policy');
  });
  test('CSP frame-ancestors satisfies clickjacking check', () => {
    const r = su.evaluateHeaders({ 'content-security-policy': "frame-ancestors 'self'" });
    expect(r.present).toContain('x-frame-options');
  });
  test('infoLeakHeaders flags versioned Server and X-Powered-By', () => {
    expect(su.infoLeakHeaders({ server: 'nginx/1.18.0', 'x-powered-by': 'Express' })).toHaveLength(2);
    expect(su.infoLeakHeaders({ server: 'cloudflare' })).toHaveLength(0);
  });
  test('cookieIssues', () => {
    expect(su.cookieIssues(['a=1; Secure; HttpOnly; SameSite=Lax'])).toEqual([]);
    expect(su.cookieIssues(['a=1; Path=/'])).toHaveLength(3);
  });
  test('findMixedContent', () => {
    expect(su.findMixedContent(['http://a.com/x', 'https://b.com'], 'https://s.com')).toEqual(['http://a.com/x']);
    expect(su.findMixedContent(['http://a.com/x'], 'http://s.com')).toEqual([]);
  });
});

test.describe('@unit perfUtils', () => {
  test('evaluateBudgets returns only violations', () => {
    const v = pu.evaluateBudgets({ ttfb: 100, fcp: 5000, lcp: 100, load: 100, requests: 10, transferKB: 10 }, { ttfb: 500, fcp: 3000, lcp: 4000, load: 8000, requests: 100, transferKB: 5000 });
    expect(v).toHaveLength(1);
    expect(v[0]).toMatch(/FCP/);
  });
  test('no violations when within budget', () => {
    expect(pu.evaluateBudgets({ ttfb: 1 }, { ttfb: 2 })).toEqual([]);
  });
});
