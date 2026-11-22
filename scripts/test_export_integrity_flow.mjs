// Synthetic-only browser exercise of the mobile-width subject/export flow.
// Serves local built dist, blocks all non-local network requests. No real data.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
const root = path.resolve('dist');
const out = path.resolve('AYUSWAR-TECHNICAL-EVIDENCE/04-INTEROPERABILITY/export-integrity-ui-2026-11-22');
fs.mkdirSync(out, {recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2'};
const srv=http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';let f=path.join(root,p);if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join(root,'index.html');res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${srv.address().port}`;
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
try {
const p=await b.newPage(); await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
await p.setRequestInterception(true);
p.on('request',r=>{if(r.url().startsWith(origin)||r.url().startsWith('data:')||r.url().startsWith('blob:'))r.continue();else r.abort();});
await p.evaluateOnNewDocument(()=>localStorage.setItem('ayuswar_selected_language','en-IN'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const check=(v,msg)=>{if(!v)throw new Error(msg);console.log('PASS',msg);};
const click=async(text)=>p.evaluate(t=>{const el=[...document.querySelectorAll('button,a')].find(e=>(e.innerText||'').includes(t)&&e.offsetParent!==null&&!e.disabled);if(el){el.click();return true;}return false;},text);
await p.goto(origin,{waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>document.querySelector('.m-splash')&&getComputedStyle(document.querySelector('.m-splash')).visibility==='hidden',{timeout:20000}).catch(()=>{});await sleep(500);
check(await click('Patient Portal'),'home patient portal row');await sleep(700);
check(await click('Demo Patient'),'demo patient auth');await sleep(1400);
await p.evaluate(()=>{const el=[...document.querySelectorAll('*')].filter(e=>(e.innerText||'').includes('ABHA Card & Vitals')&&e.offsetParent).pop();(el.closest('button,[role=button],a')||el).click();});await sleep(700);
await p.evaluate(()=>{const original=URL.createObjectURL.bind(URL);window.__exports=[];const click=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){window.__filename=this.download;return click.call(this);};URL.createObjectURL=blob=>{blob.text().then(t=>window.__exports.push(t));return original(blob);};});
check(await click('Export readings'),'mobile portal export reachable');await sleep(200);
await (await p.$('[data-testid=vitals-export]')).screenshot({path:path.join(out,'01-seeds-excluded.png')});
const type=async(name,value)=>{await p.type(`form input[name=${name}]`,value);};
const submit=async()=>{await p.evaluate(()=>document.querySelector('form button[type=submit]').click());await sleep(350);};
async function enter(choice,label,date,missingFirst=false){
 await click('Add Vitals Manually');await sleep(300);
 await type('systolic','121');await type('diastolic','79');await type('pulse','71');await type('spo2','97');await type('weight','64.5');await type('bloodSugar','110');
 await p.evaluate(date=>{const i=document.querySelector('form input[name=date]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,date);i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));},date);
 if(missingFirst){await submit();check(await p.evaluate(()=>document.body.innerText.includes('Choose whose readings these are')),'missing declaration refuses save');await(await p.$('form fieldset')).screenshot({path:path.join(out,'02-declaration-required.png')});}
 await p.select('select[aria-label="Whose readings"]',choice);
 if(label)await p.type('input[aria-label="Local person label"]',label);
 await submit();check(!(await p.$('form input[name=date]')),'declared entry saved');
}

await enter('__self__','','2026-11-22');
const panel=await p.$('[data-testid=vitals-export]');
await p.evaluate(()=>document.querySelector('[data-testid=vitals-export] input').click());
await p.evaluate(()=>{window.__savedUuid=crypto.randomUUID.bind(crypto);crypto.randomUUID=()=> '11111111-2222-4333-8444-555555555555';});
await click('Export selected');await sleep(350);
check(await p.evaluate(()=>window.__exports.length===0),'vitals integrity failure creates no file');
check(await p.evaluate(()=>document.querySelector('[data-testid=vitals-export-error]').textContent.includes('Export entries share a file identity')),'vitals shows fixed actionable duplicate-ID error');
await panel.screenshot({path:path.join(out,'03-vitals-blocked.png')});
await p.evaluate(()=>{crypto.randomUUID=window.__savedUuid;});
await click('Export selected');await sleep(400);
check(await p.evaluate(()=>window.__exports.length===1),'vitals success retries normally after transient fault');
check(await p.evaluate(()=>!document.querySelector('[data-testid=vitals-export-error]')),'vitals previous failure clears on retry');
await panel.screenshot({path:path.join(out,'04-vitals-success.png')});
const exported=await p.evaluate(()=>window.__exports[0]);
fs.writeFileSync(path.resolve('AYUSWAR-TECHNICAL-EVIDENCE/04-INTEROPERABILITY/INTEGRITY_VITALS_SYNTHETIC_OUTPUT_2026-11-22.json'),exported);
// Scribe journey uses an explicit sample + manual draft. No model call.
await p.goto(origin+'/clinical-console',{waitUntil:'domcontentloaded'});await sleep(1000);
check(await click('Sample demo'),'scribe explicit sample mode');await sleep(200);
check(await click('Use sample'),'scribe sample selected');await sleep(200);
check(await click('Generate draft'),'scribe review route');await sleep(700);
check(await click('Enter manual draft from source transcript'),'scribe explicit manual fallback');await sleep(300);
await p.type('textarea[placeholder]', 'Synthetic practice summary only.');
check(await click('Continue with my edits'),'scribe reviewed manual draft');await sleep(300);
check(await click('Continue to sign & send'),'scribe share stage');await sleep(250);
check(await click('Tap to sign (demo)'),'scribe demo acknowledgement');await sleep(250);
// Navigation reload resets the file spy. Install it on the same actual browser
// transport, then inject an invalid UUID to exercise the ENTRY_ID failure.
await p.evaluate(()=>{const original=URL.createObjectURL.bind(URL);window.__scribeExports=[];URL.createObjectURL=blob=>{blob.text().then(t=>window.__scribeExports.push(t));return original(blob);};window.__savedUuid2=crypto.randomUUID.bind(crypto);crypto.randomUUID=()=> 'SYNTHETIC_PRIVATE_FAULT';});
check(await click('Download FHIR research draft'),'scribe export action');await sleep(250);
check(await p.evaluate(()=>window.__scribeExports.length===0),'scribe integrity failure creates no file');
check(await p.evaluate(()=>document.body.innerText.includes('An export entry has a missing or invalid file identity')),'scribe shows fixed actionable identity error');
check(await p.evaluate(()=>!document.body.innerText.includes('SYNTHETIC_PRIVATE_FAULT')),'scribe diagnostics do not echo corrupt identity');
await (await p.$('.m-dispatch-section')).screenshot({path:path.join(out,'05-scribe-blocked.png')});
await p.evaluate(()=>{crypto.randomUUID=window.__savedUuid2;});
await click('Download FHIR research draft');await sleep(350);
check(await p.evaluate(()=>window.__scribeExports.length===1),'scribe success retries normally after transient fault');
await (await p.$('.m-dispatch-section')).screenshot({path:path.join(out,'06-scribe-success.png')});
const scribe=await p.evaluate(()=>window.__scribeExports[0]);
fs.writeFileSync(path.resolve('AYUSWAR-TECHNICAL-EVIDENCE/04-INTEROPERABILITY/INTEGRITY_SCRIBE_SYNTHETIC_OUTPUT_2026-11-22.json'),scribe);
console.log('Only crypto.randomUUID was fault-injected in the browser. Production app has no test bypass or fault hook.');
console.log('Browser transport only, no Android native-runtime claim. All data synthetic.');
} finally {await b.close();srv.close();}
