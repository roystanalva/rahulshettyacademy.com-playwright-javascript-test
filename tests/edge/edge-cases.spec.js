const { test, expect } = require('../../fixtures/test-fixtures');
const { EDGE_STRINGS } = require('../../utils/dataFactory');

test.describe('@edge practice login edge cases', () => {
  for (const [name, value] of Object.entries(EDGE_STRINGS)) {
    test(`login rejects "${name}" input without crashing`, async ({ page, practiceLogin, diagnostics }) => {
      await practiceLogin.open();
      await practiceLogin.login(value, value);
      await page.waitForTimeout(1500);
      expect(page.url()).not.toMatch(/shop/);
      expect(diagnostics.pageErrors).toEqual([]);
    });
  }

  test('empty credentials do not authenticate', async ({ page, practiceLogin }) => {
    await practiceLogin.open();
    await practiceLogin.signIn.click();
    await page.waitForTimeout(1000);
    expect(page.url()).not.toMatch(/shop/);
  });

  test('credentials are case-sensitive', async ({ page, practiceLogin }) => {
    await practiceLogin.open();
    await practiceLogin.login('RAHULSHETTYACADEMY', 'LEARNING');
    await page.waitForTimeout(1500);
    expect(page.url()).not.toMatch(/shop/);
  });

  test('double-clicking sign-in does not produce JS errors', async ({ page, practiceLogin, diagnostics }) => {
    await practiceLogin.open();
    await practiceLogin.username.fill('x');
    await practiceLogin.password.fill('y');
    await practiceLogin.terms.check();
    await practiceLogin.signIn.dblclick();
    await page.waitForTimeout(1500);
    expect(diagnostics.pageErrors).toEqual([]);
  });
});

test.describe('@edge navigation and transport', () => {
  test('survives rapid reload x5', async ({ page }) => {
    await page.goto('/');
    for (let i = 0; i < 5; i++) await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('back/forward navigation keeps the page usable', async ({ page }) => {
    await page.goto('/');
    await page.goto('/loginpagePractice/');
    await page.goBack();
    await expect(page).toHaveURL(/rahulshettyacademy\.com\/?$/);
    await page.goForward();
    await expect(page.locator('#username')).toBeVisible();
  });

  test('oversized query strings and odd paths do not cause a 5xx', async ({ request }) => {
    for (const p of ['/?q=' + 'a'.repeat(4000), '/%00', '/..%2f..%2fetc/passwd', '/index.html/']) {
      const res = await request.get(p, { failOnStatusCode: false });
      expect(res.status(), p.slice(0, 40)).toBeLessThan(500);
    }
  });

  test('recovers after going offline and back online', async ({ page, context }) => {
    await page.goto('/');
    await context.setOffline(true);
    await page.goto('/loginpagePractice/').catch(() => {});
    await context.setOffline(false);
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
