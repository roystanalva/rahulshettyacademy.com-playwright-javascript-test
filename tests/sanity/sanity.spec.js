const { test, expect } = require('../../fixtures/test-fixtures');
const env = require('../../config/env');

test.describe('@sanity core behaviour still works', () => {
  test('home page has a heading and navigation links', async ({ homePage }) => {
    await homePage.open();
    await expect(homePage.heading).toBeVisible();
    expect(await homePage.navLinks.count()).toBeGreaterThan(0);
  });

  test('practice login form exposes username, password and sign-in', async ({ practiceLogin }) => {
    await practiceLogin.open();
    await expect(practiceLogin.username).toBeVisible();
    await expect(practiceLogin.password).toBeVisible();
    await expect(practiceLogin.signIn).toBeVisible();
  });

  test('valid practice credentials reach the shop page', async ({ page, practiceLogin }) => {
    await practiceLogin.open();
    await practiceLogin.login(env.practiceCreds.username, env.practiceCreds.password);
    await page.waitForURL(/shop/, { timeout: 20_000 });
    await expect(page).toHaveURL(/shop/);
  });

  test('invalid practice credentials show an error', async ({ practiceLogin }) => {
    await practiceLogin.open();
    await practiceLogin.login('nobody', 'wrong-password');
    await expect(practiceLogin.error).toBeVisible();
  });

  test('client login page renders email + password fields', async ({ clientAuth }) => {
    await clientAuth.openLogin();
    await expect(clientAuth.email).toBeVisible();
    await expect(clientAuth.password).toBeVisible();
  });
});
