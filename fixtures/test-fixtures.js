const base = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { PracticeLoginPage } = require('../pages/PracticeLoginPage');
const { ClientAuthPage } = require('../pages/ClientAuthPage');

const test = base.test.extend({
  homePage: async ({ page }, use) => use(new HomePage(page)),
  practiceLogin: async ({ page }, use) => use(new PracticeLoginPage(page)),
  clientAuth: async ({ page }, use) => use(new ClientAuthPage(page)),
  // Collects JS console errors + failed requests for any test that asks for it
  diagnostics: async ({ page }, use) => {
    const d = { consoleErrors: [], pageErrors: [], failedRequests: [] };
    page.on('console', (m) => m.type() === 'error' && d.consoleErrors.push(m.text()));
    page.on('pageerror', (e) => d.pageErrors.push(e.message));
    page.on('requestfailed', (r) => d.failedRequests.push(`${r.url()} :: ${r.failure()?.errorText}`));
    await use(d);
  },
});

module.exports = { test, expect: base.expect };
