const { test, expect } = require('../../fixtures/test-fixtures');
const env = require('../../config/env');

test.describe('@smoke critical pages are reachable', () => {
  const pages = [
    ['Home', env.paths.home],
    ['Practice login', env.paths.practiceLogin],
    ['Automation practice', env.paths.automationPractice],
    ['Client app', env.paths.clientLogin],
  ];
  for (const [name, path] of pages) {
    test(`${name} responds < 400 and renders`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(res?.status(), `${path} status`).toBeLessThan(400);
      await expect(page.locator('body')).toBeVisible();
      expect((await page.title()).length).toBeGreaterThan(0);
    });
  }

  test('home page is served over HTTPS', async ({ page }) => {
    await page.goto('/');
    expect(page.url()).toMatch(/^https:/);
  });
});
