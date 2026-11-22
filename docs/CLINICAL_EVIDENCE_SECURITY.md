# Clinical Evidence Engine — Security & Privacy

Prototype posture. **No DPDP, ABDM or HIPAA compliance is claimed.** The demo
contains no real-world PHI by design; every sample is synthetic and tagged.

## Consent gates (fail-closed)

- **Offline data consent**: persisting clinical data on-device requires
  explicit, revocable consent (`assertOfflineDataConsent`;
  `OfflineDataConsentRequiredError` otherwise).
- **Recording consent**: versioned consent text (`CONSENT_TEXT_VERSION`),
  revocable; withdrawing discards any unshared recording.
- **Transcribe upload consent**: asked separately at the moment audio would
  leave the device.

## Encryption at rest

Queue payloads are AES-256-GCM envelopes (`secureOfflineStorage.js`).
Keystore-wrapped records that cannot be decrypted on the device (locked key
or GCM tag failure) are treated as unrecoverable: they are never uploaded,
never silently downgraded to plaintext, and surface to the user as
'undecryptable' with a confirmed-discard recovery path.

## Privacy-safe diagnostics

Sync failure metadata is restricted to bounded categories
(`http-4xx`/`http-5xx`/`http-other`/`network`/`timeout`/`no-sync-route`/
`unknown`). Raw upstream error text — which can embed payload fragments or
identifiers — is never persisted; legacy raw strings are scrubbed from both
the localStorage fallback and the IndexedDB primary store on the next sync
cycle (browser-verified). Queue-health output carries no payload fields.

## Injection and untrusted input

Transcript text is treated as untrusted content: prompt-injection-in-
transcript is a tested synthetic fixture (Phase 40), SOAP sections are
assembled deterministically rather than from model prose, and appended
directives / batch-order tricks / semantic collisions are adversarially
covered (Phase 42).

## Data loss and deletion semantics

- No automatic destruction: failed or undecryptable records are retained
  until the user confirms discard in the UI (inline two-step confirmation
  stating the data loss).
- Queue deletion happens only on acknowledged sync success or confirmed
  discard. Delivery is at-least-once: a lost acknowledgement after a server
  write can duplicate on retry; server-side dedup is not verified and not
  claimed.
- Record types without a verified backend route are never counted as synced
  and never deleted; they remain queued and surface via attention.

## Network boundaries

Provider calls go through a server-side proxy designed to keep tokens in
server environment variables; the local audit did not verify a production
deployment. Certificate-pinning configuration exists as config (Phase 28)
without a live-deployment claim.

## Known limits

Synthetic-data prototype: no production authentication, audit logging, or
incident response; the release gates in `docs/RELEASE-READINESS.md` remain
open before any real-data use.
