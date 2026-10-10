const { test, expect } = require('../../fixtures/test-fixtures');
const { uniqueLinks, isInternal, checkAll } = require('../../utils/linkUtils');
const env = require('../../config/env');

const PAGES_TO_CRAWL = [env.paths.home, env.paths.automationPractice, env.paths.practiceLogin];

test.describe('@links link health', () => {
  test.setTimeout(240_000);

  for (const path of PAGES_TO_CRAWL) {
    test(`all links on ${path} are working`, async ({ page, request }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load').catch(() => {});
      const hrefs = await page.locator('a[href]').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
      const urls = uniqueLinks(hrefs, env.baseURL + path);
      test.info().annotations.push({ type: 'info', description: `${urls.length} unique links checked` });

      const results = await checkAll(request, urls, { concurrency: 8 });
      const internalBroken = results.filter((r) => r.verdict === 'broken' && isInternal(r.url, env.baseURL));
      const externalBroken = results.filter((r) => r.verdict === 'broken' && !isInternal(r.url, env.baseURL));
      const restricted = results.filter((r) => r.verdict === 'restricted');

      const fmt = (r) => `${r.status || 'ERR'} ${r.url}${r.error ? ' (' + r.error + ')' : ''}`;
      if (externalBroken.length) test.info().annotations.push({ type: 'external-broken', description: externalBroken.map(fmt).join('\n') });
      if (restricted.length) test.info().annotations.push({ type: 'restricted', description: restricted.map(fmt).join('\n') });

      // Hard fail: internal links. Soft fail: external links (outside our control, still reported).
      expect.soft(externalBroken.map(fmt), 'external broken links').toEqual([]);
      expect(internalBroken.map(fmt), 'internal broken links').toEqual([]);
    });
  }

  test('target=_blank links are reported when missing rel=noopener', async ({ page }) => {
    await page.goto('/');
    const unsafe = await page.locator('a[target="_blank"]').evaluateAll((els) =>
      els.filter((e) => !/noopener|noreferrer/.test(e.getAttribute('rel') || '')).map((e) => e.href)
    );
    test.info().annotations.push({ type: 'info', description: `${unsafe.length} _blank links without rel` });
    expect.soft(unsafe.length).toBeLessThan(50);
  });

  test('unknown URL does not return 5xx or a soft 200', async ({ request }) => {
    const res = await request.get('/this-page-should-not-exist-' + Date.now(), { failOnStatusCode: false });
    expect([404, 403, 301, 302]).toContain(res.status());
  });
});
