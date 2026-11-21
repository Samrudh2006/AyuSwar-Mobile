import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p.addInitScript(() => localStorage.setItem('ayuswar_demo_mode', 'true'));
  await p.goto('http://localhost:4173/appointment-ticket', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  const m = await p.evaluate(() => {
    const input = document.querySelector('input[aria-label*="reference" i]');
    if (!input) return 'no input';
    const r = input.getBoundingClientRect();
    const pr = input.parentElement.getBoundingClientRect();
    const cs = getComputedStyle(input);
    return { inputW: r.width, parentW: pr.width, parentDisplay: getComputedStyle(input.parentElement).display, flex: cs.flex, size: input.getAttribute('size'), placeholder: input.placeholder };
  });
  console.log(JSON.stringify(m));
  await b.close();
})();
