// Synthetic-only checks of the app-local integrity/transport boundary.
// Not a FHIR conformance, terminology or clinical test suite.
import assert from 'node:assert/strict';
import { buildDraftBundle } from '../src/mobile/scribeDraft.js';
import { buildVitalsBundle } from '../src/utils/vitalsExport.js';
import { formatManualVital, buildManualVital } from '../src/utils/vitalsEntry.js';
import { checkExportIntegrity, INTEGRITY_MESSAGES } from '../src/utils/exportIntegrity.js';
import { exportCheckedCollection } from '../src/services/checkedCollectionExport.js';
const scribe = buildDraftBundle({subjective:'SYNTHETIC SENSITIVE SOURCE',objective:'Not documented',assessment:'Not documented',plan:'Not documented'},[{speaker:'PATIENT',text:'SYNTHETIC SENSITIVE SOURCE'}],'sample');
const values = buildManualVital({date:'2026-11-22',systolic:'121',diastolic:'79',pulse:'71',spo2:'97',weight:'64.5'}).values;
const row = {...formatManualVital(values,'fixture-row'),subjectId:'LOCAL-SECRET-ID'};
const vitals = buildVitalsBundle([row],[row.id],[{id:row.subjectId,kind:'self',label:'LOCAL SECRET LABEL'}]);
let passed=0,failed=0;
const test=async(name,fn)=>{try{await fn();passed++;console.log(`PASS ${name}`);}catch(e){failed++;console.log(`FAIL ${name}: ${e.message}`);}};
for (const [kind,bundle] of [['scribe',scribe],['vitals',vitals]]) {
 await test(`${kind}: actual emitter passes without mutation`,()=>{const snapshot=JSON.stringify(bundle);assert.equal(checkExportIntegrity(bundle,kind).ok,true);assert.equal(JSON.stringify(bundle),snapshot);});
 await test(`${kind}: actual transport called once with unchanged serialized output`,async()=>{let calls=0;const result=await exportCheckedCollection({bundle,kind,filename:'synthetic.json',shareTitle:'Synthetic'},async opts=>{calls++;assert.equal(opts.text,JSON.stringify(bundle,null,2));assert.equal(opts.filename,'synthetic.json');return{mode:'test-transport'};});assert.equal(calls,1);assert.equal(result.mode,'test-transport');});
}
const cases = [
 ['wrong collection type','scribe',scribe,b=>b.type='document','COLLECTION'],
 ['empty entries','scribe',scribe,b=>b.entry=[],'COLLECTION'],
 ['missing timestamp','scribe',scribe,b=>delete b.timestamp,'COLLECTION'],
 ['impossible timestamp day','scribe',scribe,b=>b.timestamp='2026-02-30T10:00:00Z','COLLECTION'],
 ['missing fullUrl','scribe',scribe,b=>delete b.entry[0].fullUrl,'ENTRY_ID'],
 ['invalid fullUrl','scribe',scribe,b=>b.entry[0].fullUrl='SYNTHETIC SENSITIVE SOURCE','ENTRY_ID'],
 ['duplicate fullUrls','vitals',vitals,b=>b.entry[1].fullUrl=b.entry[0].fullUrl,'DUPLICATE_ID'],
 ['case-variant duplicate fullUrls','vitals',vitals,b=>b.entry[1].fullUrl=b.entry[0].fullUrl.toUpperCase(),'DUPLICATE_ID'],
 ['null entry','scribe',scribe,b=>b.entry[0]=null,'RESOURCE'],
 ['missing narrative','scribe',scribe,b=>delete b.entry[0].resource.text,'RESOURCE'],
 ['unsupported resource','vitals',vitals,b=>b.entry[1].resource.resourceType='Condition','RESOURCE'],
 ['missing draft section','scribe',scribe,b=>b.entry[0].resource.item.pop(),'SCRIBE_FIELDS'],
 ['duplicate draft section','scribe',scribe,b=>b.entry[0].resource.item[1].linkId=b.entry[0].resource.item[0].linkId,'SCRIBE_FIELDS'],
 ['non-string draft answer','scribe',scribe,b=>b.entry[0].resource.item[0].answer[0].valueString=4,'SCRIBE_FIELDS'],
 ['invalid draft workflow status','scribe',scribe,b=>b.entry[0].resource.status='SYNTHETIC SENSITIVE SOURCE','SCRIBE_FIELDS'],
 ['missing synthetic draft label','scribe',scribe,b=>delete b.meta,'SCRIBE_FIELDS'],
 ['unexpected draft reference','scribe',scribe,b=>b.entry[0].resource.subject={reference:'https://example.invalid/SECRET'},'REFERENCE'],
 ['missing Patient','vitals',vitals,b=>b.entry.shift(),'RESOURCE'],
 ['multiple Patients','vitals',vitals,b=>b.entry.push({...structuredClone(b.entry[0]),fullUrl:'urn:uuid:11111111-2222-4333-8444-555555555555'}),'RESOURCE'],
 ['missing subject','vitals',vitals,b=>delete b.entry[1].resource.subject,'REFERENCE'],
 ['dangling subject','vitals',vitals,b=>b.entry[1].resource.subject.reference='urn:uuid:11111111-2222-4333-8444-555555555555','REFERENCE'],
 ['external subject','vitals',vitals,b=>b.entry[1].resource.subject.reference='https://example.invalid/SECRET','REFERENCE'],
 ['wrong resource target','vitals',vitals,b=>b.entry[1].resource.subject.reference=b.entry[2].fullUrl,'REFERENCE'],
 ['hidden nested external reference','vitals',vitals,b=>b.meta={extension:[{valueReference:{reference:'https://example.invalid/SECRET'}}]},'REFERENCE'],
 ['invalid reading date','vitals',vitals,b=>b.entry[1].resource.effectiveDateTime='2026-02-30','VITAL_FIELDS'],
 ['non-numeric reading','vitals',vitals,b=>b.entry[2].resource.valueQuantity.value='71','VITAL_FIELDS'],
 ['wrong UCUM unit code','vitals',vitals,b=>b.entry[2].resource.valueQuantity.code='kg','VITAL_FIELDS'],
 ['unexpected coded metric','vitals',vitals,b=>b.entry[2].resource.code.coding[0].code='2708-6','VITAL_FIELDS'],
 ['missing BP component','vitals',vitals,b=>b.entry[1].resource.component.pop(),'VITAL_FIELDS'],
 ['non-array category','vitals',vitals,b=>b.entry[1].resource.category={some:'bad'},'VITAL_FIELDS'],
 ['identity expansion not accepted','vitals',vitals,b=>b.entry[0].resource.identifier=[{value:'LOCAL SECRET LABEL'}],'RESOURCE']
];
for(const [name,kind,source,corrupt,code]of cases)await test(`blocked: ${name}, no transport, value-free diagnostics`,async()=>{
 const bundle=structuredClone(source);corrupt(bundle);let calls=0;
 const result=await exportCheckedCollection({bundle,kind,filename:'synthetic.json'},async()=>{calls++;return{mode:'test-transport'};});
 assert.equal(result.mode,'blocked');assert.equal(calls,0);assert(result.errors.some(e=>e.code===code));
 for(const error of result.errors)assert.equal(error.message,INTEGRITY_MESSAGES[error.code]);
 assert(!/SYNTHETIC SENSITIVE SOURCE|LOCAL SECRET|example.invalid|121|71/.test(JSON.stringify(result)));
});
await test('unknown shape cannot bypass gate',()=>assert.equal(checkExportIntegrity(scribe,'unknown').ok,false));
await test('null input cannot bypass gate',()=>assert.equal(checkExportIntegrity(null,'vitals').ok,false));
await test('reference cycle fails closed without throwing',()=>{const b=structuredClone(vitals);b.meta={cycle:b};assert.equal(checkExportIntegrity(b,'vitals').ok,false);});
console.log(`phase51_export_integrity: ${passed} passed, ${failed} failed`);
if(failed)process.exit(1);
