/**
 * AyuSwar AI — Local voice model manager.
 *
 * Rules enforced here (rural-PHC brief + audit posture):
 * - NOTHING downloads without an explicit recorded consent that was shown the
 *   exact byte size (CONSENT_REQUIRED carries the size so UI can display it).
 * - Mobile data is never used silently: on a cellular connection the install
 *   refuses unless the user explicitly allowed cellular for this download.
 * - Every file is sha256-verified against the pinned manifest AFTER download
 *   and AGAIN on load; a mismatch deletes the file and fails closed.
 * - Cancellation aborts the download and removes partial state.
 * - Storage: Cache Storage (same-origin, evictable by the OS - status is
 *   always re-derived, never trusted from memory).
 */

import { TTS_MODELS, ttsTotalBytes } from './localVoiceManifest.js';

const CACHE_NAME = 'ayuswar-local-voice-v1';
const CONSENT_KEY = 'ayuswar.localVoice.consent.v1';

export class LocalVoiceError extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    if (details) this.details = details;
  }
}

// Injectable environment so unit tests can run without a browser.
const env = {
  fetchFn: (...a) => fetch(...a),
  cachesFn: () => (typeof caches !== 'undefined' ? caches : null),
  storageFn: () => (typeof localStorage !== 'undefined' ? localStorage : null),
  connectionFn: () => (typeof navigator !== 'undefined' ? navigator.connection : null),
  cryptoFn: () => (typeof crypto !== 'undefined' ? crypto.subtle : null)
};
export function _setEnvForTests(overrides) { Object.assign(env, overrides); }

async function sha256Hex(buf) {
  const subtle = env.cryptoFn();
  if (!subtle) throw new LocalVoiceError('NO_CRYPTO', 'WebCrypto unavailable; cannot verify model integrity.');
  const digest = await subtle.digest('SHA-256', buf);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function readConsent() {
  try {
    const raw = env.storageFn()?.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/** Record explicit consent. UI must have displayed totalBytes + license first. */
export function recordLocalVoiceConsent({ language, allowCellular = false }) {
  const totalBytes = ttsTotalBytes(language);
  if (!totalBytes) throw new LocalVoiceError('UNSUPPORTED_LANGUAGE', `No local voice model registered for '${language}'.`);
  const record = { language, totalBytes, allowCellular, consentedAt: new Date().toISOString() };
  env.storageFn()?.setItem(CONSENT_KEY, JSON.stringify(record));
  return record;
}

export function clearLocalVoiceConsent() {
  env.storageFn()?.removeItem(CONSENT_KEY);
}

export function getLocalVoiceConsent() { return readConsent(); }

function assertUsableConsent(language) {
  const c = readConsent();
  if (!c || c.language !== language) {
    throw new LocalVoiceError('CONSENT_REQUIRED', 'Explicit consent required before downloading voice models.', { totalBytes: ttsTotalBytes(language) });
  }
  const conn = env.connectionFn();
  const onCellular = conn && (conn.type === 'cellular' || conn.effectiveType === '2g' || conn.effectiveType === '3g');
  if (onCellular && !c.allowCellular) {
    throw new LocalVoiceError('CELLULAR_BLOCKED', 'On mobile data: voice model download is Wi-Fi-only unless the user explicitly allows mobile data.');
  }
  return c;
}

async function putInCache(key, buf) {
  const store = await env.cachesFn().open(CACHE_NAME);
  await store.put(`/__local_voice__/${key}`, new Response(buf, { headers: { 'content-type': 'application/octet-stream' } }));
}

export async function getCachedModelFile(key) {
  const c = env.cachesFn();
  if (!c) return null;
  const store = await c.open(CACHE_NAME);
  const res = await store.match(`/__local_voice__/${key}`);
  if (!res) return null;
  return res.arrayBuffer();
}

/** Load a file from cache and re-verify integrity. Returns null when absent. */
export async function getVerifiedModelFile(key, expectedSha256) {
  const buf = await getCachedModelFile(key);
  if (!buf) return null;
  const hex = await sha256Hex(buf);
  if (hex !== expectedSha256) {
    const store = await env.cachesFn().open(CACHE_NAME);
    await store.delete(`/__local_voice__/${key}`);
    throw new LocalVoiceError('HASH_MISMATCH', `Cached model file '${key}' failed integrity check and was deleted. Re-install required.`);
  }
  return buf;
}

export async function getModelStatus(language) {
  const m = TTS_MODELS[language];
  if (!m) return { language, state: 'unsupported' };
  const c = env.cachesFn();
  if (!c) return { language, state: 'unavailable_no_cache_api' };
  for (const f of m.files) {
    const buf = await getCachedModelFile(`${language}/${f.key}`);
    if (!buf) return { language, state: 'not_installed', totalBytes: ttsTotalBytes(language) };
  }
  return { language, state: 'installed', totalBytes: ttsTotalBytes(language) };
}

/**
 * Download + verify + cache all files for a language.
 * onProgress({fileIndex, fileCount, received, total}) is throttled by the caller.
 */
export async function installLocalVoiceModel(language, { signal, onProgress } = {}) {
  const m = TTS_MODELS[language];
  if (!m) throw new LocalVoiceError('UNSUPPORTED_LANGUAGE', `No local voice model registered for '${language}'.`);
  assertUsableConsent(language);
  const fetchF = env.fetchFn;
  const store = await env.cachesFn().open(CACHE_NAME);

  for (let i = 0; i < m.files.length; i++) {
    const f = m.files[i];
    if (signal?.aborted) throw new LocalVoiceError('ABORTED', 'Download cancelled.');
    const res = await fetchF(f.url, { signal });
    if (!res.ok) throw new LocalVoiceError('DOWNLOAD_FAILED', `Model file '${f.key}' download failed (HTTP ${res.status}).`);
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
      await store.delete(`/__local_voice__/${language}/${f.key}`);
      throw new LocalVoiceError('HASH_MISMATCH', `Downloaded '${f.key}' failed integrity check; nothing was kept.`);
    }
    await putInCache(`${language}/${f.key}`, buf);
  }
  return { language, state: 'installed', totalBytes: ttsTotalBytes(language) };
}

export async function uninstallLocalVoiceModel(language) {
  const c = env.cachesFn();
  if (!c) return { language, state: 'not_installed' };
  const store = await c.open(CACHE_NAME);
  const keys = await store.keys();
  let removed = 0;
  for (const req of keys) {
    if (req.url.includes(`/__local_voice__/${language}/`)) {
      await store.delete(req);
      removed++;
    }
  }
  return { language, state: 'not_installed', removedFiles: removed };
}
