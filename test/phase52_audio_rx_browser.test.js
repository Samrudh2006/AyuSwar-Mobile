// Built-app phone-width software consistency, not acoustic/clinical validation.
// No provider requests leave the local boundary; no microphone is opened.
import {execSync,execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync,statSync,createReadStream} from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const CHROME=[process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean).find(existsSync);
const COUNT=7;
if(!CHROME){if(process.env.AYUSWAR_SUITE_RUN==='1'){for(let i=0;i<COUNT;i++)console.log('↷ Audio-Rx browser check Skipped: no supported browser.');console.log(`(0 passes, ${COUNT} conditional skips)`);process.exit(0)}throw Error('Supported browser required; set CHROME_PATH');}
const out=path.resolve(process.env.AYUSWAR_AUDIO_RX_EVIDENCE_DIR||'test/.tmp-evidence-ui/audio-rx-browser');mkdirSync(out,{recursive:true});
execSync('npm run build',{stdio:'pipe'});
const root=path.resolve('dist'),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.wav':'audio/wav','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{let f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!f.startsWith(root)){res.writeHead(403);return res.end()}if(!existsSync(f)||statSync(f).isDirectory())f=path.join(root,'index.html');res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');createReadStream(f).pipe(res)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[],errors=[],assetRequests=[],blockedProviderRequests=[];
const check=async(name,fn)=>{try{await fn();results.push({name,ok:true});console.log('PASS '+name)}catch(e){results.push({name,ok:false,error:e.message});console.log('FAIL '+name+': '+e.stack);throw e}};
const scripts=[...readFileSync('src/services/bundledSpeechSamples.js','utf8').matchAll(/canonical: '([^']+)'/g)].map(m=>m[1]);
try{
 const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true,isMobile:true,hasTouch:true});
 await context.addInitScript(()=>{localStorage.setItem('ayuswar_selected_language','en-IN');window.__testSpoken=[];if(window.speechSynthesis)window.speechSynthesis.speak=u=>window.__testSpoken.push(u.text);});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.pathname.startsWith('/api/')){blockedProviderRequests.push(u.pathname);return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'software test: provider boundary unavailable'})})}if(u.origin!==base)return route.abort();if(u.pathname.startsWith('/audio/'))assetRequests.push(u.pathname);return route.continue()});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'AI',exact:true}).click();
 await page.getByTitle('Test Vernacular Spoken Prescription on WhatsApp').click();
 await page.locator('#whatsapp-audio-rx-download-wav-btn').waitFor();
 const text=page.getByRole('textbox',{name:'Sample note text (not clinician-reviewed)'});
 const source=await text.inputValue();
 let files=0;page.on('download',()=>files++);
 await check('390px integrated modal default rejects before fetch or file',async()=>{await page.locator('#whatsapp-audio-rx-download-wav-btn').click();await page.getByRole('status').filter({hasText:'No recorded audio is bound'}).waitFor();assert.equal(assetRequests.length,0);assert.equal(files,0);await page.screenshot({path:path.join(out,'modal-default-blocked-390.png')})});
 await check('390px integrated modal canonical downloads byte-identical existing WAV',async()=>{await text.fill(scripts[0]);const promise=page.waitForEvent('download');await page.locator('#whatsapp-audio-rx-download-wav-btn').click();const file=await promise;const downloaded=readFileSync(await file.path());assert.deepEqual(downloaded,readFileSync('public/audio/gnani_telugu_rx_narayana_rao.wav'));assert.deepEqual(assetRequests,['/audio/gnani_telugu_rx_narayana_rao.wav']);assert.equal(file.suggestedFilename(),'AyuSwar_Sample_AudioRx_DEMO_te.wav')});
 await check('360px integrated modal edited source rejects and retains source',async()=>{await page.setViewportSize({width:360,height:800});await text.fill(source);await page.locator('#whatsapp-audio-rx-download-wav-btn').click();await page.getByRole('status').filter({hasText:'No recorded audio is bound'}).waitFor();assert.equal(assetRequests.length,1);assert.equal(files,1);assert.equal(await text.inputValue(),source);await page.screenshot({path:path.join(out,'modal-default-blocked-360.png')})});
 await page.getByRole('button',{name:'Close Window',exact:true}).click();
 await page.goto(base+'/audio-rx',{waitUntil:'networkidle'});await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Verify Patient Teach-Back Quiz (1-Click)',exact:true}).click();
 const q1right=page.getByRole('button',{name:'ఉదయం పరగడుపున',exact:true}),nights=page.getByRole('button',{name:'రాత్రి భోజనం తర్వాత',exact:true});
 const getJson=async()=>{const p=page.waitForEvent('download');await page.getByRole('button',{name:'Export practice JSON',exact:true}).click();return JSON.parse(readFileSync(await(await p).path(),'utf8'))};
 await check('390px integrated quiz completes only existing current correct answers',async()=>{assert(!(await getJson()).sampleQuizCompleted);await q1right.click();await nights.nth(1).click();await page.getByText('✓ Sample quiz complete',{exact:true}).waitFor();assert((await getJson()).sampleQuizCompleted)});
 await check('390px integrated correct-to-wrong revokes banner note and JSON',async()=>{await nights.nth(0).click();assert.equal(await page.getByText('✓ Sample quiz complete',{exact:true}).count(),0);assert.equal(await page.getByText('Both synthetic timing answers matched. No real understanding, adherence or message delivery is verified.',{exact:true}).count(),0);assert((await page.locator('body').innerText()).includes('Sample quiz answers: Not completed'));assert.equal((await getJson()).sampleQuizCompleted,false);await nights.nth(0).scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'studio-wrong-revoked-390.png')})});
 await check('390px integrated wrong-to-correct restores success',async()=>{await q1right.click();await page.getByText('✓ Sample quiz complete',{exact:true}).waitFor();assert((await getJson()).sampleQuizCompleted)});
 await check('360px integrated source edit clears choices; one stale answer cannot complete',async()=>{await page.setViewportSize({width:360,height:800});const editor=page.locator('textarea');await editor.fill((await editor.inputValue())+' ');assert.equal((await getJson()).sampleQuizCompleted,false);await q1right.click();assert.equal(await page.getByText('✓ Sample quiz complete',{exact:true}).count(),0);assert.equal((await getJson()).sampleQuizCompleted,false);await page.getByText('Teach-Back Patient Adherence Quiz',{exact:true}).evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:path.join(out,'studio-edit-reset-360.png')});assert.equal(errors.length,0,JSON.stringify(errors))});
 await context.close();
}finally{
 await browser.close();await new Promise(r=>server.close(r));
 let revision=null;try{revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()}catch{}
 const report={revision,trackedWorkingTreeDirty:!!execFileSync('git',['status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim(),scope:'Built mobile routes at390/360px; API/provider boundaries blocked, no microphone or clinical/audio validation.',buildIndexSha256:crypto.createHash('sha256').update(readFileSync('dist/index.html')).digest('hex'),results,errors,assetRequests,blockedProviderRequests};writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(report,null,2));
}
console.log(`audio_rx_browser: ${results.filter(r=>r.ok).length}/${COUNT} passed`);if(results.length!==COUNT||results.some(r=>!r.ok))process.exit(1);
