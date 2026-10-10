// UI <-> backend integration: verify the front end talks to the API correctly and handles API failures.
const { test, expect } = require('../../fixtures/test-fixtures');
const env = require('../../config/env');

test.describe('@integration client app <-> auth API', () => {
  test('API: invalid credentials return a 4xx with a message', async ({ request }) => {
    const res = await request.post(env.paths.apiLogin, { data: { userEmail: 'nobody@example.com', userPassword: 'Wrong#123' }, failOnStatusCode: false });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
    const body = await res.json().catch(() => ({}));
    expect(JSON.stringify(body).length).toBeGreaterThan(2);
  });

  test('API: missing body fields are rejected', async ({ request }) => {
    const res = await request.post(env.paths.apiLogin, { data: {}, failOnStatusCode: false });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('UI login submits credentials to the auth API', async ({ page, clientAuth }) => {
    await clientAuth.openLogin();
    const [req] = await Promise.all([
      page.waitForRequest((r) => /\/api\/ecom\/auth\/login/.test(r.url()) && r.method() === 'POST'),
      clientAuth.login('integration@example.com', 'Wrong#123'),
    ]);
    const payload = req.postDataJSON();
    expect(payload).toMatchObject({ userEmail: 'integration@example.com', userPassword: 'Wrong#123' });
  });

  test('UI shows feedback when the API rejects the login (real backend)', async ({ page, clientAuth }) => {
    await clientAuth.openLogin();
    const respPromise = page.waitForResponse((r) => /\/api\/ecom\/auth\/login/.test(r.url()));
    await clientAuth.login('integration@example.com', 'Wrong#123');
    const resp = await respPromise;
    expect(resp.status()).toBeGreaterThanOrEqual(400);
    await expect(clientAuth.toast).toBeVisible();
  });

  test('UI handles a mocked 500 from the API without crashing', async ({ page, clientAuth, diagnostics }) => {
    await page.route('**/api/ecom/auth/login', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'boom' }) }));
    await clientAuth.openLogin();
    await clientAuth.login('a@b.com', 'Pass#1234');
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/auth\/login/);
    expect(diagnostics.pageErrors).toEqual([]);
  });

  test('UI handles a network failure from the API', async ({ page, clientAuth, diagnostics }) => {
    await page.route('**/api/ecom/auth/login', (route) => route.abort('connectionrefused'));
    await clientAuth.openLogin();
    await clientAuth.login('a@b.com', 'Pass#1234');
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/auth\/login/);
    expect(diagnostics.pageErrors).toEqual([]);
  });

  test('UI accepts a mocked successful login response and leaves the login page', async ({ page, clientAuth }) => {
    await page.route('**/api/ecom/auth/login', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'mock-token', userId: 'u1', message: 'Login Successfully' }) })
    );
    await clientAuth.openLogin();
    await clientAuth.login('mock@example.com', 'Pass#1234');
    await page.waitForURL((u) => !/auth\/login/.test(u.hash), { timeout: 15_000 }).catch(() => {});
    expect(page.url()).not.toMatch(/auth\/login/);
  });
});
