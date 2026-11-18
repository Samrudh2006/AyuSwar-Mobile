# AyuSwar Mobile — Master Coverage Checklist (working copy)
Source of truth: src/App.jsx routes, src/views, src/components. Status legend:
DONE = mobile screen authored + rendered + visually inspected | WIP = reused desktop view, needs mobile layout | TODO | TESTED = interaction verified (tap-through), not just rendered

## Navigation & shell
- [DONE] Splash: hand-drawn Deepam Heartbeat stroke reveal (MSplash.jsx) + native Android splash assets — render captured, animation visually verified? PENDING verify
- [DONE] Top bar: brand only (duplicate hamburger + siren removed)
- [DONE] Bottom tab bar: Home, Services, center 108, Scribe, Menu; opaque, active pill
- [DONE] Drawer menu from Menu tab — drawer open state NOT yet screenshot-verified
- [DONE] Back button on sub-screens (MShell showBack)
- [TODO] Android hardware back button behaviour in WebView (Capacitor) — TEST on device/emulator
- [DONE] Floating assistant restored, positioned above tab bar — tap-through PENDING

## Core services
- Home (MHome) [DONE, user-reviewed twice]
- Solutions index (MSolutions) [DONE + render-verified]
- OPD Voice Scribe /clinical-console (ClinicalConsole) [WIP: desktop view in shell; mobile layout TODO; screenshot timed out earlier — investigate]
- Audio-Rx Studio /audio-rx (AudioRxStudioView) [WIP: desktop view in shell]
- Sanjivani 108 /sanjivani (MSanjivani mobile: voice triage entry, CPR pacer 110bpm, handover, dispatch console link) [DONE + render-verified]; old console kept at /sanjivani-console
- Emergency triage /emergency (EmergencyTriageView) [renders acceptably on phone; density polish TODO]
- Hospital handover /emergency/handover [WIP]
- Prescription Scanner /scanner (PrescriptionScannerView) [WIP]
- Acoustic Signal Lab /acoustic-lab [WIP]

## Portals & auth
- Sign in (MAuth mobile) [DONE + render-verified]
- Doctor Portal /doctor-portal [shell-fit surgery DONE: search/lang selector hidden on phone, heights fixed; deeper mobile dashboard TODO]
- Patient Portal /patient-portal [shell-fit DONE; ABHA chip wrap + Telugu tofu glyph TODO]
- Prescription preview /prescription/preview + /rx/:ref [WIP]

## Informational pages
- Technology /technology (ArchitectureView) [WIP]
- Benchmarks /benchmarks [WIP]
- Language matrix /language-matrix [WIP]
- Datasets /datasets [WIP]
- About /about, /team [WIP]
- Privacy /privacy, Terms /terms [WIP]
- NotFound [WIP]

## Feature components to preserve (from src/components)
- FloatingAssistant (voice assistant pill + panel) [restored; TEST pending]
- FeedbackPopup [TODO: verify mobile placement + flow]
- CookieConsentBanner [TODO: mobile position check; overlapped in baseline]
- MobilePwaInstallBanner [hide inside native APK]
- WhatsAppAudioRxModal, TeleconsultModal, VitalsRppgModal, PillVisionScannerModal, LiveScribeSessionModal, OpdAppointmentTicketModal, ConsultationVisitSummaryModal, SanjivaniTransferModal, EmergencyMap, SanjivaniAnimatedFlowchart, HandDrawnExplainer, PipelineTerminal, KurnoolClimateSentinel, LiveOpdDemoSimulator, PatientAnalyticsCard, AbhaDigitalCard, AuthenticQrCode, AbdmRegistryBadgeRow, ClinicalNotificationsDrawer, EvonStatusChip, LiveTelemetryBadge [TODO: each needs mobile-fit check when its parent screen is built]

## Data & API (live backend: ayuswar-ai.vercel.app)
- Gnani TTS: LIVE (verified 20:52) — in-app playback NOT yet tested
- Gnani STT: configured but UNAVAILABLE; browser SpeechRecognition fallback does NOT exist in Android WebView — mic input at risk in APK; needs native capture or Gnani STT fix. CRITICAL for voice demo.
- Evon: UNCONFIGURED (verified 20:52)
- API calls relative /api/* — CapacitorHttp enabled; absolute-base shim for native TODO + TEST
- Rate limit / retry / timeout / offline / empty states [TODO: audit services/*.js, add bounded backoff honoring Retry-After, no blind retry of side-effect calls]
- No secrets in APK [TODO: grep dist + android assets for keys]

## Quality & audit (for PDF report)
- [ ] Repo test suite (npm test, 79 tests claimed) — run and record
- [ ] Per-route render checks: console errors, horizontal overflow, tap targets >= 44px, contrast spot checks
- [ ] Load timing measurements (web + APK WebView)
- [ ] Startup behaviour incl. splash duration
- [ ] Security checks (secrets, permissions in AndroidManifest, mixed content)
- [ ] Accessibility spot checks
- [ ] Honest tested/failed/untested split; 85+/100 only on genuine 100-point metrics

## Design requirements (user, tonight)
- Cream/green/saffron palette per reference image; Fraunces + Albert Sans; custom stroke icons; AyuSwar logo identity
- No purple/neon gradients, no sparkle/magic icons, no glow buttons
- Realistic natural human/doctor imagery (his assets); no random images
- Fresh mobile-first flows, NOT shrunk desktop screens; no excessive whitespace; no haphazard alignment
- Hand-drawn logo reveal splash
- Master checklist governs design + audit (this file)
