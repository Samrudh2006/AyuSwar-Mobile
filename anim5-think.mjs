import { chromium } from 'playwright';
import fs from 'fs';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const lang = process.argv[2] || 'en-IN';
  const dir = `/tmp/thinkcast5-${lang}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  let n = 0;
  cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
    fs.writeFileSync(`${dir}/f${String(n++).padStart(4, '0')}.jpg`, Buffer.from(data, 'base64'));
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await p.addInitScript((l) => {
    localStorage.setItem('ayuswar_demo_mode', 'true');
    localStorage.setItem('ayuswar_selected_language', l);
  }, lang);
  await p.goto('http://localhost:4173/patient-portal', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  await p.locator('.floating-assistant-pill').click();
  await p.waitForTimeout(1200);
  const input = p.locator('input[placeholder*="Describe health query"], input[placeholder*="ఆరోగ్య"], textarea').first();
  if (!(await input.isVisible().catch(() => false))) {
    await p.locator('button:has-text("Type"), [aria-label*="Type"]').first().click().catch(() => {});
    await p.waitForTimeout(600);
  }
  await input.fill('What is AyuSwar?');
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, everyNthFrame: 1 });
  // poll the assistant status label through the whole pending+speaking window
  const polls = [];
  const pollTimer = setInterval(async () => {
    try {
      const state = await p.locator('[data-assistant-state]').getAttribute('data-assistant-state');
      const txt = await p.evaluate(() => {
        const root = document.querySelector('[data-assistant-state]');
        if (!root) return '';
        const spans = [...root.querySelectorAll('span')].map((s) => s.innerText || '').filter((t) => t.length > 3 && t.length < 80);
        return spans.find((t) => /speaking|thinking|ready|recording|ఆలోచిస్తోంది|మాట్లాడుతోంది/i.test(t)) || spans[0] || '';
      });
      polls.push(`${Date.now()} state=${state} label=${String(txt).slice(0, 60)}`);
    } catch {}
  }, 40);
  await input.press('Enter');
  await p.waitForTimeout(3000);
  clearInterval(pollTimer);
  await cdp.send('Page.stopScreencast');
  // distinct check: thinking label visible during pending, thinking card present, then speaking/ready after
  const thinkingCard = await p.locator('text=/thinking|ఆలోచిస్తోంది/').count();
  console.log(`lang=${lang} frames=${n} thinkingTextPresent(after)=${thinkingCard}`);
  const uniq = [...new Set(polls.map((x) => x.replace(/^\d+ /, '')))];
  console.log(uniq.slice(0, 25).join('\n'));
  await ctx.close(); await b.close();
})();
