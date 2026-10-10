const SKIP_PREFIXES = ['#', 'mailto:', 'tel:', 'javascript:', 'data:', 'sms:', 'whatsapp:'];

function isCheckable(href) {
  if (!href || !href.trim()) return false;
  const h = href.trim().toLowerCase();
  return !SKIP_PREFIXES.some((p) => h.startsWith(p));
}

function normalizeUrl(href, base) {
  try {
    const u = new URL(href.trim(), base);
    if (!/^https?:$/.test(u.protocol)) return null;
    u.hash = '';
    return u.toString();
  } catch {
    return null;
  }
}

const stripWww = (h) => h.replace(/^www\./, '');

function isInternal(url, base) {
  const a = stripWww(new URL(url).hostname);
  const b = stripWww(new URL(base).hostname);
  return a === b || a.endsWith(`.${b}`);
}

function uniqueLinks(hrefs, base) {
  const out = new Set();
  for (const href of hrefs) {
    if (!isCheckable(href)) continue;
    const n = normalizeUrl(href, base);
    if (n) out.add(n);
  }
  return [...out];
}

// ok: 2xx/3xx | restricted: bot-blocking / method-not-allowed (not proof of a broken link) | broken: everything else
function classifyStatus(status) {
  if (status >= 200 && status < 400) return 'ok';
  if ([401, 403, 405, 429, 999].includes(status)) return 'restricted';
  return 'broken';
}

async function checkUrl(request, url, timeout = 20_000) {
  try {
    let res = await request.head(url, { timeout, maxRedirects: 5 });
    if (res.status() >= 400) res = await request.get(url, { timeout, maxRedirects: 5 });
    return { url, status: res.status() };
  } catch (error) {
    return { url, status: 0, error: String(error.message || error).split('\n')[0] };
  }
}

async function checkAll(request, urls, { concurrency = 8, timeout = 20_000 } = {}) {
  const results = [];
  let i = 0;
  const worker = async () => {
    while (i < urls.length) {
      const url = urls[i++];
      results.push(await checkUrl(request, url, timeout));
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
  return results.map((r) => ({ ...r, verdict: r.status === 0 ? 'broken' : classifyStatus(r.status) }));
}

module.exports = { isCheckable, normalizeUrl, isInternal, uniqueLinks, classifyStatus, checkUrl, checkAll };
