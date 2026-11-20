# AyuSwar Mobile — Master Coverage Checklist (working copy)
Source of truth: src/App.jsx routes, src/views, src/components. Status legend:
DONE = mobile screen authored + rendered + visually inspected | WIP = reused desktop view, needs mobile layout | TODO | TESTED = interaction verified (tap-through), not just rendered

## Navigation & shell
- [DONE] Splash: hand-drawn Deepam Heartbeat stroke reveal (MSplash.jsx) + native Android splash assets — render captured, animation visually verified? PENDING verify
- [DONE] Top bar: brand only (duplicate hamburger + siren removed)
- [DONE] Bottom tab bar: Home, Services, center 108, Scribe, Menu; opaque, active pill
- [TESTED] Drawer menu from Menu tab — browser interaction verified; native drawer/back behavior still device-pending
- [DONE] Back button on sub-screens (MShell showBack)
- [TODO] Android hardware back button behaviour in WebView (Capacitor) — TEST on device/emulator
- [TESTED] Floating assistant restored, positioned above tab bar — 390px Sample Q&A, OPD, WhatsApp Rx, 108 and typed-query flows verified with external actions stubbed

## Core services
- Home (MHome) [DONE, user-reviewed twice]
- Solutions index (MSolutions) [DONE + render-verified]
- OPD Voice Scribe /clinical-console [TESTED: mobile entry and assistant navigation verified; full native microphone/audio journey remains device-pending]
- Audio-Rx Studio /audio-rx (AudioRxStudioView) [WIP: desktop view in shell]
- Sanjivani 108 /sanjivani (MSanjivani mobile: voice triage entry, CPR pacer 110bpm, handover, dispatch console link) [DONE + render-verified]; old console kept at /sanjivani-console
- Emergency triage /emergency (EmergencyTriageView) [renders acceptably on phone; density polish TODO]
- Hospital handover /emergency/handover [WIP]
- Prescription Scanner /scanner (PrescriptionScannerView) [WIP]
- Acoustic Signal Lab /acoustic-lab [WIP]

## Portals & auth
- Sign in (MAuth mobile) [DONE + render-verified]
- Doctor Portal /doctor-portal [PARTIAL: browser shell, dashboard, queue, reports and notification drawer checks exist; complete native/modal coverage pending]
- Patient Portal /patient-portal [PARTIAL: browser shell and portal flows checked; complete native/modal/localization coverage pending]
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
- FloatingAssistant (voice assistant pill + panel) [TESTED: 390px click-through and Sample Q&A verified]
- FeedbackPopup [PENDING: complete mobile placement and flow audit]
- CookieConsentBanner [PENDING: complete mobile placement audit]
- MobilePwaInstallBanner [hide inside native APK]
- WhatsAppAudioRxModal, TeleconsultModal, VitalsRppgModal, PillVisionScannerModal, LiveScribeSessionModal, OpdAppointmentTicketModal, ConsultationVisitSummaryModal, SanjivaniTransferModal, EmergencyMap, SanjivaniAnimatedFlowchart, HandDrawnExplainer, PipelineTerminal, KurnoolClimateSentinel, LiveOpdDemoSimulator, PatientAnalyticsCard, AbhaDigitalCard, AuthenticQrCode, AbdmRegistryBadgeRow, ClinicalNotificationsDrawer, EvonStatusChip, LiveTelemetryBadge [TODO: each needs mobile-fit check when its parent screen is built]

## Data & API (live backend: ayuswar-ai.vercel.app)
- Gnani TTS: NOT release-verified — latest recorded provider check returned 502/404; in-app playback not tested
- Gnani STT: source/native integration present but Android WebView microphone result is not device-verified; native capture and provider availability remain release blockers
- Evon: UNCONFIGURED (verified 20:52)
- API calls relative /api/* — CapacitorHttp enabled; native routing requires physical-device verification
- Rate limit / retry / timeout / offline / empty states [PARTIAL: source boundaries and honest fallbacks covered; live rate-limit and Retry-After verification pending]
- No secrets in APK [PARTIAL: static source/build checks exist; final release scan pending]

## Quality & audit (for PDF report)
- [x] Repo test suite — 243 passed, 4 conditional skips, 0 failed on 20 Nov 2026
- [PARTIAL] Per-route render checks: browser assistant/notification routes verified; complete route/modal, tap-target, contrast and accessibility matrix pending
- [PARTIAL] Load timing measurements — browser lab data exists; APK WebView timing pending
- [PENDING] Startup behavior and splash duration on a device
- [PARTIAL] Security checks — manifest/CSP/source checks exist; final APK release scan pending
- [PARTIAL] Accessibility spot checks — route-level coverage incomplete
- [x] Honest tested/failed/untested split maintained; no production score claimed

## Design requirements (user, tonight)
- Cream/green/saffron palette per reference image; Fraunces + Albert Sans; custom stroke icons; AyuSwar logo identity
- No purple/neon gradients, no sparkle/magic icons, no glow buttons
- Realistic natural human/doctor imagery (his assets); no random images
- Fresh mobile-first flows, NOT shrunk desktop screens; no excessive whitespace; no haphazard alignment
- Hand-drawn logo reveal splash
- Master checklist governs design + audit (this file)
