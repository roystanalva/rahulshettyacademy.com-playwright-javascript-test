const { test, expect } = require('../../fixtures/test-fixtures');

test.describe('@ui layout and presentation', () => {
  test('page has a title and a primary heading', async ({ page, homePage }) => {
    await homePage.open();
    expect(await page.title()).toMatch(/rahul|shetty|academy/i);
    await expect(homePage.heading).toBeVisible();
  });

  test('images load (no broken images above the fold)', async ({ page, homePage }) => {
    await homePage.open();
    await page.waitForLoadState('load');
    const broken = await homePage.images.evaluateAll((imgs) =>
      imgs.filter((i) => i.getBoundingClientRect().top < window.innerHeight && i.complete && i.naturalWidth === 0).map((i) => i.src)
    );
    expect(broken, `broken images: ${broken.join(', ')}`).toEqual([]);
  });

  test('images carry alt attributes (accessibility)', async ({ homePage }) => {
    await homePage.open();
    const missing = await homePage.images.evaluateAll((imgs) => imgs.filter((i) => !i.hasAttribute('alt')).length);
    test.info().annotations.push({ type: 'info', description: `${missing} images without alt` });
    expect.soft(missing).toBeLessThan(10);
  });

  for (const vp of [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
  ]) {
    test(`no horizontal scroll at ${vp.name} (${vp.width}px)`, async ({ page, homePage }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await homePage.open();
      await page.waitForLoadState('load');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(5);
    });
  }

  test('no uncaught JS errors on load', async ({ page, homePage, diagnostics }) => {
    await homePage.open();
    await page.waitForLoadState('networkidle').catch(() => {});
    expect(diagnostics.pageErrors).toEqual([]);
  });

  test('keyboard Tab moves focus to an interactive element', async ({ page, homePage }) => {
    await homePage.open();
    await page.keyboard.press('Tab');
    const tag = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(tag);
  });

  test('practice login: password field is masked and sign-in enabled', async ({ practiceLogin }) => {
    await practiceLogin.open();
    await expect(practiceLogin.password).toHaveAttribute('type', 'password');
    await expect(practiceLogin.signIn).toBeEnabled();
  });

  test('automation-practice page renders form controls', async ({ page }) => {
    await page.goto('/AutomationPractice/');
    expect(await page.locator('input').count()).toBeGreaterThan(3);
  });
});
