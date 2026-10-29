const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { formatRateLimits, buildBootstrapScript, mergeRateLimitsResponse } = require('../agent.cjs');

const snapshot = {
  limitId: 'codex', planType: 'plus',
  primary: { windowDurationMins: 300, usedPercent: 14 },
  secondary: { windowDurationMins: 10080, usedPercent: 33 }
};
const readings = response => formatRateLimits(response).rings.map(ring => ring.percent);
assert.deepEqual(readings({ rateLimits: snapshot }), [86, 67]);
assert.deepEqual(readings({ rateLimits: { ...snapshot, primary: snapshot.secondary, secondary: snapshot.primary } }), [86, 67]);
assert.deepEqual(readings({ rateLimits: { ...snapshot, primary: null } }), [null, 67]);
assert.deepEqual(readings({ rateLimitsByLimitId: { codex: null }, rateLimits: snapshot }), [null, null]);
assert.deepEqual(readings({ rateLimits: { ...snapshot, limitId: 'reserve' } }), [null, null]);
assert.deepEqual(readings(mergeRateLimitsResponse({ rateLimits: snapshot }, { accountId: 'new', rateLimits: null })), [null, null]);

(async () => {
  const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const executablePath = process.env.CHROME_BIN || (fs.existsSync(macChrome) ? macChrome : undefined);
  const browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 480, height: 560 }, deviceScaleFactor: 2 });
    await page.setContent(`<html class="dark"><style>
      body{margin:0;background:#161c1a;color:white;font-family:Arial,sans-serif}
      nav{height:560px;width:48px;display:flex;flex-direction:column;background:#1d2623}
      .spacer{flex:1}.help{height:48px;width:48px;background:#27322e}
    </style><nav data-app-navigation-rail><div class="spacer"></div><div class="help"></div></nav></html>`);
    await page.evaluate(buildBootstrapScript());
    await page.evaluate(value => window.__codexUsageBadge.update(value), {
      ...formatRateLimits({ rateLimits: snapshot }), updatedAt: Date.now(), stale: false
    });
    const badge = page.locator('#codex-usage-badge');
    assert.equal(await badge.count(), 1);
    assert.deepEqual(await badge.locator('.usage-number').allTextContents(), ['86%', '67%']);
    assert.deepEqual(await badge.locator('.usage-window').allTextContents(), ['5h', 'Week']);
    assert.equal(await badge.getAttribute('role'), 'group');
    assert.deepEqual(await badge.locator('[role="meter"]').evaluateAll(elements => elements.map(el => el.getAttribute('aria-valuenow'))), ['86', '67']);
    assert.equal(await page.locator('#codex-usage-badge .usage-ring:visible').count(), 2);
    assert.equal(await page.locator('[id^="codex-project"], [id^="codex-thread"]').count(), 0);
    const ringBoxes = await badge.locator('.usage-ring').all();
    const numberBoxes = await badge.locator('.usage-number').all();
    for (let index = 0; index < 2; index++) {
      const ring = await ringBoxes[index].boundingBox();
      const number = await numberBoxes[index].boundingBox();
      assert.ok(number.y > ring.y && number.y + number.height < ring.y + ring.height, 'number must be inside its ring');
    }
    const box = await badge.boundingBox();
    await page.screenshot({ path: path.join(__dirname, 'two-rings-preview.png'), clip: {
      x: Math.max(0, box.x - 7), y: box.y - 7, width: box.width + 14, height: box.height + 14
    } });
    await page.evaluate(value => window.__codexUsageBadge.update(value), {
      ...formatRateLimits({ rateLimits: { ...snapshot, primary: null } }), updatedAt: Date.now(), stale: false
    });
    assert.deepEqual(await badge.locator('.usage-number').allTextContents(), ['—', '67%']);
    await page.evaluate(value => window.__codexUsageBadge.update(value), {
      ...formatRateLimits({ rateLimits: snapshot }), updatedAt: Date.now() - 150001, stale: false
    });
    assert.deepEqual(await badge.locator('.usage-number').allTextContents(), ['—', '—']);
    console.log('PASS 5h / Week mapping, missing and stale data, browser layout and extra module exclusion');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
