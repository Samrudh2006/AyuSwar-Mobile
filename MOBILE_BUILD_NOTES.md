# AyuSwar Mobile Build — working notes (updated each cycle)

Privacy-corrected historical notes: product findings, build measurements and evaluation results are retained; private conversation locators, delivery records and operational instructions are omitted. Earlier Git history and previously downloaded copies are not erased.

## Environment
- Source: workspace box /tmp/ayuswar (from Samrudh2006/Ayuswar-Ai, 308 files, binaries re-fetched from live site)
- Build: `cd /tmp/ayuswar && npm run build` (vite + prerender). APK: `cd /tmp/ayuswar/android && JAVA_HOME=/downloads/builddeps/jdk-21.0.13+9 ANDROID_HOME=/downloads/builddeps/android-sdk ./gradlew assembleDebug` → app/build/outputs/apk/debug/app-debug.apk
- Preview: `cd /tmp/ayuswar && node shot.cjs '/route1,/route2' prefix_` → /tmp/shots/*.png (playwright, 390x844). Copy to /downloads to share.
- Code view images: `node codeview.cjs <file> <out.png> [startLine]`
- capacitor.config.json: appId ai.ayuswar.app, CapacitorHttp enabled (bypasses WebView CORS for live API calls).

## Design brief (user, Nov 17 night)
Fresh mobile screens for EVERY page; fix haphazard arrangement; cream/deep-green/saffron palette per his reference image; custom handmade icons; keep AyuSwar logo; no purple/neon/sparkle/glow; concise landing; realistic human imagery (his repo assets); Sanjivani 108 included; rate-limit/error handling + security + speed; audit PDF 85+/100 target with real measured checks; deadline Nov 18 07:00 IST; he records a promo video in the morning.

## Done
- mobile design system: src/mobile/mobile.css (tokens, topbar, tabbar, drawer, buttons, cards, home styles)
- custom icons: src/mobile/MIcons.jsx (~35 stroke icons)
- shell: src/mobile/MShell.jsx (top bar + bottom tabs w/ center 108 + drawer menu)
- home: src/mobile/MHome.jsx — VERIFIED via m3_home.png render
- mobile root routing: src/mobile/MobileRoot.jsx; App.jsx patched (isPhoneExperience: Capacitor or <=768px). Desktop untouched.
- fonts: public/fonts (Fraunces 500-700, Albert Sans 400-800 + fonts.css), imported at top of mobile.css
- first debug APK built OK with old UI (pipeline proof)

## In progress / next
1. Fraunces not rendering in hero h1 (falls back to sans). Debug: check dist/fonts/fonts.css served; maybe @import order/CORS in preview. Verify in next shot.
2. Sanjivani 108 mobile screen (MSanjivani) — currently reuses SanjivaniEmergencyModal; check render, then build dedicated mobile emergency screen: big voice action, triage status, CPR metronome, hospital handover. Keep [SIMULATION] honesty.
3. Auth screens mobile (check UnifiedAuthView render, likely needs mobile-specific MAuth).
4. Clinical console / OPD scribe mobile layout.
5. Doctor/Patient portals mobile dashboards.
6. Audio-Rx, Scanner, Acoustic Lab mobile layouts.
7. Solutions index (currently reuses HeroLanding inside shell — REPLACE with real MSolutions list).
8. Secondary pages (about, technology, benchmarks, language-matrix, datasets, privacy, terms): apply mobile readability pass.
9. Global mobile overrides for reused views (padding, font sizes, overflow) in mobile.css.
10. API base for APK: services use relative /api/* — with CapacitorHttp enabled, patch fetch to absolute https://ayuswar-ai.vercel.app in native. ADD a small apiBase shim in main.jsx (native only).
11. Android app icon + splash from ayuswar_emblem_mark.png; app name "AyuSwar AI".
12. Hide cookie banner/PWA install banner inside native app; FloatingAssistant overlaps — in phone mode either integrate as m-voice-fab or reposition.
13. Security/speed pass: no secrets in APK (grep dist for keys), image sizes, duplicate API calls, error/retry handling review of services.
14. Audit suite + PDF/DOCX report (real results only): repo npm test (79 tests), render checks per route (console errors, overflow, tap targets), load timing, API status checks. Report style per his preferences (white bg, classic font, A4, clickable links, first-page preview).

## Milestones reported
- Baseline screenshot (old UI) sent 21:09
- Code screenshots (mobile.css, MIcons.jsx) sent 21:11
- First redesigned Home render (m3_home.png) sent 21:13


## Update 21:23 IST (run 2)
- Deadline moved to Nov 18 08:00-09:00 IST (user). Hourly work-image cadence requested by user; include IST timestamp strip on every image (ImageMagick: convert X.png -gravity south -background '#0C3B27' -splice 0x44 ...).
- Hero v3 (m8): full-bleed mobile_hero_doctor_bg.jpg, gradient overlay, object-position 86% 18%, h1 max-width 54%, opaque tab bar, active pill. Verified via render. Capture recorded.
- Font fix: old index.css forces h1-h6 font-family var(--font-display) !important (Albert Sans). Scoped override added in mobile.css (.m-app h1..h4 !important Fraunces). fonts loaded via <link> in index.html (NOT @import - vite doesn't guarantee top position).
- Nav: removed top-bar hamburger + siren. Bottom tabs only (Home, Services, 108 center, Scribe, Menu). Drawer opens from Menu tab only.
- Splash: MSplash.jsx inline SVG stroke-draw reveal of Deepam Heartbeat (rings/bowl/lotus/flame/ECG/dot, ~1.9s, cream, no glow - matches his short-film logo rule). Freeze for capture with /?splash=1. Native Android splash.png files replaced (cream+emblem) in all drawable* dirs. NOT YET visually verified.
- Floating assistant: now rendered inside MobileRoot (hidden on sanjivani/auth/login), repositioned above tab bar via .m-assistant CSS. TAP-THROUGH NOT YET TESTED.
- BUG FIXED: nested double MShell on embedded routes (removed outer shell in MobileRoot; home gets own <MShell>).
- shot.cjs: clinical-console route timed out earlier; sanjivani failed (check). Survey shots /tmp/shots/surv__solutions.png + surv__auth_doctor.png exist - REVIEW next run.
- Product design requirements: fresh mobile-first flows with explicit feature-parity, interaction and verification-status tracking.
- APK: rebuild pending (splash assets + all UI changes since first APK).
- Kaggle: only if materially useful; no account creation/spend without authority.

## Update 21:28 IST (run 3)
- MSolutions.jsx DONE + render-verified (replaces HeroLanding embed on /solutions; single shell confirmed).
- MAuth.jsx DONE + render-verified (doctor/patient, prefilled demo creds, role seg control; duplicate heading removed).
- Compact spacing pass done (page 14px, gaps 14, card-pad 13, hero 204).
- APK rebuilt 21:26 with all changes (25.9MB debug).
- Master checklist working copy: MOBILE_MASTER_CHECKLIST.md (source-backed, from App.jsx routes + views + components). User-readable File version TODO (files skill page).
- dbg.cjs renders any route w/ console errors: clinical-console + sanjivani DO render (earlier failures were networkidle timeouts). Both are desktop layouts with overflow — need dedicated mobile screens. maplibre worker fails in preview (note: retest in WebView).
- Product design requirements: phone-first screens, including feedback flows, rather than scaled-down desktop layouts; document data provenance and report limitations.
- NEXT: MSanjivani mobile screen (cream+red, big voice action, CPR pacing, handover entry, SIMULATION labels; keep /sanjivani-console modal as secondary), then clinical console mobile, then portals.

## Update 21:31 IST (run 4)
- MSanjivani.jsx DONE + render-verified (red-on-cream, SIMULATION chip, tel:112/108 links, voice triage → /emergency, CPR pacer 110bpm w/ haptics, handover + dispatch console rows). Old modal kept at /sanjivani-console.
- /emergency (EmergencyTriageView) renders acceptably on phone already.
- Portal shell-fit CSS surgery: hide doctor-search-box + language select via :has() on phone; portal container heights auto. Doctor + patient portals render verified. Patient portal ABHA chip wrap + Telugu tofu glyph TODO.
- APK REBUILD PROCEDURE (do not skip): npm run build && npx cap sync android && cd android && gradlew assembleDebug. Gradle alone ships STALE web assets (caught: size identical 25926721 → after sync 26405334).
- AUDIT RUBRIC (user-supplied screenshot, [private attachment reference omitted]): 100pt reviewer rubric to adopt: Public workflows & usefulness /25; Usability, access & localization /20; Loading & public web delivery /15; Visible privacy & security hygiene /15; Claim accuracy & evaluation evidence /15; Failure handling & state clarity /10. Reference total shown 73/100 from another project - NOT AyuSwar results. User pasted Lighthouse-format metrics (median of 3, mobile/desktop, axe scans, viewport coverage, smoke≠accuracy) as reporting format reference. Report must keep automated scores, reviewer rubric and Android APK checks separate, with exceptions listed.
- cap sync output assets: android/app/src/main/assets/public/.
- NEXT: clinical console mobile layout (biggest chunk), audio-rx/scanner/acoustic shell-fit checks, drawer open state shot, splash visual verify (shot.cjs /?splash=1 - filename has ? char, check /tmp/shots for actual name), assistant tap-through test, then audit runs (npm test, lighthouse, axe) + APK on-device checks.

## Update 21:46 IST (run 4)
- NATIVE STT: @capacitor-community/speech-recognition 7.0.1 installed; startNativeRecognition in indicSpeechService.js (partialResults->interim, listeningState stopped->final+normalize; revive in conversational session matches browser path). RECORD_AUDIO + MODIFY_AUDIO_SETTINGS in manifest. APK 21:40 verified: permissions + startNativeRecognition present in bundle. DEVICE TEST STILL PENDING - do not claim mic works.
- CLAIM FIXES: DoctorPortal ~9-min claim removed, "Voice Scribe Active" -> demo session; KurnoolClimateSentinel header -> SYNTHETIC DEMO; kaggleClinicalDataset metadata corrected to actual 22 conditions/39 meds/70 vernacular (was 54/108/480).
- DATA: PillVisionScannerModal unified onto shared PMBJP_FORMULARY_DATABASE (6 rich + 33 mapped entries, verified:false badge "Formulary match (unverified detail)", imageUrl null -> pill emoji fallback OK).
- MClinical.jsx NEW mobile OPD scribe (encounter chips, record live via speechService, scripted demo playback, transcript, encounter brief, link to /clinical-console/full). Route rewired; full desktop console at /clinical-console/full. Render-verified x2.
- Sanjivani polish: How-it-works steps card fills void; .m-solrow radius bug fixed (undefined --m-radius var -> --m-radius-m); colored glow shadow softened (unslop).
- RESOURCES VERIFIED + APPLIED: Modern Web Guidance (official Chrome/Edge/Firefox/MDN, developer.chrome.com/docs/modern-web-guidance) legacy-scan run: scrollbar standard props added to FeedbackPopup.css; toSorted finding REVERTED for old-WebView safety . Unslop signs.md (CC BY 4.0, github.com/heydamir/unslop) applied as audit lens: mobile module clean (no emoji icons, no gradients, no pulse); 1 glow fixed. Attribution owed if text reused in report.
- PENDING at this checkpoint: the floating-assistant reel concept was not yet verified. Audio-Rx, scanner, acoustic lab and info pages still used an embedded shell; OCR synthetic evaluation had not started, and the ClinicalConsole claim sweep and audit remained pending.

## OpenUI-style structured answers plan (historical)
Concept: floating assistant answers render as interactive typed components (cards/tabs/steps/diagram), not text walls. Source: OpenUI.com (Thesys) - DO NOT integrate hosted lib (provider/account/privacy surface); implement in-house renderer.
Pipeline: FloatingAssistant.handleProcessQuestion -> tier1 matrix / askAyuSwarBrain (skipGroq) -> setCurrentAiReply(text).
Implementation:
1. src/components/assistant/StructuredAnswer.jsx - allowlisted block renderer: text, steps, tabs, card, action(in-app route only, allowlist internal paths). Design tokens + MIcons. No model markup, no external URLs.
2. src/services/structuredAnswerService.js - DETERMINISTIC intent->blocks mapper grounded in repo data: medicine->PMBJP formulary card (nonclinical note), emergency/CPR->steps+tel:112/108 action, vernacular symptom->dictionary card + consult-doctor note, portal/appointment->card+route action. Provider text stays fallback. Validate: block.type in allowlist, string caps, route allowlist.
3. FloatingAssistant: if mapper fires render StructuredAnswer + short spoken text summary; else current text path unchanged. Preserve voice.
4. Test: render-verify each block type, no console errors; medical uncertainty/provenance labels stay.

## Update 21:52 IST: OFFICIAL OpenUI integrated (actual package, not lookalike)
- npm i @openuidev/react-lang@1.1.1 + zod (React 19.2.8 satisfies peer dep).
- src/services/ayuswarUiLibrary.jsx: official defineComponent + createLibrary. Allowlisted: Answer (root: text + blocks via renderNode), InfoCard, StepsList, NoteText, OpenScreen (in-app route z.enum allowlist; useTriggerAction -> controlled onAction). No toolProvider/gateway/observability. ayuswarUiSystemPrompt generated via library.prompt() for future model-generated path.
- FloatingAssistant: official <Renderer response={lang} library onAction onError>; onAction navigates only allowlisted in-app routes; onError -> falls back to my StructuredAnswer renderer; no error = plain text preserved. Deterministic mapper (structuredAnswerService.js) is the generation source for now; model-generated Lang via ayuswarUiSystemPrompt + Groq is the NEXT step (needs provider prompt plumbing, not done).
- blocksToOpenUILang converts mapper blocks to Lang. VERIFIED: probe renderToString via official Renderer for 4 intents (medicine/emergency/vernacular/portal) all rendered without errors. API learned by probe: positional array arg maps to props.blocks; children render via renderNode(b).
- Medicine cards now say "ref. price"/"ref. MRP" + note "bundled formulary, not a live price check, not medical advice".
- test/structured_answers.test.js (5 contract groups, PASS, standalone; not yet in run_all.js). NOTE: vernacular matching is Telugu-script keys only; romanized ("aayasam") NOT matched - known limitation.
- APK 21:52 rebuilt with all of it. Device mic + interactive assistant screenshot STILL pending.
- NEXT: model-generated OpenUI path (Groq prompt), audio-rx/scanner/acoustic mobile treatment, OCR synthetic eval, audit.

## 21:54-21:58 IST
- Model-generated OpenUI path wired in FloatingAssistant brain path: explainer queries (EN regex + Telugu/Indic script regex) with no deterministic mapper match and Groq key present -> queryGroqApi with ayuswarUiSystemPrompt + grounding from brain answer -> createParser(ayuswarUiLibrary.toJSONSchema(), 'Answer') -> strict success sets currentAnswerLang + uses root.props.text as reply/speech; ANY failure keeps plain text + deterministic fallbacks.
- Duplicate text suppressed: plain reply div hidden when official Renderer active and not failed.
- BUG FOUND + FIXED via in-app playwright interaction test: handleProcessQuestion crashed with ReferenceError selectedLanguage is not defined (pre-existing; line ~209 tier1 matrix lookup). Fixed to speechLanguage. This crash made assistant answers never render in app.
- Interaction test (interact.cjs): assistant opens via .floating-assistant-pill, Type Message toggles input, query 'paracetamol price in Jan Aushadhi' processed, no page errors. TTS 404 on /api/gnani/tts in vite preview (expected, serverless fn absent in preview) -> 'synthesis-failed' voice warning, graceful. Input hides after submit (showTextInput toggles off on send?) - second-query script step skipped; verify manually next run.
- APK rebuilt 21:54 IST with model path BEFORE selectedLanguage fix -> APK 21:54 CONTAINS THE CRASH. MUST REBUILD APK with fix before delivery.
- Product requirements: local flows should remain usable offline with clear network-required states and no blank/endless loading; actions should reflect across connected dashboards without fake live labels, and queued work should expose reconnect/dedup status. Phone-first screens should not be counted complete while desktop embeds remain. These are requirements, not demonstrated results.

## 22:01 IST - interaction proof captured
- FIXED real UX bug: structured/plain answers only rendered while assistantState==='speaking'; TTS end/error instantly reverted panel to welcome, hiding the answer. Now reply block renders whenever a reply exists (listening view still takes precedence).
- Honest voice status: voiceOk state (null/true/false) driven by speech onStart/onError. Label now 'Voice unavailable - text answers on' / '(working)' / '(untested)' instead of hard '(Active)'. Removed Sparkles icons (user ban) -> Volume2/Languages. 'AyuSwar AI Speaking (Gnani Timbre Neural Voice)' -> 'AyuSwar AI Speaking'.
- PROOF CAPTURED 22:01: /downloads/assistant_answer_fixed_2201.png - typed query 'paracetamol price in Jan Aushadhi' -> tier1 matrix answer text + official OpenUI Renderer InfoCards (Paracetamol 650mg: branded Dolo 650/Calpol 650, Jan Aushadhi ref. price, branded ref. MRP, savings %) persist on screen after TTS failure. Preview TTS 404 expected (no serverless in vite preview); APK TTS routing STILL UNTESTED on device.
- APK rebuilt 22:01 IST with all fixes (crash fix + persistence + honest voice + no sparkles). Prior APKs (21:54 and earlier) contained the query crash - do not deliver.

## 22:05-22:08 IST
- Claim sweep complete : tier1 matrix + rag_jan_01 EN/TE/HI rewritten (no WHO-GMP/NABL blanket claims, no bioavailability equivalence, no 70-88%/Save-86% figures, no '1 second' scanner); cards: Savings row removed, 'Same-salt brand examples', unit shown on both price rows, bundled-formulary note moved ABOVE cards. Verified via interact.cjs DOM text + screenshot /downloads/assistant_claims_fixed_2205.png. Build+tests pass.
- INCIDENT: first KB edit corrupted clinicalRagKnowledgeBase.js (bad python slice math inserted text at top + clobbered rag_hosp_01 answerTe/answerHi). Restored originals verbatim from pre-edit bundle android/.../index-BaJ7AoQX.js, re-applied edits per-line. Lesson: never slice by index() of non-unique markers; operate per-line or on unique IDs.
- Voice labels fully honest: mute toggle shows 'Text only', bottom button 'AI Voice: unavailable' when synthesis fails.
- SIGNUP: does not exist anywhere (0 routes, no control in MAuth). Demo accounts only. no cosmetic signup unless user asks.
- Auth design direction settled: single-column mobile, NO desktop side panel on phone; user wants REAL licensed photography (no AI people), no implication people shown are actual AyuSwar clinicians. TODO: audit all photo assets for licensing/provenance (MHome hero woman-doctor photo provenance unknown); fix auth screen bottom whitespace + add purposeful imagery.
- Competitor promo principles noted (consistent hierarchy, state colors, compact controls); LinkedIn remains off-limits.

## Update 22:22 IST: MScribeFlow and backend configuration
- MScribeFlow (OPD steps 2-4: /clinical-console/review) verified end-to-end in preview; 2 bugs fixed: (1) empty-SOAP silent failure -> key validation + labeled demo fallback; (2) Telugu tofu in bold patient names = preview webfont race only (Android system has Noto Telugu; APK unaffected). shot.cjs/flowshot.cjs/interact.cjs now await document.fonts.ready before captures.
- APK rebuilt 22:21 (27,090,481 bytes). NOT device-tested.
- Live backend 22:20: Groq CONFIGURED; Gnani TTS+STT now BOTH LIVE (flipped since 22:10); Evon UNCONFIGURED (EVON_API_KEY/EVON_BASE_URL = Vercel env, user must set in his dashboard - I have no deploy access).
- At this checkpoint, APK configuration contained no VITE_ values. Auth used demo mode, and Sanjivani used OSM/regional fallbacks. Live-service setup was not demonstrated in that APK.
- NEXT QUEUE: audio-rx/scanner/acoustic-lab mobile treatment; portal internals; WhatsApp modal sheet; offline audit; secrets grep in APK; perf measurements.

## Update 22:30 IST (run closeout)
- APK 22:26 (27,090,708 bytes): SOAP validation + demo-script note on voice card + font warmup (retry version) + demo-note CSS. NOT device-tested.
- TELUGU TOFU: preview-only race; probe5 proved element renders fine after forced fonts.load; faces list shows 700 loaded. Warmup in MobileRoot has ready.then + 4s retry. STILL tofu in flow screenshots despite script-side fonts.load before capture - UNRESOLVED, low priority . Next idea: check whether flowshot preview server serves stale dist (byte-identical screenshots twice) - add cache-bust or verify hash in served HTML vs dist.
- Historical product follow-ups: the acousticDspEngine.js audit found centroid using sample positions and amplitude rather than FFT bins (100/400 Hz tones yielded about 11994 Hz), jitter calculated after pitch sorting, shimmer from overlapping-frame RMS, formulaic CPP/formant/voice-health labels, and octave errors on 4/6 Coswara vowels compared with Praat. These are recorded findings, not new measurements or a claim that later versions retain them. See later dated evaluations for current status.
- Other recorded product follow-ups: OPD steps 2-4 composition and completeness relative to desktop, an unverified live SOAP route, genuine microphone waveform, interactive map permissions and fallback, truthful action/loading/result states, and comparison of open map-data options. These were follow-up requirements, not demonstrated results. Private operational references and conversation times are omitted.
- Evon was used by the aiBrainService path, FloatingAssistant, ClinicalConsole, Sanjivani and triage. At this recorded checkpoint its server-side configuration was unavailable and the rule-based fallback worked; this is not a current live-deployment check.

## 22:30 - MISSING STEP RESOLVED : doctor review/edit of AI draft
- User: "AI generate chesindi doctor review chestadi and also he can edit if he want". This is the missing OPD step.
- SPEC for MScribeFlow rework: after AI processing (step 2), SOAP fields (subjective/objective/assessment/plan + voice-note text) must be EDITABLE by the doctor BEFORE voice note + sign/share. Edited values authoritative downstream: voice note text, share text, FHIR JSON. If voice note already generated and doctor edits summary -> voice note stale: require regeneration (disable Play or auto-mark regenerate). No silent overwrite of edits on re-render. Preserve all fields.
- Desktop reference: ClinicalConsole step 2 output area - check if desktop has edit (grep edit/textarea around line 2066) to match behavior.
- Flow header should show all 4 stages (Record done -> Processing -> Voice note -> Dispatch) so user sees the complete journey. Karaoke synced playback = desktop step 3 feature, add to voice note.

## 22:32 IST - Acoustic DSP fixes (audit verified + fixed, build passes)
- src/services/acousticDspEngine.js: (1) spectral centroid now REAL (Hann-windowed radix-2 FFT magnitude centroid; was sample-position*amplitude - reproduced recorded defect, tones gave ~11994Hz). Verified: 100Hz tone -> 101Hz, 400Hz -> 400Hz, F0 exact, jitter 0% on pure tones. (2) jitter now uses chronologicalPitchTrack order (was sorted array). (3) F1/F2 formula placeholders REMOVED -> null (honest unavailability). (4) voiceHealthScore relabeled prototype signal-quality heuristic; pathological glottal labels ("Pathological Dysphonia" etc.) replaced with engineering descriptions.
- src/views/AcousticBiomarkerLabView.jsx: removed fabricated fallbacks (|| '18', || 92, || '408', || '1344', || '11.8 dB'), CPP row relabeled heuristic, F1/F2 row shows "Not measured", "Clinical Interpretation" -> "Prototype Analysis Summary", stage labels de-clinicalized, glottal/airflow physiology wording removed.
- STILL TODO next run: ACOUSTIC_CLUSTER_PROFILES disease-named matches (clinicalMlInferenceEngine.js: asthma_wheeze/pneumonia_rales/pediatric_stridor/neurological_tremor) - "Distance Score x/100" vs disease-named profiles = disease-likelihood implication; rename displayed labels to neutral acoustic descriptions, keep disclaimer, remove emoji icons (lines 1824-1828, 2043-2047 stage labels, 2488 area). Then cap sync + gradle rebuild + preview-verify acoustic lab screen.
- Build passes (vite). APK NOT yet rebuilt with these changes.
- Recorded visual design requirements: layered pastel backgrounds (mint/peach/yellow/blue), subtle green-gold curves, pastel action cards and palette-integrated licensed photography. Apply consistently in the OPD and mobile design.
- OPD missing step RESOLVED: doctor review/edit of AI draft (editable SOAP + voice text before sign/share; edits authoritative; stale voice note must regenerate). Desktop ref: editableSoapNote/editableBestMatter in ClinicalConsole.jsx.

## 22:45 IST OPD integrated correctness correction
- Rebuilt MClinical: PCM WAV capture memory only, playback, actual RMS meter, explicit user-initiated cloud transcription, then transcript review. Mic/sample modes separate. Missing-input route guard and disabled draft. Source mic path has no synthetic patient identity/diagnosis substitution. Mock browser microphone fixture (flite synthetic English speech) -> actual browser PCM capture15s -> live Gnani STT200 -> live Groq200 -> editable complete SOAP verified. NOT human/native mic tested.
- Removed all bundled SOAP fallbacks on AI error/missing input. Error+retry retains source, no silent sample. SOAP edits clear voice text requiring rewrite; signing invalidates after edits. Export all5reviewed fields via FHIR-format research collection, NOT ABDM-validated prescription (old helper injected asthma/IDs due mismatched parameter names). Signature is demo only. No real sends.
- Regression: /downloads/opd_2242_regression.txt; script opd-regression.cjs; live STT transcript captured exact synthetic sentence headache/no fever/no meds. Browser fake microphone explicitly not Android proof. Passed503/no-source/no-horizontal-overflow320/430/all5export/sign-invalidation;0pageerrors. Human mic/keyboard/audibleTTS/share/runtime still unverified.
- Capture evidence: record_idle/review_live_ai/recording_synthetic_input filenames2242prefix but actual captures22:44-45. Current APK22:44:02,27087192bytes includes DSP gating+OPD.
- Floating assistant hidden on focusedOPD routes, no phantom tabbar bottom padding; full-height subtle pastel background. Still need voice/dispatch composition tighter and real licensed doctor imagery. Header Process vs Review&edit label unify.
- CRITICAL22:46 duplicate Acoustic results/export template found still containing fabricated formants/clinical norm badges/dysphonia&ICD/impostorregistry signoff. Prior claim sweep incomplete. Replace both rendered/export templates with measured-only research values, gate unsupported heuristics; the recorded comparison confirms4/6vowels octave disagreement persists. DSP two-tone correction != validated accuracy.

##22:48 acoustic patch in progress
- Both secondary on-screen report and actual print popup now share acousticResearchRows (new services/acousticResearchPresentation.js). No clinical norms/ICD/registry signoff/formant defaults. Removed synthetic timed1.8s stage simulation -> real working indicator. Export actual popup regression passes blocked-claims list,0pageerrors. Visual inspection caught remaining Norm baseline label inside trajectorySVG, removing next. No readiness yet.
- Pitchy4.1.0 installed EXACT/MIT license bundled at public/licenses/pitchy-4.1.0.txt, MPM pitch+clarity integrated as independent research outputs. Clarity explicitly periodicity NOT correctness. Same14fixture regression/current result /downloads/acoustic_2250_current_comparison.json.4/6real vowels octave disagreements remain, no accuracy-improvement claim.100/400tones correct. Node elapsed18-165ms per1sec fixture, not phone benchmark.
- CPP/voiceHealth/glottal output derivations disabled null in engine. Existing YINpitch experimental, frameperiod/RMSvariation not jitter/shimmer. SampleRate missing in engine return -> fix. Unsupported default prescription if speech sanitization empty removed from speechService.speak -> onError now.

##23:09 IST checkpoint - latest source and APK
- LatestAPK23:09:05IST41777268bytes. Built+capsync+gradle after AudioRx/scanner safety corrections, stronger backgrounds/borders, generatedIndianimage, partial mobilelanding restoration. Hash print this run, record below. Prior22:56APK static-verified by static inspection but STALE for these changes. Android11 softwarebootfailed;NO app install/launch/nativepass. No repeat without new environment. Runtime/device blocker remains.
- User clarified6UIlocales must change ALL menus/buttons/forms/instructions/errors/dialogs/exports and persist matchingvoice. Existing src/i18n translations249keys each en/te/hi/ta/kn/mr,0missingEnglishkeys. BUT mobile components contain Englishliterals and no global language selector yet. Need wire existinguseApp selectedLanguage/setSelectedLanguage/t, create mobilekeys, actuallytranslate6locales, fallback explicit not silent;screenbyScreenvalidation. Do not claim done from dictionary249counts.
- New user REALANDROIDNOTIFICATIONS requirement: actual OSnotificationsafterinstall, bell+sound,toast/actionfeedback. Not implemented yet. Distinguish localnotifications vs serverpush;no fabricatedcounts,no installaloneproof,respectOSsoundDNDpermissionchannels. Native testblocked. Can implement localtestbutton/actualdraftready event notifications,serverpushneeds backend/config/approval. No paid/newaccount/prod changes.
- Source landing audit confirms major gaps. New MLandingDetails.jsx written/wiredinHome:8featuredialogs(modal0falsybugfixed),4stagepipeline/story,qualitativebeforeaftertoggle,3voicesamples(liveTTScurrentlyfails),4governanceinformationaltabs,6standardsinformationaltabs,11FAQ,resourcesincludingprescriptionpreview. Tests landing-check.cjs:8dialogsopen/content/Escape/focusreturn,storynext,11FAQ,nohorizontaloverflow320x640/430x932,0pageerrors. THIS IS PARTIAL restoration NOT fullparity. Pending:beforeafterslider,6workbenchactualinputs/actions/bodydepth,6dialectkaraoke/perwordtracks,10languageatlasregionfilter/samples,governancesandboxactualbuttons+copyterminal,storyoriginal4scenecontent/actions/authCTA. Independentinventory /downloads/ayuswar-landing-interaction-inventory-a7b7d3b5.md,sourceHeroLanding+FeatureDetailModal+FAQ. SourcefalseclaimsDSC/ABDM/DPDP/zerohallucination mustcorrectnotcopy.
- Home removedunknownlicenseoldhero;nowgeneratedIndianconsultation assetpublic/assets/consultation-indian-generated-20261117.jpg. Generated illustration exception recorded. Gemini-generatedfictionalIndianwomandoctor+elderlywoman,generated illustration provenance recorded. Preservefullframeandvisibleprovenancemark/sparkle atlowerright,no watermarkfree claim. CaptionAIgeneratedillustrationnotrealpatient. Westernlicensedstockkeptinassetfolderwithprovenancebutnotcurrentimage. CSSfullframe,nofacecrop. NeedOPDnewimagepixelretestafterreplacement.
- AudioRx ORIGINALsourcepreservedbutcorrected: no-recordedexport nowerrorinsteadoffabricatedtone; coughanalysis nowexplicitlyunavailable/no syntheticbuffers;revieweditablecurrentScript authoritativeforvoice/share/practiceJSON;staticclinicalSOAP/vitals/diagnoses/AMIEremoved→sourcepracticepreview;sharingusesgenericshare/clipboard,noprefilledrecipient/noattachedaudio/sentsuccessclaims. UIstates prototypeonly. safety-check.cjscontrolledmicdenialpass/noaudioexporterrorpass/coughunavailablepass. Deeperactualrecording/editedspeech/export/share regressionPENDING. OriginalquizandmedicinevisualschedulearebundledSAMPLEandneedconsistencywhenediting;don'tclaimsrealadherence. Originalkaraokefixedtimingneedsrealtimecheck.
- Scanner: realTesseractOCRofsyntheticPARACETAMOL650mgTABLETS fixture succeeded rawtext. RawtextFIRST, nofuzzydrugsubstitution;conflatedparacetamol+ibuprofenentrydisabled;candidateonlyifname+mgstrength+tablet/capsule,releaseformneedsstrictercheck; generativeidentityreconstructiondisabled. Noequivalence/liveprice/stock/savingclaims. Automaticunknown-safetyclearancefoundbytestthenremoved→alwaysunverified/no dispensing/doseapproval. Hypotheticalage/eGFRcontrolsretained. Testscanner-check.cjs; /downloads/scanner_2302_body.txt currentrerunandresult. Needautomatedassertionsbroadercasesexactform/strength/combinationandactualexportpaths. Sourcepricesstilldictionarybutoverriddendisplay;notcurrentfacts.
- Doctor/patientportals nohorizontaloverflowinitial390;notfullparitytested. ABHAVerifiedlabel→Syntheticsamplehealthrecord;badge tooltipnotregistryverified;badgeCSSnowrapids,nohidingdetails. Allnestedtabs/actions/modals/reports stillqueue. FloatingassistanthiddenfocusedOPD/audioRx/scanner/acoustic/portals toavoidcontentoverlap.
- TTS LIVEBLOCKER: directactualEnglish+Telugu /api/gnani/tts outer502/upstream404. Defaultapi.vachana.ai/api/v1/tts/inference maybe stale/envunknown. NOproductionchangesauthorized. No keyabsenceclaim.STT/GroqpassdoesNOTproveTTS. Actualaudibleplaybackstillunverified;donotsubstitutetones orsampleprescription. APIspeakemptytextfallbackremoved→error.
fedf0005b4b07fbe9bfe8eb244635ff76e9c6606d59821208bfdfcea00761dda  android/app/build/outputs/apk/debug/app-debug.apk

## 2026-11-17 23:24-23:32 IST
- Corrected AudioRx modal claims after visual review: synthetic demo wording in summaries, phone preview, notes export, header and footer; removed official verified badge styling and current-generation/ABDM/FHIR/24kHz implications.
- Added controlled TTS-outage test to audiorx-parity-check.cjs: 502 TTS response + edited text must not request bundled `/audio/gnani_lang_*` recording. Passed. Headless browser speech audibility remains untested.
- Added compact 390px AudioRx modal layout: single-column scroll, compact header/footer, preserved website controls. Screenshot `/downloads/audiorx_2320_edit.png` inspected.
- Added full-label title/ARIA text to top language selector; fixed hidden sr-only span so compact selector shows only current short language and full labels remain in options/drawer.
- Exposed all portal tabs on mobile instead of hiding bottom navigation: doctor 7 (incl. AI Assistant), patient 8 (incl. AI Assistant and Health Goals); horizontally scrollable 72px touch targets. New portal-map-check passes all tabs/no horizontal page overflow/no page errors.
- Replaced visible doctor/patient settings registry and integration claims with synthetic-demo wording; new screenshots `/downloads/portal_map_doctor.png` and `/downloads/portal_map_patient.png` inspected.
- Regression status: i18n passes; AudioRx parity passes with controlled unavailable-audio path; OPD regression real audio capture passes, live STT remains blocked; deterministic Groq 503 failure passes; scanner/acoustic/landing/safety checks pass from this run.
- 23:35 IST: localized mobile auth shell in all six interface languages (role toggle, credential labels, show/hide, submit, demo disclaimer, validation errors, back link, route title). Telugu auth screenshot `/downloads/i18n_2315_auth_te.png` inspected; i18n-check now explicitly waits for splash dismissal and passes auth assertions.
- 23:38 IST: localized Solutions screen labels/descriptions/tags in six mobile interface languages.
- Fixed patient settings internal clipping at 320/390/430px; controls and cards now stay inside viewport. Save buttons explicitly say demo-session only, and toasts disclaim all external/registry/dispatch sync. Patient ABHA value is explicitly synthetic. Portal-map check now tests save disclaimers and 320/430 internal fit. APK rebuilt: SHA256 a31a206da44d027b65cc718bfd51ac877f6676edb62389ec3c8361407188fcf4, 41,799,348 bytes, 23:38:50 IST.

## 2026-11-17 23:39-23:54 IST
- Implemented real local non-secret preference persistence (`src/services/localPreferences.js`) for patient voice persona/tempo/channel reminder choices and doctor scribe/noise/guardrail choices, namespaced per demo account. Fixed MobileRoot so mobile portal routes receive actual doctor/patient profiles instead of keying saves to `guest`.
- Portal regression `/downloads/portal_persist_2344.txt`: all 7 doctor tabs and 8 patient tabs; doctor and patient settings persist after reload; second synthetic patient does not inherit first patient's settings; separate local namespace is created; 320/430px patient settings fit; save disclaimers asserted.
- Solutions screen localized in all six mobile interface languages; i18n assertions pass `/downloads/i18n_2345_solutions.txt`; Telugu screenshot `/downloads/i18n_2315_solutions_te.png` inspected after correcting the capture to wait for splash dismissal. Full portal/AudioRx/scanner/acoustic/dialog/export localization remains partial.
- Added local device notification implementation (`src/services/deviceNotificationService.js`) using Capacitor Local Notifications 8.3.1 on Android, with browser Notification fallback in preview. Added Android `POST_NOTIFICATIONS`; merged APK manifest confirms it. Added permission request and a "Send local test notification" action. Preview test `/downloads/notifications_2348.txt` passes with mocked browser Notification; screenshot `/downloads/notifications_2348_patient.png` inspected. Native OS delivery, sound, DND interaction, and background behavior remain untested because no usable Android runtime exists here.
- Reworked notification drawer seeded items and footer into explicit synthetic/local-only demo alerts. Removed live WhatsApp delivery/read receipt, official identifier, registry signing, FHIR sync, ABDM encrypted-channel and realtime-sync claims from the drawer. Browser constructor test verifies honest local-only copy; no server push is claimed.
- Doctor settings now gate unavailable external scribe options, state DSP/speaker-separation uncertainty, and disable unavailable external registry sync and WhatsApp dispatch. Demo sign-off is labeled local-only, with no PKI or registry verification. Portal regression `/downloads/portal_map_2353.txt` passes with unavailable options asserted gated.
- Patient settings emergency/locker/family/offline sections now distinguish saved local demo preferences from unavailable external dispatch, health-card generation, registry sync, caregiver sharing, offline voice cache, and low-bandwidth codec. Bottom save button now says only "Save preferences"; screenshots `/downloads/portal_map_doctor.png` and `/downloads/portal_map_patient.png` inspected.
- Replaced the generated ABDM whitepaper/executive dossier with a prototype integration-status report. New `integration-status-check.cjs` passes and evidence `/downloads/integration_status_2354.txt` verifies no certification, official approval, verified-sandbox, or authorized sign-off claim. Architecture and doctor-portal exports share this corrected generator.
- APK rebuilt 23:51:51 IST: 42,509,921 bytes, SHA256 `f522ce43b5f3e4ebcd4c5b6863469ec5a7f73c9db01e5c75b8724ca7f4dc3ba0`. Compile succeeds with the local-notifications plugin. Native install/launch still not tested.
- Static APK audit 23:52: package `ai.ayuswar.app`, min SDK 24, target SDK 36; permissions include INTERNET, RECORD_AUDIO, CAMERA, coarse/fine location, MODIFY_AUDIO_SETTINGS, POST_NOTIFICATIONS plus plugin-added RECEIVE_BOOT_COMPLETED, WAKE_LOCK, SCHEDULE_EXACT_ALARM. No Google/OpenAI-shaped token, Supabase hostname, cleartext flag, localhost, or `10.0.2.2` found in bundled assets. Two JWT-like substrings were inspected by context and are inside an embedded base64 blob in `pitch.html`, not credentials. Mapbox appears as unused/vendor wording only; no token shape found. Dynamic/runtime secrets cannot be ruled out from static scan alone.
- 23:53:44 IST APK rebuilt after correcting doctor/patient sample prescription footers and headers: 42,509,930 bytes, SHA256 `38daa13dfe80272679c4443a670e667171adcc7c674f92042558d72ac8773cd3`. Printable sample documents now say synthetic demo, not government-issued, and demo sign-off marker, not digital signature or verified physician. `portal_map_2356.txt` and `integration_status_check_2356.txt` pass.
- 23:54 authority-claim source inventory: corrected files scan clean for the targeted external-authority phrases; remaining hits are inventoried in `/downloads/authority_claims_inventory_2354.txt`, mostly desktop/source/data components not yet fully remediated for mobile parity. Treat this as pending audit scope, not completion.
- 23:55 visual asset groundwork: `/downloads/visual_asset_inventory_2355.txt` inventories public assets/medicine illustrations with SHA256 prefixes, sizes, and direct source references. No EXIF Artist/Copyright/ImageDescription metadata found in checked local images. This is an inventory only; licensing/provenance remains unresolved unless separately evidenced. Mobile currently uses AyuSwar emblem assets, the generated Indian consultation image, and the WhatsApp mark only on an explicit user-directed share button whose copy says the user chooses the recipient and no automatic send occurs. Medicine strip illustrations remain bundled synthetic visual examples; they must not be presented as verified identification of a real pack.

## 2026-11-18 00:01 IST - Local sign-off notification build
- Reworked the OPD sign-off flow so it uses the shared local-notification service instead of only updating an in-memory drawer. The signed draft now sends a local notification after permission exists, and the settings-facing draft-alert control requests permission only when the user explicitly enables it.
- Cleaned the notification test to wait out the sign-button transition before screenshotting. The washed-out button seen at 23:57 was a mid-animation capture, not a CSS defect; the final verified state keeps the standard dark-green `.m-btn-primary` styling.
- `opd-notification-check.cjs` passes: no automatic permission prompt, explicit draft-alert enablement sends a local-only test notification, and re-signing after edits sends the local signed-draft notification.
- Rebuilt debug APK after these changes: `app-debug.apk`, SHA256 `bf6348d031c34d5c0209da12436e3e67855ebc1031fb79b3b961b214abd2af9a`, 42,511,364 bytes, 2026-11-18 00:00:25 IST.
- Remaining honest limitation: browser-path notification behavior is verified in Chromium; native Android drawer delivery, sound, vibration, permission UX, and DND interaction remain untested because an emulator/device is not available.

## 2026-11-18 00:07 IST - Landing authority-claim remediation
- Corrected the highest-visibility desktop landing/modal authority claims after source inventory: ABDM FHIR card now says prototype architecture, local FHIR-shaped JSON, not certified/connected/officially approved; landing status pill no longer says ABDM active; governance section now describes a prototype human-review safeguard instead of an NHA/NMC directive; demo sign-off is no longer represented as Class-3 DSC or Aadhaar eSign; external registry writes are stated disabled/not connected.
- `landing-check.cjs` passes after the edits (`/downloads/landing_claims_0006.txt`), including 8 capability dialogs, 11 FAQ entries, 320/430px overflow checks, and zero browser page errors.
- Updated inventory: `/downloads/authority_claims_inventory_0006.txt`. Remaining hits are concentrated in desktop/source/data components and translations and stay in the pending audit scope; they are not claimed complete.
- Rebuilt debug APK after the landing authority-claim edits: `app-debug.apk`, SHA256 `090ccf62fd89ef8afb1c54fd4c3dbd6623c8b02d42ccabb8aeb0d1b4c8d7ef55`, 42,511,379 bytes, 2026-11-18 00:06:28 IST. `portal-map-check.cjs` and `i18n-check.cjs` also passed after the build (`/downloads/portal_map_0008.txt`, `/downloads/i18n_0008.txt`).

## 2026-11-18 00:18 IST - Scanner and OPD export functional tests
- Extracted scanner OCR parsing helpers into `src/services/prescriptionOcrParsing.js` so deterministic cases are directly testable. `scanner-parser-check.mjs` passes 8 cases: exact single-salt candidate, strength mismatch rejected, non-tablet form rejected, conflated paracetamol/ibuprofen entry disabled, multiple candidates suppressed, unknown medicine rejected, sustained-release candidate still unverified, and batch/expiry parsing variants (`/downloads/scanner_parser_0017.txt`).
- Browser scanner regression now waits for the actual live OCR result instead of matching preset text, verifies real Tesseract output for the synthetic PARACETAMOL fixture, verifies unknown non-medicine text produces no stale medicine candidate, and asserts the uploaded-image thumbnail loads. Evidence `/downloads/scanner_0018_tests.txt`; screenshots `/downloads/scanner_0018_result.png` and `/downloads/scanner_0018_unknown.png` inspected.
- Fixed a real scanner UI bug found by that test: file-upload OCR stored a `File` object as the result image URL, rendering as `/[object File]` and a broken thumbnail. Uploads now pass a separate object URL for preview while Tesseract still reads the original file. The thumbnail assertion catches regressions.
- Extended OPD sign-off test into source-to-export verification: downloaded FHIR-format JSON contains the doctor's current edited SOAP and voice-summary fields; general share fallback copies the current edited summary without auto-send; WhatsApp browser fallback copies text only and explicitly does not claim delivery. Evidence `/downloads/opd_export_0019.txt`; screenshot `/downloads/opd_export_0019.png` inspected.
- These are Chromium preview results. Native Android file location, share-sheet behavior, WhatsApp app handoff, and downloaded-file persistence remain untested.
00:18 IST
Implemented nested Doctor Reports export and remediated the visible/data-level ABDM implications. The Reports & Lab action now downloads ayuswar_fhir_research_draft JSON tagged synthetic-research-draft, with unconfirmed condition and draft/proposal medication requests; filename/button/toast no longer imply registry validation. Browser check portal-map-check verifies actual downloaded JSON contains no healthid.ndhm.gov.in, doctor.ndhm.gov.in, or ClinicalPrescriptionBundle and contains draft markers: PASS /downloads/portal_map_0022.txt.
00:19 IST APK rebuilt after scanner thumbnail fix and FHIR draft export changes. 05e0631f0c0e85d52c6c280c0e1a24c467724a4eae4cc1f7861b3f186f0fb465  android/app/build/outputs/apk/debug/app-debug.apk
00:25 IST
Implemented real portal navigation localization across all six supported interface locales. Added missing doctor AI Assistant/short OPD keys and patient dashboard/My Health/Appointments/Reports/Prescriptions/Assistant/Goals/Settings keys; desktop and mobile portal nav now consume the shared AppContext locale instead of hardcoded English. Browser evidence verifies Telugu patient navigation persists after reload, shared Telugu selection carries into doctor portal, and language switches back to English. Screenshots /downloads/portal_patient_telugu_0033.png and /downloads/portal_doctor_telugu_0033.png inspected; body content remains partially English, so localization remains PARTIAL, not whole-UI.
00:26 IST APK rebuilt after portal FHIR draft export and portal nav localization. e0c6d4c01a89cdc6a71926570fcd99449743b19edea6d4bb8c258bcc24fac151  android/app/build/outputs/apk/debug/app-debug.apk
00:33 IST
Completed a visual asset/logo/icon audit artifact at /downloads/visual_asset_audit_0045.md with dimensions, source usage counts, provenance classes, and unused-file list; inspected contact sheet /downloads/visual_asset_contact_0046.jpg. Replaced the neon/glow Sanjivani badge with a cream/green/saffron simulated-assist medallion aligned to the product palette; original preserved at /downloads/original_sanjivani_circular_badge_0047.png. Remediated remaining visible FAQ/desktop module/portal prescription/DSC/ABDM authority claims across six locales, including local FHIR research-draft wording, no automated contraindication clearance, and honest simulated emergency handoff. Verified with portal-map, module-claim, and landing checks: /downloads/portal_map_0042.txt, /downloads/module_claim_0042.txt, /downloads/landing_0042.txt.
00:34 IST APK rebuilt after claim remediation and Sanjivani badge redesign. ecedea169cd08ef4863f0917eb7b7044d5976e86d6c73a6f7ede33ac76789c2b  android/app/build/outputs/apk/debug/app-debug.apk
00:35 IST
Added slogan/logo/icon audit at /downloads/slogan_logo_claim_audit_0050.md. Rewrote all DetailedModuleView high-level taglines and module headings/subtitles that implied national integration, live dispatch, guaranteed diagnosis/savings, sovereign deployment, real-world validation, or autonomous emergency service. Replaced fictional doctor-name assistant CTA with AyuSwar Virtual Assistant. Nested module check passes after changes (/downloads/module_claim_0050.txt).
00:35 IST APK rebuilt after module slogan remediation. 5cc6cc4e006887b89050cdfba573bd9e8edbdf9a4be9e317fdf49e4b5281dee8  android/app/build/outputs/apk/debug/app-debug.apk

## 2026-11-18 00:38 IST - Offline shell remediation
- Found first-launch offline gap: service worker only cached requests after it took control, so the entry JS/CSS/font/image assets were absent and offline reload stayed on splash.
- Added build-generated `dist/sw-assets.json` manifest (146 URLs) and upgraded `public/sw.js` to v6 with install-time caching of all local build assets, fonts, and root shell files.
- Offline regression now passes for a visited patient-auth route and offline home reload at 390px; evidence `/downloads/offline_0103_run.txt` and screenshot `/downloads/offline_0102_home.png`.
- Current dist is rebuilt for offline support, but the Android APK has not yet been rebuilt after this change.

## 2026-11-18 00:52 IST - Offline cache bounds, test suite repair, mobile home localization
- Reconciled timestamps after review: earlier report treated filename suffixes such as `0051` as wall-clock times. Actual filesystem mtimes are authoritative. Latest app APK is now 00:52:20 IST, SHA256 `2074b74cf072449cd6a3062684502ee7717fdbb7f74512cdf586fa2b59e33d3c`, 42,090,967 bytes.
- Upgraded service worker to v7 with explicit cache bounds: no private clinical API responses, route documents, `/audio/` responses, media destinations, third-party origins, or secrets are cached. Old cache versions are deleted on activation. Warm offline shell works after an online install; first-ever offline launch honestly fails. Audit: `/downloads/offline_cache_audit_0053.md`; tests `/downloads/offline_privacy_0125.txt`, `/downloads/offline_0126.txt`; inspected screenshot `/downloads/offline_privacy_0047_home.png`.
- Repaired test-suite execution without changing product claims: added explicit `.js` import resolution for Node, regenerated corrupted synthetic WAV fixtures as valid 44.1kHz PCM, aligned the auth/database test with local-demo mode and optional Supabase migrations, updated the AudioRx test for the current honest share labels, and made `test/run_all.js` report 98 passed + 2 conditional skips instead of a false 101/101 and stale provider/platform claims.
- Full suite now exits 0: `/downloads/npm_test_0129.txt`.
- Expanded mobile home localization beyond nav: localized greeting, four service descriptions, feature chips, generated-image alt text, loading label, and prototype footer across six locales. Browser evidence `/downloads/i18n_0121.txt`; screenshot `/downloads/i18n_2315_te-IN.png` inspected. Localization remains PARTIAL for long-form content and portal bodies.
- Performance lab audit at 390x844 with cache/service workers disabled: `/downloads/performance_audit_0054.md` and `.json`. Main local timings are lab-only, not Android device timings.

## 2026-11-18 03:01 IST - Reconciliation round
- Print slip ABHA reconciled to canonical DEMO-ABHA-0000-1049 (4 DoctorPortal sites); Ananya Rao given distinct DEMO-ABHA-0000-1047 (was duplicate).
- Facility renamed unambiguously fictional across 12+ sites: "AyuSwar Demo District Hospital (synthetic)" / "Demo ... (synthetic)" (DoctorAuthModal, PatientPortal x2, MobileInnovationHubModal, KurnoolClimateSentinel, LiveOpdDemoSimulator x2, PatientAuthModal x3, HeroLanding, ClinicalBenchmarkView, clinicalRegistry, AppContext, diagnosticReportsDataset x4). Maps link now queries the fictional name. Regional "Kurnool" SETTING refs (village/catchment/climate) intentionally kept - synthetic setting, not affiliation.
- Reports header count now dynamic {recentReports.length}; verified 20 == All Reports tab 20.
- Verified: slipABHA DEMO-ABHA-0000-1049, facility fictional, no "Kurnool District Hospital" anywhere (reconcile_verify.cjs).
- APK 0301: /downloads/AyuSwar-debug-safety-0301.apk 45,401,408B SHA256 3bbe8a1b02d333855d39aec9ae58a32b9a40b0589e097734dd799964ff83c8e8 (03:00 IST). Tests 98/0.
- PENDING: (a) verify GENERATED PDF output of Print/Save PDF (preview verified only); (b) RAG matrix safe routing - distinguish educational sample vs generated, honest provider failure, no canned personalized treatment (partial sentence neutralization done 02:56; full reword pending); (c) portal/modal internal translations; (d) final audit PDF/DOCX; (e) hourly editor JPEG :05 + report :10.

## 03:17 IST - Safe-routing rework
- Removed tier-1 canned matrix interception from ALL live queries (FloatingAssistant + DoctorPortal AI box). Live symptom queries now get truthful inability-to-assess text, no urgency label, no canned diagnosis.
- Removed vernacular symptom->concept/urgency card from live structured mapper.
- Bundled samples moved behind explicit user-selected "Sample Q&A (educational)" library view, labeled educational, voice plays only on selection.
- GINA claim in asthma sample verified against GINA Summary Guide 2025 (ginasthma.org PDF): Track 1 preferred reliever = low-dose ICS-formoterol. Kept in educational sample only.
- Strict no-match brain response reworded to plain inability-to-assess in en/te/hi; aiBrainService emoji markers replaced with text (tofu policy); ABDM-guideline claim in scribe fallback removed.
- Reply header renamed "AyuSwar AI Response" -> "AyuSwar Assistant" (deterministic fallbacks no longer AI-labeled).
- Verified: LIVE_SYMPTOM all-true, LIVE_DENGUE all-true, FORMULARY card intact, NAV synthetic framing intact, SAMPLE_VIEW labeled; npm test 98/0; APK 0317.

## 03:21 IST - Sample library content neutralization
- All 8 matrix samples reviewed. GERD/palpitations diagnosis-like assertion neutralized in en/te/hi (many possible causes; clinician determines; emergency red-flag kept). Dengue English treatment directive removed (no self-medication; doctor decides). Metformin + hypertension answers qualified as general info deferring to prescriber. Asthma GINA claim narrowed to verified population/regimen (GINA 2025, adults+adolescents, low-dose ICS-formoterol preferred reliever; source ginasthma.org Summary Guide 2025 PDF).
- Reply header is now "AyuSwar Assistant" (final-build verified); response panel scroll verified - emergency line reachable after scroll at 390px width.
- Evidence: final_live_scrolled_0319.png, final_library_0319.png, final_sample_0319.png. npm test 98/0. APK 0321 (local only, batched per main instruction).

## 03:22 IST - Floating assistant chrome i18n (all 6 locales)
- Added assistant.* key set (29 keys) to en/te/hi/ta/kn/mr; audit: 287 keys per locale, 0 missing.
- Wired FloatingAssistant chrome: voice status, language label, ready/recording/speaking states, reply headers, sample library header/note, shortcuts, Me to Speak, AI Voice states, Done. Replaced misleading "Gnani Neural Voice (working/untested)" labels with neutral voice state labels (browser fallback could be the actual voice).
- Verified te-IN: full assistant chrome renders Telugu (screenshot assistant_te_chrome_0322.png). npm test 98/0, build clean.
- Known gaps: matrix sample Q&A content exists only in en/te/hi (ta/kn/mr get English sample questions); speech-not-detected prompt only en/te/hi; portal/modal internals (PatientPortal, DoctorPortal, modals) still hardcoded English.

## 03:27 IST - Audio export verification + mobile modal wiring + quick-action de-canning
- WAV EXPORT VERIFIED (generated file, not button): canonical sample download produced AyuSwar_Sample_AudioRx_DEMO_te.wav. Caught real defect: all 19 bundled WAVs had 0xFFFFFFFF stream-placeholder RIFF/data sizes (invalid headers in strict players). Fixed all headers in public/audio; re-verified download dataSize==filesize-44 (consistent:true).
- Sample binding guard: Audio (.wav) download now refused when the note text was edited (doctorEditedSpeech/custom); visible refusal message rendered (was previously set but never displayed - silent failure). Filename de-branded from "Gnani" to Sample..._DEMO.
- MOBILE FLOW GAP FIXED: MobileRoot assistant "WhatsApp Rx" navigated to /audio-rx studio; the WhatsAppAudioRxModal (compose preview, karaoke, WAV export) was desktop-only. Modal now wired into MobileRoot and opens on phone viewport (verified at 390px, URL stays /).
- QUICK ACTIONS DE-CANNED: doctor SOAP Note/Drug Interaction/Telugu Crosswalk/Next Patient/Reports and patient Medicines/Reports/Dose Timing no longer narrate fabricated SOAP notes, "Safe to administer" clearances, patient dosages, or report interpretations. They now navigate to the real surface (console/datasets/tab) with a plain assistant confirmation; Emergency keeps honest 112/108 simulation text.
- Verified: wav_verify2 (canonical consistent + edited refusal), npm test 98/0, build clean.
APK checkpoint 0330: /downloads/AyuSwar-debug-safety-0330.apk mtime 2026-11-18 03:28:03 IST, 45,401,320 bytes, SHA256 87fa105eb6e77754d881617472356b7e14bd10dc997c900c46c18aae88e6e721 (local only; supersedes 0321; not transferred per main batching instruction).

## 03:42-03:52 IST - Mobile assistant parity on portals + quick-action verification
- FOUND: MobileRoot excluded FloatingAssistant from /doctor-portal and /patient-portal, so role-aware quick actions (SOAP Note, Drug Safety, Crosswalk, Queue, Today's Medicines, My Reports, Dose Timing, 108) and the Sample Q&A library were unreachable on phone inside portals. Desktop mounts it there.
- FIX: assistant now mounts on portal routes; onNavigateTab wired to ?tab= deep links; doctorProfile/patientProfile passed.
- FOUND: collapsed FAB overlapped the fixed "Generate draft" CTA on /clinical-console. FIX: kept studio routes excluded (/audio-rx, /scanner, /acoustic-lab) but /clinical-console now mounts the assistant with a lift-more CSS class (bottom 150px) clearing the CTA; overlaps only the record card's blank right edge (accepted trade-off).
- VERIFIED (browser, 390px, quickaction_verify.cjs): doctor SOAP Note / Drug Safety / Queue and patient Today's Medicines / Dose Timing all show honest navigation notes, no fabricated SOAP/"safe to administer"/dosage/report narration; Queue navigates to ?tab=patients; patient 108 chip navigates to /sanjivani (its honest note unmounts with the assistant on that excluded route; Sanjivani screen itself is labeled simulation).
- NOTED: tofu glyph (X-ray emoji) on doctor-portal Recent Reports chest-radiograph icon; add to icon sweep.
- Tests: npm test 98 passed, 2 conditional skips, 0 failed at 03:53 IST (log /tmp/npm_test_0353.log). NOTE: `npx vitest run` directly reports script-style test files as "0 test" failures - not a regression; use npm test.
- Screenshots: /tmp/shots/qa_doctor_soap_0345.png, qa_doctor_drug_0345.png, qa_patient_meds_0345.png, fab_doctorportal_0348.png, fab_console_lifted_0351.png

## 04:04-04:11 IST - Voice-state binding fix
- Review found conflicting audio state in the Telugu chrome shot: status line said untested while toggles said ON.
- ROOT CAUSE 1: voiceOk=null (untested) fell through to "Audio on"/"AI Voice: ON" on the mute and AI-voice toggles; only voiceOk=false showed honest labels.
- ROOT CAUSE 2 (deeper): assistant chrome translated from its own voice-language setting (localStorage ayuswar_language) instead of the app UI locale (ayuswar_selected_language); app-locale changes did not translate the assistant. The 03:22 chrome check had seeded the wrong key, masking it.
- FIX: all three voice surfaces bind to the same availability state (untested/null, unavailable/false, on/true only after real playback); new assistant.aiVoiceUntested key in all 6 locales (288 keys each). Assistant chrome now uses useApp() selectedLanguage; voice-language selector is speech-only.
- VERIFIED 390px: EN/TE untested + provider-failure states all agree, no on-claim; header select shows తెలుగు; live locale switch re-translates assistant; npm test 98/0 at 04:11. Evidence: /tmp/shots/voicestate_failed_te_0410.png, voicestate_untested_en_0407.png, voicestate_failed_en_0407.png.

## 04:11-04:17 IST - Full 8-sample cross-locale audit + ta/kn/mr samples
- FOUND: only the GERD sample had been neutralized in te/hi; hypertension and metformin te/hi still read as directives (named Telmisartan, "3 spoons sugar" intervention), asthma te/hi diverged from the qualified EN, jan-aushadhi te/hi kept an affirmative equivalence + "NABL labs" quality claim removed elsewhere, heat-ORS and anemia lacked qualifiers in all 3 locales.
- FIX: 14 answer strings neutralized across en/te/hi (all now "general information" framing deferring to prescriber/clinician; no named-drug directives, no quality/equivalence claims, no unsourced quantities as directives).
- ADDED: tamil, kannada, marathi question+answer for all 8 samples (neutralized framing from the start).
- FIX: sample content selection now uses the app UI locale via matrixContent() (was the voice language); missing locale falls back to English.
- VERIFIED 390px: Tamil UI renders Tamil library + sample (sample_ta_0418.png, voice labels agree unavailable); Telugu hypertension sample qualified, no Telmisartan, defers to doctor; Telugu jan-aushadhi no NABL/yes-claim. Build 04:16 passed; npm test 98/0.

## 04:17-04:35 IST (Nov 18) - Patient home i18n + cross-locale sample evidence

1. PatientPortal home tab translated: 24 patient.home.* keys added in all 6 locales
   (greeting w/ {name} param, subtitle, sampleRecord, demoId, 4 quick cards title+sub,
   upcoming/viewAll/join/onlineConsult, healthOverview/viewDetails, 4 vitals labels,
   normalChip, recentReports). en/te/hi/ta/kn/mr; ta/kn/mr machine-authored, not
   human-reviewed (same limitation as sample translations). No clinician-entered
   medicine names/doses/instructions touched. Build OK 04:25.
   Verified te at 390px: greeting/subtitle/cards/overview/sample-record/recent all
   Telugu, no English leakage (patienthome_textonly.cjs 7/7 checks).
   Screenshot: /tmp/shots/patient_home_te_0421.png.
2. Tofu fix: PatientPortal badge 🌿 -> Lucide Leaf icon; 🛡️ -> Lucide Shield icon
   (Shield was already imported; Leaf added). Build OK.
3. Cross-locale sample evidence : hypertension sample clicked and
   answer tail verified at runtime in ALL 5 non-EN locales via sample_check_one.cjs:
   te/hi/ta/kn/mr answerTailFound=true ("doctor decides" tail present in each).
   questionFound=false post-click is expected (view swaps to answer-only).
   Scroll evidence: /tmp/shots/sample_te_top_0426.png, sample_te_bottom_0426.png,
   sample_ta_top_0426.png, sample_ta_bottom_0426.png (answer scrolled to bottom,
   defer-to-doctor tail visible; te bottom shot pixel-verified).
4. Inert metadata noted: CLINICAL_RAG_AUDIO_MATRIX entries carry genericDrug/icd10/
   snomed fields; sample UI renders only question+answer via matrixContent();
   findMatrixAnswer/queryTieredClinicalVoiceRag have no callers outside the service
   (live path stays de-canned). Recorded for final audit.
5. Playwright harness learning: locator('button',{hasText}) needed - bare
   getByText(...).first() matches the outer container (its innerText contains the
   string) and clicks a non-button ancestor, timing out. Also browser.close()
   intermittently hangs >60s on this box; scripts end with process.exit(0).

## 04:35-04:40 IST - Patient home slice 2 (reports/care-team/adherence)

- 10 more patient.home.* keys x6 locales: repChest/repBlood/repLung, view, careTeam,
  districtOpd, teleAvailable, bookVisit, dailyAdherence, adherenceStatus.
- Report row emojis 🩻🩸🫁 replaced with Lucide FileText/Droplets/Wind (already imported).
- Caught by build: a blind string replace hit vitals DATA string 'District OPD Screening'
  (line 385) - reverted; UI chip at 1963 translated. Data strings stay English source data.
- Verified te 390px (patienthome2_check.cjs 7/7): Telugu titles, Lucide icons render,
  zero tofu in reports section. Screenshot: /tmp/shots/patient_reports_te_0439.png.
- Remaining known mixed-locale bits on patient home: vitals status chips from data
  fallback ('Normal', 'BMI 22.4 Ideal', '88% Rested'), MEWS chip label English,
  dates English format. Pending decision: translate status fallback vs keep data.
- npm test after slice: 98 passed, 0 failed.

## 04:37-04:39 - mr-IN key gap found by npm test Phase 12, fixed

- npm test Phase 2 dictionary parity FAILED after slice 2: mr-IN had 312/322 keys.
  Cause: batch-2 insertion script used pre-computed anchor offsets while mutating the
  file; mr-IN's block landed wrong and its 10 keys were lost. Regression caught by the
  suite, not by manual review. Fixed by direct line-anchored insertion after mr's
  patient.home.recentReports; all 6 locales now 322 keys. Build OK, npm test 98/0.
- Lesson logged for future batch edits: re-scan anchors per insertion or insert
  bottom-up (descending offsets).

## 04:38-04:42 - Doctor dashboard greeting i18n

- 6 doctor.home.* keys x6 locales (greeting w/ {name}, sampleData, facilityLine,
  bullet1, bullet2, simWarning). Bottom-up insertion (avoids the stale-offset bug).
  Parity 328/328 all locales; npm test 98/0.
- Wired DoctorPortal dashboard banner; warning ⚠️ emoji replaced with Lucide
  AlertTriangle (already imported). Verified te 390px (doctorhome_check.cjs 6/6).
  Screenshot: /tmp/shots/doctor_home_te_0442.png.
- Pending on doctor dashboard (logged, not yet translated): SESSION DATE/ACTIVE OPD
  ROSTER chips, Overview/Queue/Analytics pills, PHC weather-sentinel card text,
  advisory banner, stat labels, consultation table, remaining tabs.

## 04:40-04:47 - Doctor dashboard chips/pills + KurnoolClimateSentinel i18n

- 6 doctor.home.* keys (sessionDate, activeRoster, consultations{count}, overview,
  queue, analytics) + 9 doctor.sentinel.* keys (title, hospital, heatHigh, aqiGood,
  humidity, advisoryTitle, advisoryBody, addOrs, orsToast) x6 locales.
- KurnoolClimateSentinel.jsx now uses useApp().t (was zero-i18n). Advisory text is
  demo-sentinel copy, translated as UI; no clinician-entered content touched.
- Fixed self-inflicted double '+' on ORS button (Plus icon + literal).
- Verified te 390px (doctorhome2_check 7/7, sentinel_check 6/6).
  Screenshot: /tmp/shots/sentinel_te_0446.png (pre double-+ fix; text unchanged).
- Build OK, npm test 98/0 after both slices. All 6 locales 334 keys each.

## 2026-11-18 05:11-05:16 IST - patient appointments tab i18n
- 36 patient.appts.* keys x6 locales (dictionary now 380 keys/locale): tab header/subtitle, book-new button, saved toast, view-ticket, modal title/labels (specialist, date, slot, mode, symptoms), date chips Today/Tomorrow, slot group headers, slot status (Available/Selected/Booked), upcoming card, reset-demo, scheduled suffix, empty state, request follow-up, teleconsult/in-person badges, join call, directions, reschedule, reason prefix, cancel.
- Emoji sweep continued: slot-group 🌅/☀️ -> Lucide Sunrise/Sun; list badges 📹/🏥 -> Lucide Video/Building2 (inline, verified no tofu in te render).
- BUG FOUND by pixel check: booking-modal h3 title rendered #0F4C5C on #0F4C5C header (global h3 color beats inheritance) - pre-existing, invisible title. Fixed with explicit color #ffffff; re-verified visible in screenshot.
- Mode toggle wired value/label split (bookingMode still 'In-Person'/'Video' internally; display translated).
- Verified te 390px: tab 7/7, modal 9/9 (appts_check.cjs). Screenshots /tmp/shots/patient_appts_te_0514.png, patient_appts_modal_te_0514.png (post-fix). npm test 98/0. Remaining English on tab: Past Completed Visits card, portal chrome, data values (names/specialties/dates/'Routine follow-up' fallback, '(Today)' from formatDemoDate).
- Audit generator: Evon row reworded to inspected-evidence only (backend status 22:20 reported unconfigured; live deployment not re-verified; settings separate from source config; no hosting access granted); appointments VERIFIED row added. Regen at 06:03 with editor batch.

## 2026-11-18 05:16-05:24 IST - appointments flow hardening
- Date chips: hardcoded May 14/15 replaced with clock-derived offsets (0=today,1=tomorrow,+2,+3 via toLocaleDateString en-IN); bookingDate state is now an offset int; label derived once for chip/store/display so ticket and list always match. Verified chips: ఈరోజు/రేపు/Fri, 20 Nov/Sat, 21 Nov.
- Banner: green "Real-Time OPD Slot Allocation Active" -> amber "Sample slot grid - local demo booking only; no real hospital slot is held" (6 locales).
- Reschedule: false "Clinic coordinator notified" alert -> honest demo note (6 locales); handler verified via DOM click; dialog text verified te.
- Fixed bottom tab bar intercepted modal action taps at 390px (booking could not be confirmed on phone) -> nav visibility hidden while booking/ticket modal open; confirm flow then verified end to end.
- Bounded flow test appts_flow_check.cjs: book->toast(te)->ticket(doctor/date/time/mode)->list+count(2)->reload persistence(localStorage)->cancel closes with no record change->reschedule honest dialog->no external requests beyond Google Fonts GETs. All pass.
- Note: floating assistant bubble can overlap card action buttons at some scroll positions at 390px (buttons reachable at natural scroll); logged as polish, not fixed.
- npm test 98/0 after all changes; 37 patient.appts.* keys/locale (381 total).

## 05:26-05:40 IST — Patient portal: reports + medications + health goals tabs localized
- Reports tab: 12 patient.reports.* keys x6 locales (title/subtitle/uploadBtn/hearSample/stopAudio/modalTitle/modalSub/browse/ocr/scanning/reviewRequired/verifyAdd); JSX wired incl. OCR button; '🔊'/'⏹' emoji dropped from hear/stop labels (Volume2 icon already present). 'Review required' status values left as data. Verified te 390px: tab 6/6, modal 4/4 (reports_check.cjs; shots patient_reports_tab_te_0528.png, patient_reports_modal_te_0528.png).
- Medications tab: 11 patient.meds.* keys x6 (title/subtitle/badge/addBtn/rxPreview/audioPreview/reviewNeeded/sampleCheckOnly/stopAudio/playSample/playSpoken); header/badge/buttons/audio labels + DDI badge wired. Slot names, medicine names, doses, 'As directed by physician', interaction-reminder sentences left as website-authored data. Verified te 390px 7/7 (meds_check.cjs; shot patient_meds_tab_te_0531.png).
- Health goals tab (PatientHealthGoalsTab.jsx): 65 patient.goals.* keys x6 locales across 3 rounds; t passed as prop from PatientPortal. Emoji -> Lucide: streak Flame x2, hydration Droplets, sleep Moon, diet Leaf; PEFR zone chips de-emojied (🟩🟨🟥 -> text). STYLE FIX: '+ 30m Sleep' button was purple (#EDE9FE/#6D28D9) -> green tint (#ECFDF5/#166534 + border #A7F3D0) per palette rules. Breathing-phase display mapped through keys (state strings unchanged). Hero/badge/supervised/steps/hydration/chrono/BP/glucose/sleep/PEFR/sodium/pranayama cards all wired. Verified te 390px: 10/10 + 11/11 + 10/10 across goals_check/goals_check2/goals_check3; full-page shots patient_goals_tab_te_0534.png, patient_goals2_te_0536.png, patient_goals3_te_0538.png.
- Past-visits card (previous run): patient.appts.pastTitle/viewReports keys + FileText icon; 4/4 (appts_past_check.cjs; shot patient_appts_past_te_0526.png).
- Build green (build_0538), npm test 98 passed / 2 conditional skips / 0 failed (npm_test_0538). Dictionary now ~472 keys/locale.

## 05:41-05:50 IST — i18n bugfix + audit/checklist refresh + settings round 1
- BUGFIX kn-IN: dictionary duplicate-diff found 10 patient.home.* keys duplicated inside kn-IN with Marathi values overriding the Kannada originals (later duplicate wins; runtime showed Marathi to Kannada users). Removed dups; all 6 locales now exactly 488 keys. Also fixed 2 mixed Devanagari/Kannada strings in kn goals keys (chronoStreak, planBadge). Script sweep: no remaining cross-script contamination (appts.symptoms language-name parentheticals are intentional). Build green, 98/0.
- Audit: gen_audit.py updated (GENERATED 05:45; +3 VERIFIED rows reports/medications/health-goals; appointments row -> 43 keys + past visits; assistant row -> 488 keys; +2 FIXED rows kn-Marathi mix-up, purple button/emoji; PENDING portal-internals updated). Regenerated DOCX + PDF (7 pages), all pages pixel-inspected: 29/16/9/5 counts, links clickable, Evon wording intact. /downloads/AyuSwar-mobile-audit.docx + .pdf.
- Checklist File: gen-10 revision published (now generation 11), revision filerevision-01M7P00XF7JQ1HMYSE0QEA9AS1, 5 new tested rows + Portal-internals pending row updated; preview verified via cloud browser (lease L-alpx4mevgbbpyk7e3zlycfvjchjv6nkp, reported/released). URL unchanged.
- Settings tab round 1: 23 patient.settings.* keys x6 (title/subtitle/save/savedNote/voice/autoPlay/reminders/waPreview/ivrPref/smsAlerts/emergency/sos/sharing/specialistView + subs). Wired in PatientPortal.jsx (Save button appears twice - both replaced). Verified te 390px 10/10 (settings_check.cjs; shot patient_settings_te_0549.png). Remaining settings: family locker/masking/privacy note(🔒->Lock icon)/offline/print-preview/Rx-table headers + doctor internals.

## 06:06-06:11 IST — Goals claim-neutralization round 4  + bottom-nav overlap fix
- Rewrote 17 existing goal key values x6 locales (bpOptimal/bpPre/controlled/safeRange/hydrationReco/pefrNote/ginaNote/cyclesInfo/sleepNoteTitle/sleepNoteBody/dietNoteTitle/pillboxNote/greenZone/yellowZone/redZone/onTime/sodiumEquiv): all fixed record values, computed classifications and scripted trends now sample-labelled; removed inference/treatment-response claims (sinus rhythm, bronchodilation, GINA guideline response, sleep-benefit claim, sodium WHO "assessment").
- Added 8 new keys x6: restingHr, sampleValue, sleepQuality, fastingNote, logFasting, logPostMeal, toastFasting, toastPostMeal.
- JSX wiring in PatientHealthGoalsTab.jsx (8 sites): Normal Sinus Rhythm -> restingHr+sampleValue; Normoglycemic -> bpOptimal; fasting note (dropped no-symptom claim) -> fastingNote; Log Fasting/Post-Meal buttons -> keys w/ {v}; 2 toasts -> keys; Restorative -> sleepQuality.
- Bottom-nav overlap REAL fix: src/index.css <=768px canvas padding-bottom raised from max(20px, safe-area) to calc(78px + safe-area) so the last card scrolls clear of the fixed 62px .portal-mobile-bottom-nav.
- Verify: build green (/tmp/build_0609.log); npm test 98 passed/2 conditional skips/0 failed (/tmp/npm_test_0610.log); goals_check4.cjs @390x844 te: 12/12 claim assertions pass (no English claim strings, all te sample labels render); NAV-CLEARANCE pass: deepest content bottom 766px < nav top 782px at scroll-bottom. Screenshots pixel-inspected: /downloads/patient_goals4_te_top_0611.png, patient_goals4_te_bottom_0611.png (pranayama last card fully above nav).

## 06:12-06:15 IST — Settings round 2: full settings tab i18n (50 keys x6) + Lock icon
- Added 50 patient.settings.* keys x6 locales: voice card labels/persona/tempo options, sms sub, dispatch slot label+4 options, emergency labels/preview button+alert, sharing sampleId/badge/duration label+4 options, card/research buttons+alerts, family locker title/sub/linked/sharedMeds/masking/privacyNote, offline title/sub/rx/lowbw/cache/clearCache+alert, footer resetBtn+alert. Dialect dropdown option text (language name + English dialect descriptor) deliberately left as-is (language-picker convention); noted for handover.
- Replaced 🔒 emoji with lucide Lock icon (import already present) on privacy note.
- JSX: 50/50 edits applied to PatientPortal.jsx settings section.
- Verify: build green (/tmp/build_0614.log); npm test 98/2/0 (/tmp/npm_test_0614.log); per-locale dup check: 569 keys each, no dups. settings_check2.cjs te@390x844: 18/19 assertions pass (the 1 miss is a typo in my assertion string సింథటిక్ vs dict సింథెటిక్; key renders, visible in pixel check). Pixel-inspected: /downloads/patient_settings2_te_0614_a.png (voice card), _b.png (reminders/emergency/sharing), _c.png (family locker/offline/footer). User-entered data strings (caregiver name, family names, phone, ABHA id) correctly NOT translated.

## 06:15-06:19 IST — Doctor AI assistant claim softening + checklist gen 12 + APK checkpoint-0617 + audit regen
- DoctorAiAssistantTab.jsx: header "Evidence-based clinical assistance calibrated for ICMR/GINA/WHO ICD-10/NFI" -> demo-over-bundled-samples wording; mode pills GINA/DDI/DDx -> Sample-labelled. Answers were already bundled-sample with clinician-review disclaimers.
- Checklist File gen 12 published (rev filerevision-01M7P1WM8FBQVA46RSQNN32B7F): +4 tested rows (goals claims, settings 50 keys, nav fix, AI assistant header), portal-internals pending row updated.
- APK checkpoint-0617: /downloads/AyuSwar-debug-checkpoint-0617.apk, 45,401,403 B, SHA256 bdde8cb75c63470ead357990ac6e1c13212c2b614c11352289946789b87e8474, gradle 1m21s (/tmp/gradle_0616.log), contains all fixes through 06:16.
- Audit regen 06:18: PDF 7pp + DOCX; +4 FIXED rows; APK ref updated to 0617; pages 1,4,5,6 pixel-inspected clean.

## 06:19-06:21 IST — Dialect descriptors localized + APK checkpoint-0621 + audit 06:21 + checklist gen 13
- 7 patient.settings.opt* keys x6 added for the dialect dropdown; descriptor translated per locale, language name kept native-only; duplicate name prefix stripped (42 rewrites, per-locale block replace after identical hi/mr optMarathi value broke naive global replace). Runtime-verified option text in Telugu (dialect_check.cjs).
- Dictionary now 576 keys x6, parity clean, no dups; build green; npm test 98/2/0.
- APK checkpoint-0621: /downloads/AyuSwar-debug-checkpoint-0621.apk, 45,401,403 B, SHA256 fec623ae73128bf55c93e6d77df814a5e0d6c4619c2e80adec5ecedd24421d56 (gradle 22s, /tmp/gradle_0621.log). 0617 superseded.
- Audit regen 06:21 (7pp): APK ref 0621, 21 FIXED rows incl. dialect row; pages 1+6 pixel-inspected. Checklist File gen 13 published (rev filerevision-01M7P26A2BH9JX3BHJ64330JVC).

## 06:22-06:25 IST — Doctor queue + analytics i18n (10 keys x6) + APK checkpoint-0624 + audit 06:24 + checklist gen 14
- 10 doctor.dash.* keys x6: queueRoster/queueRosterSub/addToken/generalEval/analyticsTitle/analyticsSub/hourlyDensity/multiDayTrend/trendsEmpty/sessionLogging. JSX 10/10 wired in DoctorPortal.jsx. Token status chips (Completed/In Progress/Waiting/Upcoming) left as authored record data.
- Verify: build green; npm test 98/2/0; doctorq_check.cjs te@390x844: 11/11 assertions; pixel-inspected /downloads/doctor_queue_card_te_0624.png + doctor_analytics_card_te_0624.png (scrolled into view; first captures showed above-fold greeting, retaken).
- Dictionary 586 keys x6, parity clean. APK checkpoint-0624: /downloads/AyuSwar-debug-checkpoint-0624.apk, 45,401,403 B, SHA256 3df3a56d8b66b9c83ad6ea852a78ed42f990b8ea8215bb4f455698c045bb2d5e (gradle /tmp/gradle_0624.log). 0621 superseded.
- Audit regen 06:24 (8pp, pending row updated to doctor OPD workspace/reports/Rx tabs/patient-detail as remaining); pages 1,7,8 pixel-inspected. Checklist File gen 14 published (rev filerevision-01M7P2CWTQ0KV95T65KXPDQPKH).

## 06:26-06:31 IST - Doctor OPD workspace header i18n (21 keys x6) + APK checkpoint-0630 + audit 06:30 + checklist gen 15
- OPD workspace header translated: KPI strip (queue/upcoming/completed/cohort cards, values + sublines incl. "{n} Patients/Scheduled/Recorded/Registered", "Next: {t}"), 3 subview tabs (queue/schedules/registry, full+compact labels with live count interpolation), quick-search placeholder, token-list heading with clock-derived date, priority-sort chip. 21 keys/locale, dictionary now 607, parity clean, npm test 98/2/0.
- Verify: doctoropd_check.cjs 14/14 PASS at 390px te (route /doctor-portal, click "ఓపీడీ వరుస" bottom-nav pill - dashboard pill "క్యూ" is a DIFFERENT element; roster lives in dashboard section, not OPD tab). Pixel-inspected /downloads/doctor_opd_kpis_te_0628.png + doctor_opd_tabs_te_0628.png.
- Found en route: 2nd occurrence "Demo Queue - Sample Priority Sort" chip (line 3280) and "8 Registered" value missed in first pass; fixed in follow-up batches.
- Remaining EN in OPD tab (recorded pending in audit+checklist): offline-blackout demo card, public-reference-data strip, queue token-card internals (Slot/Urgent/Chief Complaint/Sample ID chips), schedule+directory view internals.
- APK checkpoint-0630: /downloads/AyuSwar-debug-checkpoint-0630.apk, 45,399,641 B, SHA256 64dc2b8bf5d3fcf28af1ee570c36519069bcf6e53ec67c617941a19b9a707e46 (23s incremental). Supersedes 0624.
- Audit regen 06:30: PDF 8pp A4 + DOCX; new FIXED row (23 total); page 1 + page 6 pixel-inspected.
- Checklist gen 15 published: filerevision-01M7P2QSK0VKEHM33XZ922YTEN (APK row now refs 0630; new tested row; portal-internals pending row narrowed).

## 06:31-06:34 IST - OPD offline card + tab header i18n (12 keys x6) + APK checkpoint-0635 + audit 06:35 + checklist gen 16
- Offline draft-queue card (status chips, IndexedDB label, title, desc, 2 buttons) + OPD tab header (subtitle, New Appointment, Today chip) + SampleDataChip wired to existing doctor.home.sampleData at OPD call site. Dictionary 619 keys/locale, parity clean, npm test 98/2/0.
- Verify: offcard_check.cjs 7/7, hdr_check.cjs 5/5 at 390px te; pixel-inspected doctor_opd_offcard_te_0633.png + doctor_opd_hdr_te_0634.png.
- Pending noted: public-reference-data strip (live-status states), queue token-card internals, 4 other bare SampleDataChip call sites (DoctorPortal 6248, PatientPortal 2140/2162/2740).
- APK checkpoint-0635: /downloads/AyuSwar-debug-checkpoint-0635.apk, 45,399,641 B, SHA256 d13ae611820eac6c6fddb2f3cf96cd3b4c24657c7e30fbe12f9a766b0982292f.
- Audit regen 06:35 (24 FIXED rows); checklist gen 16 published filerevision-01M7P2XH778HA6SRFZZNZ5HGBB.

## 06:34-06:37 IST - LiveTelemetryBadge i18n (13 keys x6) + APK checkpoint-0637 + audit 06:37 + checklist gen 17
- Telemetry strip (Public Reference Data label, AQI labels, live/offline + latency, NLM/openFDA refs, Live/Unavailable/Checking) translated; component previously had NO i18n wiring - added useApp() (AppProvider wraps all usage: DoctorPortal 3082, ClinicalConsole 1127 compact). Dictionary 632 keys/locale, parity clean, npm test 98/2/0.
- Verify: telemetry_check.cjs 6/6 at 390px te; pixel-inspected doctor_opd_telemetry_te_0636.png. Service-supplied locationName ("Sample coordinates near Kurnool") stays EN as data string - noted.
- APK checkpoint-0637: /downloads/AyuSwar-debug-checkpoint-0637.apk, 45,399,641 B, SHA256 6b6d5b0fb872e111566527f096bcdc10530c8f87acddc01a5546500e1250a9b2f. Audit regen 06:37 (25 FIXED rows). Checklist gen 17 published filerevision-01M7P317528PS2C456WGKSQWRJ.
- Remaining EN in OPD tab: queue token-card internals only (Slot/Urgent/Chief Complaint/Sample ID chips + patient meta line). Schedule/directory view internals next.

## 06:36-06:41 IST - OPD token cards i18n (15 keys x6) + mobile overflow fix + APK checkpoint-0641 + audit 06:41 + checklist gen 18
- Token cards (Token label, slot chip, complaint line, triage badge display map Critical/Urgent/Moderate/Stable, View EHR / Open Console / Start Voice Scribe) + AbdmRegistryBadgeRow (Sample ID, demo clinician/facility, draft code/term; added useApp wiring). Dictionary 647 keys/locale, parity clean, npm test 98/2/0.
- BUGS FOUND by pixel inspection: (1) complaint interpolation printed literal "undefined" - JSX {undefined} renders blank but t() string-interpolates it; fixed with existing doctor.dash.generalEval fallback. (2) vitals+buttons row overflowed card edge at 390px clipping Start Voice Scribe; added flexWrap to inner row + buttons row.
- Verify: tokencard_check.cjs 10/10 at 390px te; pixel-inspected doctor_opd_tokencard_te_0639.png (twice - caught both bugs).
- APK checkpoint-0641: /downloads/AyuSwar-debug-checkpoint-0641.apk, 45,399,641 B, SHA256 a8dcdc63ed4b942b097ca80daae866cd06aec37c85d3b941840dea99e62b6cf1. Audit regen 06:41 (26 FIXED rows). Checklist gen 18 published filerevision-01M7P389E727XP4MDCVC3T7FB0.
- Remaining EN in OPD tab: schedule + directory view internals; MEWS sample-score text; service locationName string.

## 06:40-06:44 IST - Schedule + directory views i18n (7 keys x6) + APK checkpoint-0644 + audit 06:44 + checklist gen 19
- Schedule heading, Voice Scribe buttons x3 (dashboard 2618, schedule 3655), directory filter chips x4, showing-count line, directory complaint line, directory triage badge. Dictionary 654 keys/locale, parity clean, npm test 98/2/0.
- Verify: scheddir_check.cjs 10/10 at 390px te (clicks షెడ్యూళ్లు then రిజిస్ట్రీ subview tabs); pixel-inspected doctor_opd_directory_te_0642.png - caught "Showing 3 of 8 patients" + directory "Critical" badge missed in first pass, fixed, re-verified.
- OPD queue tab (all 3 views) now fully localized except data strings + MEWS sample-score text.
- APK checkpoint-0644: /downloads/AyuSwar-debug-checkpoint-0644.apk, 45,399,641 B, SHA256 7efee6d85d952365a829fb577fdbf3fa219daf411f5ba5933565e2893ad1b14b. Audit regen 06:44 (27 FIXED rows). Checklist gen 19 published filerevision-01M7P3DBT8MSM4GBR98RCJF9DQ.
- NEXT: doctor reports tab (3877-4782), prescriptions tab (4782-5464), patient-detail modal internals, MEWS text, 4 bare SampleDataChip call sites.

## 06:43-06:47 IST - SampleDataChip sites + my-health heading/subtitle i18n (3 keys x6) + APK checkpoint-0647 + audit 06:47 (9pp) + checklist gen 20
- 5 chip call sites wired (DoctorPortal 6248 patient-modal; PatientPortal 2140 my_health, 2162 styled, 2740 appts); patient.home.profileIdCard replaces composite EN tail; patient.home.idCardSub new. Dictionary 657 keys/locale, parity clean, npm test 98/2/0.
- Verify: chips_check.cjs 8/8 at 390px te (home/my_health/appts). NOTE: patient default tab is 'home', NOT my_health - nav click needed. Audit PDF grew to 9 pages; page 1 re-pixel-inspected 06:45.
- APK checkpoint-0647: /downloads/AyuSwar-debug-checkpoint-0647.apk, 45,399,641 B, SHA256 b5ffb9ed5ecf21bd66bf31d8e9ab5d5c04f0f8757a07dd8d4e72ffb73b259fa7. Checklist gen 20 published filerevision-01M7P3JSQQYSWF3P9A9N6C1YJK.

## 07:04-07:11 IST — Review corrections + functional handover regression
- Identifiers: 6 hfrId values across demoData.jsx (12 occurrences) DEMO-prefixed (HFR-GJ-MSH-0018 etc → DEMO-HFR-…). Grep sweep: no remaining non-DEMO HFR/HPR/ABHA identifiers; clinician-entered content untouched. Runtime verified te (idem_check 4/4, pixel shot doctor_directory_idem_te_0706.png: DEMO-HFR-GJ-MSH-0018 + DEMO-ABHA + DEMO-HPR on card).
- Triage chips: doctor.opd.card.triageCritical/Urgent/Moderate/Stable values now carry sample wording in all 6 locales (e.g. en "Critical (sample)", te "క్రిటికల్ (నమూనా)"). Logic comparisons untouched (raw triageLevel values).
- Claims: neutralized canned patient-assistant reply in aiBrainService.generateSafeDemonstrationResponse that asserted unverified facility hours ("OPD consultations Mon-Sat 9:00 AM - 2:00 PM") — now honest demo guidance (no medical advice, no live schedules, confirm with PHC, 112/108 for urgent). Added 6th SampleDataChip on patient AI Assistant tab header (seeded demo chat now visibly labelled).
- Functional handover regression (handover_regression.cjs + regression3, vite preview 390px): rx preview renders; FHIR JSON download = valid Bundle (7 entries); print button triggers window.print; PMBJP drug search input filters (met→Metformin); New Appointment form submit adds new token (OPD-106) using selected registry patient; AI assistant input sends and receives honest demo-guidance reply with SAMPLE DATA chip. 7/7 PASS after fixes.
- 98 specs passed, 2 conditional skips. vite build clean.

## 07:13-07:21 IST — Review corrections (handover rev 2)
- Seeded assistant chat replaced: hardcoded EN medical-advice reply (honey/gargles + fictional Dr Priya referral) removed; seed Q + seed A now keyed patient.assistant.seedQ/seedA across all 6 locales; seedA is honest nonclinical demo guidance (cannot assess symptoms, consult qualified clinician, 112/108 if severe). TDZ crash caught (t used before useApp destructure) - state moved after hook; error-boundary verified gone.
- Emergency box source-grounded: "104 Health Advice available 24x7" claim removed; now "In a medical emergency, call 112 (national emergency) or 108 (ambulance)" x6 locales; Call 108 button changed from fake alert('Dialing...') to real tel:108 link.
- Chat controls translated: input placeholder, Voice/Listening, Send x6 locales.
- Reachability verified concretely (not full-page assertion): input and Send are the actual elementFromPoint hit targets at their centers at 390px; actual click+type+submit roundtrip returns the honest te fallback ("క్లౌడ్ రీజనింగ్ ప్రస్తుతం అందుబాటులో లేదు", aiBrainService.js:159); at true bottom scroll the full control row clears the fixed nav (pixel proof patient_assistant_ctrls_bottom_te_0721.png).
- assistfix_check.cjs 8/8 (seed honest, no Priya, no honey advice, emergency source-grounded, input/send hit targets, roundtrip). 98 specs green.

## 07:44-07:48 IST — Rev 3: persona neutralization + honest assistant capability copy
- Regression finding: Rx print-bytes re-check exposed surviving named fictional doctor persona contradicting bounded identity-cleanup claim. Full inventory ~30 sites in 25+ files: 5-doctor auth roster, booking/referral/reviewer/radiologist fallbacks, signup prefill + authService default, sample-dialogue speaker, 6 voice-persona labels (now Sample Voice A-F), health-goals fallback, imaging-centre fixture, real-looking NMC number -> DEMO-NMC-0000. All neutralized to Dr. Demo Clinician A-F (synthetic) / Demo Reviewer / Demo Radiologist; AyuSwar Demo District Hospital OPD (synthetic) at every unmarked site. No clinician-entered values touched.
- personaPriya/personaRajesh settings labels -> Demo voice (female/male) x6; queueRosterSub + appts.subtitle demo-care-team wording x6; booking select specialty logic re-keyed to new values.
- Assistant header translated x6; subtitle rewritten honest (general questions only, cannot assess symptoms or give medical advice) x6. Dictionary 667 keys/locale, parity clean.
- persona_check 9/10 + roster2 1/1 = 10/10 (assistant hdr/sub te, appointments care-team, Rx modal demo clinician + synthetic facility, doctor roster sub, zero Priya residue on checked surfaces). 98 specs green.
- Audit: "17 sites" claim bounded + 2 FIXED rows + PENDING header/subtitle item removed.
