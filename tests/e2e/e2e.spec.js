const { test, expect } = require('../../fixtures/test-fixtures');
const env = require('../../config/env');

test.describe('@e2e practice shop journey', () => {
  test('login -> browse products -> add to cart -> checkout -> confirm order', async ({ page, practiceLogin }) => {
    // 1. Login
    await practiceLogin.open();
    await practiceLogin.login(env.practiceCreds.username, env.practiceCreds.password);
    await page.waitForURL(/shop/, { timeout: 20_000 });

    // 2. Products are listed
    const cards = page.locator('app-card');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // 3. Add the first product to the cart
    await cards.first().locator('button').click();
    const checkoutLink = page.locator('a.nav-link.btn-primary, a:has-text("Checkout")').first();
    await expect(checkoutLink).toContainText(/1/);

    // 4. Cart page shows the item
    await checkoutLink.click();
    await expect(page.locator('table tbody tr, .media').first()).toBeVisible();

    // 5. Proceed to delivery step
    await page.locator('button.btn-success:has-text("Checkout")').click();
    await page.locator('#country').pressSequentially('Ind', { delay: 80 });
    await page.locator('.suggestions ul li a').first().click();
    await page.locator('.checkbox label, label[for="checkbox2"]').first().click();
    await page.locator('input[type="submit"]').click();

    // 6. Order confirmation
    await expect(page.locator('.alert-success')).toContainText(/success/i);
  });

  test('add multiple products and the cart counter reflects the total', async ({ page, practiceLogin }) => {
    await practiceLogin.open();
    await practiceLogin.login(env.practiceCreds.username, env.practiceCreds.password);
    await page.waitForURL(/shop/);
    const cards = page.locator('app-card');
    const n = Math.min(3, await cards.count());
    for (let i = 0; i < n; i++) await cards.nth(i).locator('button').click();
    await expect(page.locator('a.nav-link.btn-primary, a:has-text("Checkout")').first()).toContainText(String(n));
  });

  test('home -> practice login via navigation links', async ({ page, homePage }) => {
    await homePage.open();
    await page.goto(env.paths.practiceLogin);
    await expect(page.locator('#signInBtn')).toBeVisible();
  });
});
