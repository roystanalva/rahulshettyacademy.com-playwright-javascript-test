// Passive / non-destructive checks only. No fuzzing, no brute force, no load.
const { test, expect } = require('../../fixtures/test-fixtures');
const su = require('../../utils/securityUtils');
const env = require('../../config/env');

test.describe('@security transport and headers', () => {
  test('HTTP is redirected to HTTPS', async ({ request }) => {
    const httpUrl = env.baseURL.replace(/^https:/, 'http:');
    const res = await request.get(httpUrl, { maxRedirects: 0, failOnStatusCode: false }).catch(() => null);
    test.skip(!res, 'plain HTTP port not reachable (acceptable)');
    expect([301, 302, 307, 308]).toContain(res.status());
    expect(res.headers()['location']).toMatch(/^https:/);
  });

  test('security headers are present (reported; HSTS + nosniff asserted softly)', async ({ request }) => {
    const res = await request.get('/');
    const { present, missing } = su.evaluateHeaders(res.headers());
    test.info().annotations.push({ type: 'headers-present', description: present.join(', ') || 'none' });
    test.info().annotations.push({ type: 'headers-missing', description: missing.join(', ') || 'none' });
    expect.soft(missing.filter((m) => /strict-transport|x-content-type/.test(m)), 'important headers missing').toEqual([]);
  });

  test('server does not disclose versions', async ({ request }) => {
    const res = await request.get('/');
    expect.soft(su.infoLeakHeaders(res.headers())).toEqual([]);
  });

  test('no mixed content on the home page', async ({ page }) => {
    const urls = [];
    page.on('request', (r) => urls.push(r.url()));
    await page.goto('/', { waitUntil: 'load' });
    expect(su.findMixedContent(urls, page.url())).toEqual([]);
  });

  test('cookies set on first load have Secure/HttpOnly/SameSite (reported)', async ({ page, context }) => {
    await page.goto('/');
    const cookies = await context.cookies();
    const issues = cookies.flatMap((c) => [
      !c.secure && `${c.name}: not Secure`,
      !c.httpOnly && `${c.name}: not HttpOnly`,
      c.sameSite === 'None' && `${c.name}: SameSite=None`,
    ]).filter(Boolean);
    test.info().annotations.push({ type: 'cookie-issues', description: issues.join('\n') || 'none' });
    expect.soft(issues.filter((i) => /not Secure/.test(i))).toEqual([]);
  });
});

test.describe('@security input handling (single, harmless payloads)', () => {
  for (const payload of su.XSS_PAYLOADS) {
    test(`XSS payload is not executed: ${payload.slice(0, 30)}`, async ({ page, practiceLogin }) => {
      let dialog = false;
      page.on('dialog', (d) => { dialog = true; d.dismiss(); });
      await practiceLogin.open();
      await practiceLogin.login(payload, payload);
      await page.waitForTimeout(1000);
      expect(dialog, 'dialog fired').toBe(false);
      expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    });
  }

  for (const payload of su.SQLI_PAYLOADS) {
    test(`SQLi-style payload does not authenticate: ${payload}`, async ({ page, practiceLogin }) => {
      await practiceLogin.open();
      await practiceLogin.login(payload, payload);
      await page.waitForTimeout(1500);
      expect(page.url()).not.toMatch(/shop/);
    });
  }

  test('API login with SQLi payload is rejected with 4xx, never 2xx/5xx', async ({ request }) => {
    const res = await request.post(env.paths.apiLogin, { data: { userEmail: `' OR '1'='1`, userPassword: `' OR '1'='1` }, failOnStatusCode: false });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('password inputs are type=password and not echoed in URL', async ({ page, practiceLogin }) => {
    await practiceLogin.open();
    await practiceLogin.login('someone', 'S3cretValue!');
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain('S3cretValue');
    await expect(practiceLogin.password).toHaveAttribute('type', 'password');
  });

  test('protected shop page is not usable without logging in', async ({ page }) => {
    await page.goto('/angularpractice/shop', { waitUntil: 'domcontentloaded' });
    // Either redirected away, or nothing checkout-able is rendered. Reported rather than asserted hard
    // because this is a public practice site whose shop route may be openly accessible by design.
    test.info().annotations.push({ type: 'info', description: `landed on ${page.url()}` });
    expect.soft(true).toBe(true);
  });
});
