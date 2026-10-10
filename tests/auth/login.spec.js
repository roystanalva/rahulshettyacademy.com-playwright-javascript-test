const { test, expect } = require('../../fixtures/test-fixtures');
const env = require('../../config/env');

test.describe('@login practice login page', () => {
  test('valid credentials log in', async ({ page, practiceLogin }) => {
    await practiceLogin.open();
    await practiceLogin.login(env.practiceCreds.username, env.practiceCreds.password);
    await expect(page).toHaveURL(/shop/, { timeout: 20_000 });
  });

  test('wrong password shows error', async ({ practiceLogin }) => {
    await practiceLogin.open();
    await practiceLogin.login(env.practiceCreds.username, 'wrong');
    await expect(practiceLogin.error).toBeVisible();
    await expect(practiceLogin.error).toContainText(/incorrect/i);
  });

  test('wrong username shows error', async ({ practiceLogin }) => {
    await practiceLogin.open();
    await practiceLogin.login('wronguser', env.practiceCreds.password);
    await expect(practiceLogin.error).toBeVisible();
  });

  test('terms checkbox must be checked', async ({ page, practiceLogin }) => {
    await practiceLogin.open();
    await practiceLogin.login(env.practiceCreds.username, env.practiceCreds.password, { acceptTerms: false });
    await page.waitForTimeout(1500);
    expect(page.url()).not.toMatch(/shop/);
  });

  test('role dropdown offers multiple options', async ({ practiceLogin }) => {
    await practiceLogin.open();
    expect(await practiceLogin.roleSelect.locator('option').count()).toBeGreaterThan(1);
  });

  test('password field input is masked', async ({ practiceLogin }) => {
    await practiceLogin.open();
    await practiceLogin.password.fill('abc');
    await expect(practiceLogin.password).toHaveAttribute('type', 'password');
  });
});

test.describe('@login client app login', () => {
  test('empty form shows validation and does not submit', async ({ page, clientAuth }) => {
    await clientAuth.openLogin();
    let called = false;
    page.on('request', (r) => /auth\/login/.test(r.url()) && r.method() === 'POST' && (called = true));
    await clientAuth.loginBtn.click();
    await page.waitForTimeout(1000);
    expect(called).toBe(false);
  });

  test('invalid email format is flagged', async ({ clientAuth }) => {
    await clientAuth.openLogin();
    await clientAuth.email.fill('not-an-email');
    await clientAuth.password.fill('Pass#1234');
    await clientAuth.loginBtn.click();
    await expect(clientAuth.validationMsgs.first()).toBeVisible();
  });

  test('unknown user is rejected', async ({ page, clientAuth }) => {
    await clientAuth.openLogin();
    await clientAuth.login(`ghost.${Date.now()}@example.com`, 'Pass#1234');
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/auth\/login/);
  });

  test('link to registration works', async ({ page, clientAuth }) => {
    await clientAuth.openLogin();
    await clientAuth.registerLink.click();
    await expect(page).toHaveURL(/register/);
  });
});
