const { test, expect } = require('../../fixtures/test-fixtures');
const { collectMetrics, evaluateBudgets } = require('../../utils/perfUtils');
const env = require('../../config/env');

const PAGES = [
  ['home', env.paths.home],
  ['practice login', env.paths.practiceLogin],
  ['automation practice', env.paths.automationPractice],
];

test.describe('@performance page-load budgets (override via PERF_* env vars)', () => {
  for (const [name, path] of PAGES) {
    test(`${name} stays within performance budgets`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'load' });
      const m = await collectMetrics(page);
      const violations = evaluateBudgets(m, env.budgets);
      await test.info().attach(`metrics-${name}.json`, { body: JSON.stringify(m, null, 2), contentType: 'application/json' });
      test.info().annotations.push({ type: 'metrics', description: JSON.stringify(m) });
      expect(violations, JSON.stringify(m)).toEqual([]);
    });
  }

  test('repeat visit is not slower than first visit by more than 2x (cache sanity)', async ({ page }) => {
    const t = async () => {
      const s = Date.now();
      await page.goto('/', { waitUntil: 'load' });
      return Date.now() - s;
    };
    const first = await t();
    const second = await t();
    expect(second).toBeLessThan(first * 2 + 500);
  });

  test('no oversized images (>1MB) on the home page', async ({ page }) => {
    const big = [];
    page.on('response', async (r) => {
      if (r.request().resourceType() === 'image') {
        const len = Number(r.headers()['content-length'] || 0);
        if (len > 1_000_000) big.push(`${r.url()} (${Math.round(len / 1024)}KB)`);
      }
    });
    await page.goto('/', { waitUntil: 'networkidle' }).catch(() => {});
    test.info().annotations.push({ type: 'info', description: big.join('\n') || 'none' });
    expect.soft(big).toEqual([]);
  });

  test('text responses are compressed', async ({ request }) => {
    const res = await request.get('/', { headers: { 'accept-encoding': 'gzip, br' } });
    const enc = res.headers()['content-encoding'];
    expect.soft(enc, 'content-encoding').toMatch(/gzip|br|zstd|deflate/);
  });

  test('API login endpoint responds within 3s', async ({ request }) => {
    const s = Date.now();
    await request.post(env.paths.apiLogin, { data: { userEmail: 'perf@example.com', userPassword: 'x' }, failOnStatusCode: false });
    expect(Date.now() - s).toBeLessThan(3000);
  });

  test('10 sequential requests complete without 5xx (light load check)', async ({ request }) => {
    const codes = [];
    for (let i = 0; i < 10; i++) codes.push((await request.get('/', { failOnStatusCode: false })).status());
    expect(codes.filter((c) => c >= 500)).toEqual([]);
  });
});
