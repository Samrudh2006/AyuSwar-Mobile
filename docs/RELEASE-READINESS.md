# AyuSwar Mobile - release readiness

**Status:** synthetic prototype / debug APK, not production-ready
**Last verified:** 20 Nov 2026

## Verified in this workspace

- Repository: `main`, clean at start, based on `d295d34`; no commit or push made.
- Browser assistant at 390px: Sample Q&A, OPD Scribe, internal WhatsApp Rx modal, Sanjivani 108 simulation and typed query.
- External `tel:`, `sms:`, `mailto:`, WhatsApp and `window.open` actions were stubbed during click-through.
- Browser local notification path: permission request, granted state, browser notification construction and honest UI feedback.
- Automated suite: **243 passed, 4 conditional skips, 0 failed**.
- Production web build: passed.
- Lint: passed.
- Android debug APK build: passed.
- Current debug APK: 77,135,436 bytes.
- Current debug APK SHA-256: `7170DFF0EACF7D646F6249F6226CDF1D0E8AACA4D3F1A1A58FF707A469164B4B`.

## Not verified here

A physical Android device or usable emulator is required for:

- install, launch, splash and startup timing
- microphone, native STT, camera and permissions
- Gnani TTS playback from the APK
- Android notification channel, drawer delivery, sound, vibration, DND and tap actions
- hardware back behavior
- file downloads and share sheets
- airplane-mode behavior, reconnect, pending-sync deduplication and failure recovery
- low/mid-range device memory and latency
- Android WebView execution of offline voice packs
- six-locale font rendering on-device

The latest recorded Gnani provider check returned 502/404 responses. Evon remains explicitly unconfigured. No live provider health or physical-device success is claimed.

## Remaining release gates

1. Perform the physical-device matrix above on at least one low/mid-range Android device.
2. Re-run TTS/STT, notification and Audio-Rx checks on that device.
3. Complete route/modal/localization/accessibility/overflow checks for all mobile surfaces.
4. Run final APK/dist secret, permissions, CSP, cache and third-party network audits.
5. Verify generated PDF bytes and scanner/export paths.
6. Complete clinician-led safety review and formal medical/legal/privacy review.
7. Add production authentication, persistence, audit logging, monitoring and incident response before any real-data use.
8. Produce a signed release APK/AAB only after Play Store and dependency/license review.

## Release wording

This build may be described as a **synthetic-data research prototype with browser-verified flows and an unverified Android debug APK**. It must not be described as a medical device, live emergency dispatcher, ABDM-connected system, clinically validated AI, or production healthcare service.
