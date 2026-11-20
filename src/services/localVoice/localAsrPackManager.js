/**
 * AyuSwar AI — Offline ASR pack manager (download consent + integrity).
 *
 * Same rules as the TTS voice pack, as a SEPARATE consent and cache namespace:
 * - Nothing downloads without explicit recorded consent shown the exact byte
 *   size (187,133,682 bytes for te).
 * - Unknown network state counts as metered; only known wifi/ethernet passes
 *   without an explicit mobile-data opt-in.
 * - Every file is sha256-verified after download and again on each load;
 *   mismatch deletes and fails closed.
 * - Cancellation aborts and removes partial state.
 * - Status is always re-derived from Cache Storage, never trusted from memory.
 *
 * The pack is a DRAFT-transcription aid: output requires human review before
 * any clinical use (see localAsrManifest.js accuracy boundary).
 */

import { ASR_MODELS, asrTotalBytes } from './localAsrManifest.js';
import { LocalVoiceError, sha256Hex, putInCache, getCachedModelFile, getVerifiedModelFile } from './localModelManager.js';

const CACHE_NAME = 'ayuswar-local-voice-v1'; // shared store, asr/ key prefix
const ASR_CONSENT_KEY = 'ayuswar.localAsr.consent.v1';

const env = {
  fetchFn: (...a) => fetch(...a),
  cachesFn: () => (typeof caches !== 'undefined' ? caches : null),
  storageFn: () => (typeof localStorage !== 'undefined' ? localStorage : null),
  connectionFn: () => (typeof navigator !== 'undefined' ? navigator.connection : null)
};
export function _setAsrEnvForTests(overrides) { Object.assign(env, overrides); }

function readConsent() {
  try {
    const raw = env.storageFn()?.getItem(ASR_CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/** Record explicit consent. UI must have displayed totalBytes + provenance first. */
export function recordLocalAsrConsent({ language, allowCellular = false }) {
  const totalBytes = asrTotalBytes(language);
  if (!totalBytes) throw new LocalVoiceError('UNSUPPORTED_LANGUAGE', `No local ASR model registered for '${language}'.`);
  const record = { language, totalBytes, allowCellular, consentedAt: new Date().toISOString() };
  env.storageFn()?.setItem(ASR_CONSENT_KEY, JSON.stringify(record));
  return record;
}

export function clearLocalAsrConsent() { env.storageFn()?.removeItem(ASR_CONSENT_KEY); }
export function getLocalAsrConsent() { return readConsent(); }

function assertUsableConsent(language) {
  const c = readConsent();
  if (!c || c.language !== language) {
    throw new LocalVoiceError('CONSENT_REQUIRED', 'Explicit consent required before downloading the offline transcription pack.', { totalBytes: asrTotalBytes(language) });
  }
  const currentBytes = asrTotalBytes(language);
  if (c.totalBytes !== currentBytes) {
    throw new LocalVoiceError('CONSENT_REQUIRED', 'Transcription pack size changed since consent; the new size must be shown and re-confirmed.', { totalBytes: currentBytes });
  }
  const conn = env.connectionFn();
  const knownUnmetered = Boolean(conn) && (conn.type === 'wifi' || conn.type === 'ethernet');
  if (!knownUnmetered && !c.allowCellular) {
    throw new LocalVoiceError('CELLULAR_BLOCKED', 'Transcription pack download needs a known Wi-Fi connection unless the user explicitly allows mobile data (network state unknown counts as mobile data).', { totalBytes: currentBytes });
  }
  return c;
}

const asrKey = (language, key) => `asr/${language}/${key}`;

export async function getVerifiedAsrFile(language, key, expectedSha256) {
  return getVerifiedModelFile(asrKey(language, key), expectedSha256);
}

export async function getAsrPackStatus(language) {
  const m = ASR_MODELS[language];
  if (!m) return { language, state: 'unsupported' };
  const c = env.cachesFn();
  if (!c) return { language, state: 'unavailable_no_cache_api' };
  for (const f of m.files) {
    const buf = await getCachedModelFile(asrKey(language, f.key));
    if (!buf) return { language, state: 'not_installed', totalBytes: asrTotalBytes(language) };
  }
  return { language, state: 'installed', totalBytes: asrTotalBytes(language) };
}

export async function installLocalAsrPack(language, { signal, onProgress } = {}) {
  const m = ASR_MODELS[language];
  if (!m) throw new LocalVoiceError('UNSUPPORTED_LANGUAGE', `No local ASR model registered for '${language}'.`);
  assertUsableConsent(language);
  const fetchF = env.fetchFn;
  const store = await env.cachesFn().open(CACHE_NAME);

  for (let i = 0; i < m.files.length; i++) {
    const f = m.files[i];
    if (signal?.aborted) throw new LocalVoiceError('ABORTED', 'Download cancelled.');
    const res = await fetchF(f.url, { signal });
    if (!res.ok) throw new LocalVoiceError('DOWNLOAD_FAILED', `ASR file '${f.key}' download failed (HTTP ${res.status}).`);
    let buf;
    if (res.body && res.body.getReader) {
      const reader = res.body.getReader();
      const chunks = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.byteLength;
        onProgress?.({ fileIndex: i, fileCount: m.files.length, received, total: f.bytes });
      }
      buf = new Uint8Array(received);
      let off = 0;
      for (const ch of chunks) { buf.set(ch, off); off += ch.byteLength; }
      buf = buf.buffer;
    } else {
      buf = await res.arrayBuffer();
    }
    const hex = await sha256Hex(buf);
    if (hex !== f.sha256) {
      await store.delete(`/__local_voice__/${asrKey(language, f.key)}`);
      throw new LocalVoiceError('HASH_MISMATCH', `Downloaded '${f.key}' failed integrity check; nothing was kept.`);
    }
    await putInCache(asrKey(language, f.key), buf);
  }
  return { language, state: 'installed', totalBytes: asrTotalBytes(language) };
}

export async function uninstallLocalAsrPack(language) {
  const c = env.cachesFn();
  if (!c) return { language, state: 'not_installed' };
  const store = await c.open(CACHE_NAME);
  const keys = await store.keys();
  let removed = 0;
  for (const req of keys) {
    if (req.url.includes(`/__local_voice__/asr/${language}/`)) {
      await store.delete(req);
      removed++;
    }
  }
  return { language, state: 'not_installed', removedFiles: removed };
}
