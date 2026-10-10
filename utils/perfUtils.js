function evaluateBudgets(metrics, budgets) {
  const violations = [];
  const check = (key, label, unit = 'ms') => {
    if (budgets[key] !== undefined && metrics[key] > budgets[key]) {
      violations.push(`${label} ${Math.round(metrics[key])}${unit} exceeds budget ${budgets[key]}${unit}`);
    }
  };
  check('ttfb', 'TTFB');
  check('fcp', 'FCP');
  check('lcp', 'LCP');
  check('load', 'Load');
  check('requests', 'Request count', '');
  check('transferKB', 'Transfer size', 'KB');
  return violations;
}

async function collectMetrics(page) {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        let lcp = 0;
        try {
          new PerformanceObserver((list) => {
            const e = list.getEntries();
            if (e.length) lcp = e[e.length - 1].startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (_) {}
        setTimeout(() => {
          const nav = performance.getEntriesByType('navigation')[0] || {};
          const paint = Object.fromEntries(performance.getEntriesByType('paint').map((p) => [p.name, p.startTime]));
          const res = performance.getEntriesByType('resource');
          resolve({
            ttfb: nav.responseStart || 0,
            domContentLoaded: nav.domContentLoadedEventEnd || 0,
            load: nav.loadEventEnd || 0,
            fcp: paint['first-contentful-paint'] || 0,
            lcp,
            requests: res.length,
            transferKB: Math.round(res.reduce((s, r) => s + (r.transferSize || 0), 0) / 1024),
          });
        }, 600);
      })
  );
}

module.exports = { evaluateBudgets, collectMetrics };
