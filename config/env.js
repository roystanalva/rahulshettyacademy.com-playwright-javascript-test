require('dotenv').config();

const num = (v, d) => (v !== undefined && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : d);

module.exports = {
  baseURL: (process.env.BASE_URL || 'https://rahulshettyacademy.com').replace(/\/$/, ''),
  paths: {
    home: '/',
    practiceLogin: '/loginpagePractice/',
    shop: '/angularpractice/shop',
    automationPractice: '/AutomationPractice/',
    clientLogin: '/client/#/auth/login',
    clientRegister: '/client/#/auth/register',
    apiLogin: '/api/ecom/auth/login',
  },
  practiceCreds: {
    username: process.env.PRACTICE_USER || 'rahulshettyacademy',
    password: process.env.PRACTICE_PASS || 'learning',
  },
  budgets: {
    ttfb: num(process.env.PERF_TTFB_MS, 1500),
    fcp: num(process.env.PERF_FCP_MS, 3000),
    lcp: num(process.env.PERF_LCP_MS, 4500),
    load: num(process.env.PERF_LOAD_MS, 8000),
    requests: num(process.env.PERF_MAX_REQUESTS, 150),
    transferKB: num(process.env.PERF_MAX_TRANSFER_KB, 6000),
  },
};
