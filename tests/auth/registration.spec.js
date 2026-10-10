const { test, expect } = require('../../fixtures/test-fixtures');
const { registrationUser, EDGE_STRINGS } = require('../../utils/dataFactory');

test.describe('@registration client app registration', () => {
  test.beforeEach(async ({ clientAuth }) => {
    await clientAuth.openRegister();
    await expect(clientAuth.firstName).toBeVisible();
  });

  test('form shows all required fields', async ({ clientAuth }) => {
    for (const f of [clientAuth.firstName, clientAuth.lastName, clientAuth.email, clientAuth.phone, clientAuth.password, clientAuth.confirmPassword]) {
      await expect(f).toBeVisible();
    }
  });

  test('submitting an empty form shows validation and no API call', async ({ page, clientAuth }) => {
    let posted = false;
    page.on('request', (r) => /auth\/register/.test(r.url()) && r.method() === 'POST' && (posted = true));
    await clientAuth.submit();
    await page.waitForTimeout(800);
    expect(posted).toBe(false);
    await expect(clientAuth.validationMsgs.first()).toBeVisible();
  });

  test('mismatched passwords are rejected', async ({ page, clientAuth }) => {
    const u = registrationUser({ confirmPassword: 'Different#999' });
    await clientAuth.fillRegistration(u);
    let posted = false;
    page.on('request', (r) => /auth\/register/.test(r.url()) && r.method() === 'POST' && (posted = true));
    await clientAuth.submit();
    await page.waitForTimeout(800);
    expect(posted).toBe(false);
  });

  test('invalid email format is rejected', async ({ clientAuth }) => {
    await clientAuth.fillRegistration(registrationUser({ email: 'bad-email' }));
    await clientAuth.submit();
    await expect(clientAuth.validationMsgs.first()).toBeVisible();
  });

  test('short phone number is rejected', async ({ clientAuth }) => {
    await clientAuth.fillRegistration(registrationUser({ phone: '123' }));
    await clientAuth.submit();
    await expect(clientAuth.validationMsgs.first()).toBeVisible();
  });

  test('weak password is rejected', async ({ clientAuth }) => {
    await clientAuth.fillRegistration(registrationUser({ password: 'abc', confirmPassword: 'abc' }));
    await clientAuth.submit();
    await expect(clientAuth.validationMsgs.first()).toBeVisible();
  });

  test('age/terms checkbox is required', async ({ page, clientAuth }) => {
    await clientAuth.fillRegistration(registrationUser(), { check: false });
    let posted = false;
    page.on('request', (r) => /auth\/register/.test(r.url()) && r.method() === 'POST' && (posted = true));
    await clientAuth.submit();
    await page.waitForTimeout(800);
    expect(posted).toBe(false);
  });

  test('special characters / unicode in names do not crash the form', async ({ page, clientAuth, diagnostics }) => {
    await clientAuth.fillRegistration(registrationUser({ firstName: EDGE_STRINGS.unicode, lastName: EDGE_STRINGS.specialChars }));
    await clientAuth.submit();
    await page.waitForTimeout(1500);
    expect(diagnostics.pageErrors).toEqual([]);
  });

  test('valid registration succeeds and the new user can log in (end-to-end)', async ({ page, clientAuth }) => {
    const u = registrationUser();
    await clientAuth.fillRegistration(u);
    const resp = page.waitForResponse((r) => /auth\/register/.test(r.url()) && r.request().method() === 'POST');
    await clientAuth.submit();
    expect((await resp).status()).toBeLessThan(400);

    await clientAuth.openLogin();
    const loginResp = page.waitForResponse((r) => /auth\/login/.test(r.url()) && r.request().method() === 'POST');
    await clientAuth.login(u.email, u.password);
    expect((await loginResp).status()).toBe(200);
  });

  test('registering the same email twice is rejected', async ({ page, request, clientAuth }) => {
    const u = registrationUser();
    await clientAuth.fillRegistration(u);
    const first = page.waitForResponse((r) => /auth\/register/.test(r.url()) && r.request().method() === 'POST');
    await clientAuth.submit();
    expect((await first).status()).toBeLessThan(400);

    await clientAuth.openRegister();
    await clientAuth.fillRegistration(u);
    const second = page.waitForResponse((r) => /auth\/register/.test(r.url()) && r.request().method() === 'POST');
    await clientAuth.submit();
    expect((await second).status()).toBeGreaterThanOrEqual(400);
  });
});
