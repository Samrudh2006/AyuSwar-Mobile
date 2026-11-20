import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport:{width:390,height:844}, recordVideo:{ dir:'/tmp/vid4', size:{width:390,height:844} } });
const p = await ctx.newPage();
await p.route(/groq|api\./, async r => { await new Promise(res => setTimeout(res, 6000)); await r.abort(); });
await p.goto('http://localhost:4174/clinical-console', { waitUntil:'networkidle' });
await p.getByText('Sample demo').first().click();
await p.waitForTimeout(600);
await p.getByText('Use sample transcript').first().click();
await p.waitForTimeout(500);
await p.getByText('Generate draft from this transcript').first().click();
await p.waitForTimeout(3000);
await p.waitForTimeout(8000); // error state readable
await p.getByText('Enter manual draft from source transcript').first().click();
await p.waitForTimeout(2000);
await p.screenshot({ path:'/tmp/chain-1-manual-draft.png' });
const openNote = p.getByText('Open structured OPD note');
if (await openNote.count()) {
  await openNote.first().click();
} else {
  // manual draft may need a step forward; find primary continue
  await p.locator('button.m-btn-primary').first().click().catch(()=>{});
  await p.waitForTimeout(1200);
  await p.getByText('Open structured OPD note').first().click();
}
await p.waitForTimeout(1800);
await p.screenshot({ path:'/tmp/chain-2-note-prefilled.png' });
await p.getByText('Save note').click();
await p.waitForTimeout(1200);
await p.screenshot({ path:'/tmp/chain-3-saved.png' });
await ctx.close();
await b.close();
console.log('done');
