/**
 * AyuSwar AI — Transcribe-Time Upload Consent (Phase 27)
 * test/phase27_transcribe_upload_consent.test.js
 *
 * Audit-driven: recording consent is not upload consent. The recording may
 * leave the device ONLY after an explicit transcribe-time confirmation that
 * discloses the network upload, in all three UI languages. Every stay-local
 * claim must be qualified with "until you transcribe or sync".
 *
 * 1. Static: recording consent copy (en/te/hi) discloses the transcribe
 *    upload and the separate confirmation at transcribe time.
 * 2. Static: a transcribe-time consent dialog exists in en/te/hi with an
 *    explicit confirm and a keep-on-device cancel.
 * 3. Static: the Transcribe button routes through the consent gate
 *    (requestTranscribe), and only confirmTranscribe runs the upload path.
 * 4. Static: the network-speech fail-closed error qualifies its stay-local
 *    claim with the explicit transcribe-or-sync exception.
 */

import { readFileSync } from 'node:fs';

const results = [];
const record = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, err });
  }
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

await record('recording consent discloses the transcribe upload in en/te/hi', async () => {
  const src = readFileSync(new URL('../src/mobile/MClinical.jsx', import.meta.url), 'utf8');
  assert(src.includes('If you tap Transcribe, that recording is sent over the internet to the speech transcription service'), 'en transcribe-upload disclosure missing');
  assert(src.includes('Transcribe asks for your confirmation separately'), 'en separate-confirmation disclosure missing');
  assert(src.includes('Transcribe మీ నిర్ధారణను విడిగా అడుగుతుంది'), 'te separate-confirmation disclosure missing');
  assert(src.includes('Transcribe आपसे अलग से पुष्टि मांगता है'), 'hi separate-confirmation disclosure missing');
});

await record('transcribe-time consent dialog exists in en/te/hi with confirm and cancel', async () => {
  const src = readFileSync(new URL('../src/mobile/MClinical.jsx', import.meta.url), 'utf8');
  assert(src.includes('Send recording for transcription?'), 'en dialog title missing');
  assert(src.includes('Nothing is uploaded until you confirm here'), 'en no-upload-before-confirm missing');
  assert(src.includes('Recording consent does not cover this upload'), 'en consent-separation missing');
  assert(src.includes('ట్రాన్స్క్రిప్షన్ కోసం పంపాలా?'), 'te dialog missing');
  assert(src.includes('ट्रांसक्रिप्शन के लिए रिकॉर्डिंग भेजें?'), 'hi dialog missing');
  assert(src.includes("'Keep on device'"), 'en keep-on-device cancel missing');
});

await record('Transcribe button routes through the consent gate before any upload', async () => {
  const src = readFileSync(new URL('../src/mobile/MClinical.jsx', import.meta.url), 'utf8');
  assert(src.includes('onClick={requestTranscribe}'), 'button must open the consent gate, not transcribe directly');
  assert(src.includes('const requestTranscribe = () => setTranscribeConsentOpen(true);'), 'gate opener missing');
  assert(src.includes('const confirmTranscribe = () => { setTranscribeConsentOpen(false); transcribe(); };'), 'confirm must be the only path into transcribe()');
  assert(src.includes('transcribeConsentOpen && ('), 'consent modal not rendered');
  assert(!src.includes('onClick={transcribe}>'), 'no direct transcribe button may remain');
});

await record('fail-closed error qualifies the stay-local claim', async () => {
  const src = readFileSync(new URL('../src/services/indicSpeechService.js', import.meta.url), 'utf8');
  assert(src.includes('unless you explicitly transcribe or sync them'), 'stay-local claim must be qualified');
  assert(!src.includes('Recorded consultations stay on-device.'), 'unqualified stay-local claim must not remain');
});

let failed = 0;
for (const r of results) {
  if (!r.ok) {
    failed += 1;
    console.error(`  FAIL  ${r.name}: ${r.err?.message || r.err}`);
  } else {
    console.log(`  PASS  ${r.name}`);
  }
}
if (failed > 0) {
  console.error(`Phase 27: ${failed} of ${results.length} checks failed`);
  process.exit(1);
}
console.log(`Phase 27: ${results.length}/${results.length} transcribe-upload consent checks passed`);
