// Synthetic-only browser exercise of the mobile-width subject/export flow.
// Serves local built dist, blocks all non-local network requests. No real data.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
const root = path.resolve('dist');
const out = path.resolve('AYUSWAR-TECHNICAL-EVIDENCE/04-INTEROPERABILITY/vitals-identity-ui-2026-11-22');
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
const click=async(text)=>p.evaluate(t=>{const el=[...document.querySelectorAll('button,a')].find(e=>(e.innerText||'').includes(t)&&e.offsetParent!==null);if(el){el.click();return true;}return false;},text);
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
await enter('__new__','SYNTHETIC SAME LABEL','2026-11-20',true);
await enter('__new__','SYNTHETIC SAME LABEL','2026-11-21');
await enter('__self__','','2026-11-22');
const panel=await p.$('[data-testid=vitals-export]');
await panel.screenshot({path:path.join(out,'03-same-label-and-self-unchecked.png')});
check(await p.evaluate(()=>[...document.querySelectorAll('[data-testid=vitals-export] input')].every(e=>!e.checked)),'all rows unchecked by default');
await p.evaluate(()=>document.querySelectorAll('[data-testid=vitals-export] input')[1].click());
await p.evaluate(()=>document.querySelectorAll('[data-testid=vitals-export] input')[2].click());await sleep(200);
check(await p.evaluate(()=>[...document.querySelectorAll('[data-testid=vitals-export] input')].filter(e=>e.checked).length===1),'cross-subject tick refused for same labels');
await panel.screenshot({path:path.join(out,'04-cross-person-refused.png')});
await click('Export selected');await sleep(700);
const exports=await p.evaluate(()=>window.__exports);check(exports.length===1,'one actual file export captured');
check(await p.evaluate(()=>/^ayuswar-readings-\d{4}-\d{2}-\d{2}\.json$/.test(window.__filename)), 'person-neutral filename');
const exported=JSON.parse(exports[0]);
check(exported.entry[0].resource.resourceType==='Patient'&&exported.entry.length===4,'one anonymous Patient and three Observations');
const local=await p.evaluate(()=>Object.entries(localStorage).filter(([k])=>k.startsWith('ayuswar_vitals_')).map(([k,v])=>({key:k,value:JSON.parse(v)})));
const registry=local.find(x=>x.key.endsWith('_subjects')).value;
check(registry.length===3&&new Set(registry.map(s=>s.id)).size===3,'same labels and self keep three stable local identities');
check(!registry.some(s=>exports[0].includes(s.id)||exports[0].includes(s.label)),'no local IDs or labels in file');
fs.writeFileSync(path.resolve('AYUSWAR-TECHNICAL-EVIDENCE/04-INTEROPERABILITY/SELF_ENTERED_VITALS_IDENTITY_SYNTHETIC_FIXTURE_2026-11-22.json'),exports[0]);
await panel.screenshot({path:path.join(out,'05-export-complete.png')});
console.log('Mobile-width flow only, no Android device or native runtime claim.');
} finally {await b.close();srv.close();}
