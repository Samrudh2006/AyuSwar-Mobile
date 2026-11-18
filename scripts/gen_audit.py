#!/usr/bin/env python3
"""Generate the AyuSwar mobile final audit DOCX (classic black/white A4, clickable links).
PDF is produced separately: libreoffice --headless --convert-to pdf.
Content is structured data so the final regeneration is one command.
"""
import docx
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import datetime, os

BLACK = RGBColor(0, 0, 0)
GRAY = RGBColor(0x44, 0x44, 0x44)

def add_hyperlink(paragraph, url, text):
    part = paragraph.part
    r_id = part.relate_to(url, docx.opc.constants.RELATIONSHIP_TYPE.HYPERLINK, is_external=True)
    hyperlink = OxmlElement('w:hyperlink')
    hyperlink.set(qn('r:id'), r_id)
    new_run = OxmlElement('w:r')
    rPr = OxmlElement('w:rPr')
    rStyle = OxmlElement('w:rStyle'); rStyle.set(qn('w:val'), 'Hyperlink')
    rPr.append(rStyle)
    u = OxmlElement('w:u'); u.set(qn('w:val'), 'single'); rPr.append(u)
    new_run.append(rPr)
    t = OxmlElement('w:t'); t.text = text
    new_run.append(t)
    hyperlink.append(new_run)
    paragraph._p.append(hyperlink)
    return hyperlink

def hr(paragraph):
    pPr = paragraph._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single'); bottom.set(qn('w:sz'), '6')
    bottom.set(qn('w:space'), '1'); bottom.set(qn('w:color'), '000000')
    pBdr.append(bottom); pPr.append(pBdr)

def setup(doc):
    for section in doc.sections:
        section.page_height = Cm(29.7); section.page_width = Cm(21.0)  # A4
        section.top_margin = Cm(2.2); section.bottom_margin = Cm(2.0)
        section.left_margin = Cm(2.2); section.right_margin = Cm(2.2)
    style = doc.styles['Normal']
    style.font.name = 'Times New Roman'; style.font.size = Pt(10.5); style.font.color.rgb = BLACK
    style.paragraph_format.space_after = Pt(4)
    for name, size, bold in [('Heading 1', 15, True), ('Heading 2', 12, True), ('Heading 3', 11, True)]:
        st = doc.styles[name]
        st.font.name = 'Times New Roman'; st.font.size = Pt(size); st.font.bold = bold
        st.font.color.rgb = BLACK

def h1(doc, text):
    p = doc.add_heading(text, level=1); hr(p); return p

def item(doc, name, detail, status=None):
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Cm(0.4)
    tag = {'pass': 'VERIFIED', 'fixed': 'FIXED', 'built': 'BUILT / UNTESTED', 'pending': 'PENDING', 'limit': 'LIMIT'}[status] if status else None
    r = p.add_run(('%s  ' % name) if not tag else ('%s - %s.  ' % (name, tag)))
    r.bold = True
    p.add_run(detail)
    return p

# ---------------- Content (update before final regeneration) ----------------

GENERATED = '18 November 2026, 08:01 IST'
APK = {
    'file': 'AyuSwar-debug-handover-0755.apk',
    'size': '45,401,403 bytes',
    'sha256': 'b4392af6a6f7a985e35f30e000a411ba9be80bf3318e396af63675eff0d4baee',
    'built': '18 Nov 2026, 07:55 IST',
    'note': 'Debug APK, compile-verified, contains every browser-verified fix in this report. Build provenance: this APK was produced from the exact source tree shipped as AyuSwar-mobile-source-18Nov0755.tar.gz (SHA-256 reported with the archive) via npm build + cap sync + gradle assembleDebug at 07:55 IST; the archive and this APK are one provenance pair. Native on-device runtime NOT tested (no physical device available).',
}
LINKS = {
    'Live checklist File': 'https://files.instinct.com/4jiaz39yxm5w-ayuswar-mobile-build-live-checklist',
    'Source repository': 'https://github.com/Samrudh2006/Ayuswar-Ai',
    'Deployed website (reference)': 'https://ayuswar-ai.vercel.app',
    '112 India - Emergency Response Support System (MHA)': 'https://www.112.gov.in/about',
    '108 - NHM Emergency Response / Patient Transport': 'https://www.nhm.gov.in/index1.php?lang=1&level=2&lid=189&sublinkid=1217',
    'GINA 2025 Summary Guide (source for the asthma sample claim)': 'https://ginasthma.org/wp-content/uploads/2025/11/GINA-Summary-Guide-2025-WEB_FINAL-WMS.pdf',
}

VERIFIED = [
    ('Mobile shell and navigation', 'Home, Services index, Sanjivani 108, sign-in screens authored for phone and render-verified at 390 px in browser preview. Bottom tab bar, drawer, back affordances present.'),
    ('Floating assistant: typed questions', 'Question-to-answer flow renders and stays on screen; a crash that failed every typed question was found and fixed.'),
    ('Live medical queries cannot hit canned answers', 'Verified 03:16 IST: the canned-answer interception was removed from the floating assistant and the doctor portal AI box. Live symptom questions now receive a truthful "this prototype cannot assess symptoms" response with emergency guidance - no canned diagnosis and no Routine/urgency label, in English, Telugu and Hindi.'),
    ('Educational sample library separated and neutralized', 'Chronology: 03:19 IST - the 8 bundled sample Q&As moved behind an explicit "Sample Q&A (educational)" toggle and the English samples were neutralized (heartburn no longer asserts reflux, dengue no longer directs medication, metformin/BP defer to the prescriber, asthma claim verified against the official GINA 2025 Summary Guide and narrowed). 04:17-04:26 IST - a deeper cross-locale pass found the Telugu and Hindi copies still carried the old directives; 14 answer strings neutralized across en/te/hi. 04:32-04:34 IST - runtime recheck in 5 Indic locales (see the cross-locale row). The 03:19 timestamp covers the toggle and English pass only, not the cross-locale correction.'),
    ('Response panel scrolls fully at phone size', 'Verified 03:19 IST at 390 px: the emergency-help line is reachable by scrolling to the bottom of the reply panel.'),
    ('Assistant quick actions honest', 'Verified 03:52 IST: doctor shortcuts (SOAP Note, Drug Safety, Crosswalk, Queue) and patient shortcuts (Medicines, Reports, Dose Timing, 108) no longer narrate fabricated SOAP notes, "safe to administer" clearances, patient dosages or report readings. They navigate to the real screen with a plain confirmation note; Queue lands on the patient queue tab.'),
    ('Assistant reachable inside portals on phone', 'Verified 03:52 IST: the assistant was previously excluded from portal routes in the mobile shell, making its role quick actions unreachable on phone. Now mounted on portal routes with tab deep links; on the OPD scribe screen the button is lifted above the fixed bottom action bar.'),
    ('Voice availability labels agree', 'Verified 04:07-04:09 IST: status line, mute toggle and AI-voice toggle all bind to one availability state (untested / unavailable / on after real playback). Provider-failure regression checked in English and Telugu. Assistant chrome follows the app UI locale; the voice-language selector only sets the speech language.'),
    ('Assistant chrome in 6 languages (runtime-verified en, te)', 'Voice status, headers, sample-library labels, shortcuts and buttons translated (dictionary at 488 keys per locale at that checkpoint; 667 keys after later copy batches, parity across all six locales maintained, no duplicates). Runtime-rendered and state-agreement verified in English and Telugu; Tamil, Kannada, Marathi and Hindi have code and key coverage but not equivalent runtime evidence yet.'),
    ('Generated prescription PDF output', 'Verified 03:07 IST: the actual printed PDF (not just the button) was a broken two-page dump of the whole app; print CSS fixed, generated PDF is now one clean A4 page with fictional facility, canonical demo ID, no prices, synthetic-demo banner.'),
    ('WAV audio export', 'Verified 03:27 IST: downloaded the real file and checked its bytes. All 19 bundled WAVs had invalid RIFF headers (0xFFFFFFFF placeholder sizes) - fixed and re-verified. Edited note text visibly refuses the bundled recording; export filename carries a DEMO marker and no vendor brand.'),
    ('Sample audio binding', 'Bundled sample recordings play only when the requested text exactly equals the canonical script in explicit demo mode; edited or patient-specific text can never trigger a packaged recording.'),
    ('Clinical console end to end (desktop-class flow in shell)', 'Verified 01:46 IST: scenario to SOAP draft, clinician-entered medication, voice note that plays the bundled sample recording only because the demo script exactly matches the canonical sample script in explicit demo mode (edited or clinician-entered text visibly refuses the packaged recording and shows an honest unavailable state - no clinician-entered text is synthesized by a canned recording), review/export with WhatsApp compose (user picks recipient, nothing auto-sent), FHIR JSON and print. Works with no AI key via a clearly labelled manual draft path; no fake AI output substituted.'),
    ('Edit invalidates acknowledgement', 'Verified 01:53 IST: editing a note after acknowledgement clears the signed state and requires re-acknowledgement before export or share.'),
    ('WhatsApp compose path', 'Verified 01:53 IST: outbound wa.me compose URL decodes cleanly; edited draft text flows into the compose message for user review. No automated sends anywhere.'),
    ('Demo identity reconciled', 'Verified 03:00 IST: one canonical demo patient ID across print slip, regimens and report fallback; second sample patient has a distinct ID; the facility is renamed unambiguously fictional ("AyuSwar Demo District Hospital (synthetic)") at the 17 sites found by that scan; the reports header count is computed from the displayed records. Note: that scan was bounded - a later regression re-check (07:44 IST) found additional unmarked sites, corrected in the fix rows below.'),
    ('Claims cleanup', 'Removed unverified savings percentages, blanket quality/equivalence claims, "STG 2025 Compliant" chip, "CLINICIAN REVIEWED" badges, named-doctor voice attribution, and inflated dataset counts (real 22/39/70 entries now). Fake AyuSwar research papers replaced with 6 real, source-verified references.'),
    ('Live reference lookups', 'NLM Clinical Tables, openFDA and Open-Meteo are called with synthetic queries only; per-service live/unavailable status is shown honestly.'),
    ('Browser export paths (FHIR JSON, WAV, PDF)', 'Verified in the browser preview by downloading and inspecting the actual output bytes: FHIR JSON export, WAV audio export and the print/PDF path all produce correct files. The native Capacitor Filesystem + Share implementation of the same export is compile-verified only - see "Built but not yet tested".'),
    ('Portal drawers on phone', 'Verified 02:17 and 02:34 IST at 390 px: patient and doctor portal drawers open and navigate to every tab (7 doctor, 8 patient) with no horizontal overflow and no page errors (portal-map check).'),
    ('Patient appointments tab in 6 languages (runtime-verified te)', 'Verified 05:13-05:26 IST at 390 px in Telugu: 43 keys per locale cover the tab header, booking modal, slot groups and statuses, upcoming-list cards and actions, and the past-visits card. Bounded flow test (appts_flow_check.cjs): booking via the modal updates the local demo record, the OPD ticket shows the chosen doctor/date/time/mode, the list and count update, the record survives reload (localStorage), cancel closes without changes, and reschedule gives honest demo feedback. No external requests beyond static font fetches - no real scheduling commitment.'),
        ('Patient reports tab in 6 languages (runtime-verified te)', 'Verified 05:27 IST at 390 px in Telugu: 12 keys per locale cover the tab header, upload button and modal, sample-summary audio button and review actions; hear/stop sample labels no longer rely on emoji (drawn speaker icon). Status values such as "Review required" are record data and intentionally left as authored.'),
    ('Patient medications tab in 6 languages (runtime-verified te)', 'Verified 05:31 IST at 390 px in Telugu: 11 keys per locale cover the header, sample-schedule badge, add-manual and Rx-preview buttons, audio preview labels and the interaction-check badge. Medicine names, doses, slot names and clinician instructions stay as website-authored data and were not translated.'),
    ('Patient health goals tab in 6 languages (runtime-verified te)', 'Verified 05:32-05:38 IST at 390 px in Telugu: 65 keys per locale across three passes cover the hero banner, compliance/streak stats, steps, hydration, chronotherapy streak, blood pressure, glucose, sleep, peak-flow, sodium and guided-pranayama cards, including the breathing-phase labels and recommendation notes. Decorative emoji (fire, droplet, moon, herb, zone squares) replaced with drawn icons; a purple "+ 30m Sleep" button repainted to the green palette.'),
('Sample library cross-locale (5 Indic locales)', 'Verified 04:32-04:34 IST: the hypertension sample was opened and its answer verified live in Telugu, Hindi, Tamil, Kannada and Marathi, each ending in the clinician-deferral tail; full-answer scroll screenshots captured for Telugu and Tamil. Earlier same-issue review of all eight samples covered en/te/hi; the deeper cross-locale pass then found te/hi copies still carrying named-drug directives and affirmative claims, and those were neutralized (14 strings). ta/kn/mr sample text is agent-authored and not human-reviewed.'),
    ('Patient home tab in 6 languages (runtime-verified te)', 'Verified 04:21-05:06 IST: greeting, subtitle, synthetic-record banner, four quick cards, vitals labels, reports list, care-team and adherence cards translated via 34 keys per locale and rendered at 390 px in Telugu with zero English leakage in the translated cluster. Decorative emoji that rendered as hollow boxes were replaced with drawn icons (leaf, shield, file, droplet, wind).'),
    ('Doctor dashboard in 6 languages (runtime-verified te)', 'Verified 04:39-05:06 IST: greeting banner, sample-data badges, session/roster chips, Overview/Queue/Analytics pills, scribe call-to-action, four KPI cards and the climate-sentinel card (which had no translation wiring at all) translated via 27 keys per locale and rendered in Telugu. The sentinel advisory is demo copy; no clinician-entered medicine names, doses or instructions were altered by translation.'),
    ('Climate-sentinel card honest ORS action', 'The "add sample ORS line" button adds to the local draft only, and its toast states no price, stock, formulary or dose recommendation is verified.'),
    ('Secrets and permissions scan', 'Scanned 04:09 IST: a pattern-based scan (API-key, token and private-key formats) over the built web bundle and Android assets found no matches; only http: occurrences are FHIR/namespace identifiers, not network calls. This is a pattern scan of the inspected artifacts, not a guarantee that no secret exists anywhere. AndroidManifest permissions limited to INTERNET, RECORD_AUDIO, MODIFY_AUDIO_SETTINGS, CAMERA, ACCESS_FINE/COARSE_LOCATION, POST_NOTIFICATIONS.'),    ('Export paths produce real artifacts', 'Prescription preview generates and downloads a FHIR R4-shaped JSON Bundle (7 entries; the exported bytes were downloaded and parsed in verification). No ABDM profile validator was run: this is structural generation/parsing evidence, not ABDM profile conformance certification; the print button triggers the print path; the PMBJP drug search input filters the formulary (typed query returns matching entries). Verified by intercepting the actual download and inspecting the bytes at 390 px.'),
    ('Input and edit flows commit', 'New Appointment form accepts edited values and submits: a new OPD token (OPD-106) appears in the live queue. Patient AI assistant input sends and receives the honest demo-guidance reply. Verified by scripted tap-through at 390 px.'),
    ('Assistant chat controls reachable above bottom nav', 'Verified 18 Nov, 7:17-7:21 am IST at 390px in Telugu: input and Send are the actual hit-test targets at their centers (elementFromPoint), a full click-type-submit roundtrip returns the honest unavailable-state fallback, and at true bottom scroll the whole control row clears the fixed bottom nav (pixel-verified).'),

]

FIXED = [
    ('Assistant crash on every typed question', 'Before: all typed questions failed. After: answers render and persist.'),
    ('Generated PDF garbage output', 'Before: print produced a 2-page app-plus-modal dump. After: single clean A4 prescription page (verified bytes).'),
    ('19 corrupted bundled WAV headers', 'Before: 0xFFFFFFFF placeholder RIFF/data sizes. After: valid headers, verified against actual downloaded bytes.'),
    ('Silent audio refusal', 'Before: editing note text then exporting silently did nothing. After: visible refusal with explanation.'),
    ('Misleading voice labels', 'Before: "Gnani Neural Voice (working/untested)" and ON labels while audio could not play. After: neutral state-bound labels (untested/unavailable/on).'),
    ('Voice locale conflation', 'Before: assistant UI text followed the voice-language selector, not the app language; app language changes did not translate the assistant. After: chrome follows app UI locale; voice selector is speech-only.'),
    ('Assistant unreachable on portal screens (phone)', 'Before: role quick actions existed on desktop only. After: mounted on portals with working deep links.'),
    ('Cross-locale sample directives survived the first fix', 'Before: after the English samples were neutralized, the Telugu and Hindi copies still named Telmisartan, directed sugar intake, omitted the GINA framing, and asserted generic-equivalence/NABL claims. After: 14 answer strings neutralized across en/te/hi; sample content is selected by the app UI locale (was the voice language), with English fallback.'),
    ('Emoji rendered as hollow boxes', 'Before: leaf, shield, X-ray, blood-drop and lung emoji showed as tofu in the patient home and reports list on headless/low-font devices. After: drawn stroke icons, pixel-verified.'),
    ('Marathi dictionary gap', 'Before: 10 keys missing in mr-IN after a batch edit. Caught by the automated locale-parity check, not by review; fixed and re-verified (dictionary now 348 keys in every locale).'),
    ('Misleading sample prices', 'Before: invented "generic equivalent" prices and savings banners. After: identity-only generic references (exact strength + release form match), no prices shown for unverified figures.'),
    ('Booking modal title invisible', 'Before: the modal h3 rendered dark-teal on a dark-teal header (global h3 color beat inheritance), so the booking modal had no visible title. After: explicit white title, pixel-verified.'),
    ('Booking modal unreachable on phone', 'Before: the fixed bottom tab bar intercepted taps on the modal action row at 390 px, so booking could not be confirmed on a phone viewport. After: the tab bar hides while the booking or ticket modal is open; confirm flow verified end to end.'),
    ('Kannada locale showing Marathi strings', 'Before: 10 patient-home keys were duplicated inside the kn-IN dictionary with Marathi values pasted over the Kannada ones, so Kannada users saw Marathi on the home cards (later duplicate wins in the object). Found by a dictionary duplicate-diff, not by review. After: duplicates removed; all six locales at exactly 488 keys at that checkpoint (667 keys now); a script sweep confirms no cross-script contamination.'),
    ('Purple button and emoji icons in health goals', 'Before: the "+ 30m Sleep" button used purple styling outside the cream/green/saffron palette, and five decorative emoji rendered as hollow boxes on low-font devices. After: green-tinted button matching the palette; drawn stroke icons for streak, droplet, moon and herb; zone chips as plain text.'),
    ('Stale booking dates and live-slot implication', 'Before: date chips were hardcoded "Wed, May 14 / Thu, May 15" in November, and a green "Real-Time OPD Slot Allocation Active" banner implied real scheduling. After: chips derive from the current clock (today/tomorrow/+2/+3, stored and displayed consistently), and the banner is amber-labelled "sample slot grid - local demo booking only; no real hospital slot is held".'),    ('Health goals clinical-sounding claims on fixed demo values', 'Before: the goals cards inferred Normal Sinus Rhythm from a fixed pulse, classified sample values as Normoglycemic/Restorative/safe, stated PEFR normal-bronchodilation and a named-budesonide guideline response, claimed a bronchial-spasm benefit for a breathing exercise, gave a hydration schedule as a recommendation, and framed a sodium figure against the WHO limit as an assessment. After: 17 values rewritten and 8 keys added per locale (all six locales); every fixed record value, computed classification and scripted trend is labelled sample/demo, and the fasting note no longer asserts absence of nocturnal symptoms. 12/12 runtime assertions pass in Telugu at 390 px; clinician-entered values unchanged.'),
    ('Bottom tab bar hid the last card', 'Before: portal pages had only 20 px bottom padding against the fixed 62 px mobile tab bar, so the final card on long tabs (health goals, settings) could not be scrolled fully into view. After: padding raised to 78 px + safe-area inset at <=768 px; real-viewport scroll test shows deepest content (766 px) clearing the bar top (782 px); pixel-verified.'),
    ('Patient settings tab mostly hardcoded English', 'Before: 50 user-facing strings (voice persona/tempo options, dispatch slots, emergency labels, sharing duration, alerts, family locker, offline card, footer actions) stayed English in every locale, and the privacy note used a lock emoji that renders as tofu on low-font devices. After: 50 keys added per locale (dictionary now 569 keys, parity clean, no duplicates); drawn lock icon; runtime-verified in Telugu at 390 px. User-entered data strings intentionally left untranslated.'),
    ('Doctor AI assistant header overclaim', 'Before: the assistant header claimed evidence-based assistance calibrated for ICMR/GINA/WHO ICD-10/NFI and the mode pills claimed clinical-guideline, DDI and DDx checks, while answers are bundled sample references. After: header and pills are sample-labelled to match actual behaviour; per-answer clinician-review disclaimers unchanged.'),    ('Dialect dropdown descriptors English-only', 'Before: the seven dialect options in patient settings kept English descriptors in every locale, with the language name duplicated inside the descriptor. After: descriptors translated in all six locales and the duplicated name stripped; runtime-verified in Telugu (dictionary now 576 keys per locale).'),    ('Doctor queue and analytics hardcoded English', 'Before: the consultation queue roster (title, shift subline, add-token button, fallback complaint) and the outpatient analytics card (title, subline, hourly-density and trend titles, empty-state text, session-logging chip) stayed English in every locale. After: 10 keys per locale (dictionary now 586 keys, parity clean); runtime-verified in Telugu at 390 px with pixel-inspected screenshots. Token status chips (Completed/In Progress/Waiting/Upcoming) are authored record data and intentionally unchanged.'),
    ('Doctor OPD workspace header hardcoded English', 'Before: the OPD workspace KPI strip (queue/upcoming/completed/cohort cards with their value lines and sublines), the three subview tabs (queue/schedules/registry with live counts, full and compact labels), the quick-search placeholder, the token-list heading with clock-derived date and the priority-sort chip stayed English in every locale. After: 21 keys per locale (dictionary now 607 keys, parity clean); 14/14 runtime assertions pass in Telugu at 390 px with pixel-inspected screenshots. The clock-derived date renders via the existing formatter; counts interpolate live.'),
    ('Doctor OPD tab header, offline card and sample chip English', 'Before: the OPD tab header (subtitle, New Appointment button, Today chip), the rural offline-first draft-queue card (status chips, IndexedDB label, title, description, both action buttons) and the shared sample-data chip stayed English in every locale. After: 12 keys per locale (dictionary now 619 keys, parity clean) plus the chip wired to the existing translated label; 7/7 offline-card and 5/5 header runtime assertions pass in Telugu at 390 px, pixel-inspected. Remaining English in this tab: the public-reference-data strip with its live-status states, and queue token-card internals.'),
    ('Public reference-data strip English in all locales', 'Before: the live telemetry badge (Public Reference Data label, AQI labels, live/offline states with latency, NLM and openFDA reference labels, Live/Unavailable/Checking status text) stayed English in every locale, and the component had no translation wiring at all. After: 13 keys per locale (dictionary now 632 keys, parity clean) with the component wired into the shared app language context; 6/6 runtime assertions pass in Telugu at 390 px, pixel-inspected. The service-supplied location label (sample coordinates text) is a data string and intentionally unchanged.'),
    ('Queue token-card internals English and mobile overflow', 'Before: the OPD token cards (Token label, slot chip, chief-complaint line, triage badge, View EHR / Open Console / Start Voice Scribe buttons, and the ABDM badge row labels) stayed English in every locale; the chief-complaint line could interpolate an undefined value, and the vitals-plus-buttons row overflowed the card edge at 390 px with the scribe button clipped. After: 15 keys per locale (dictionary now 647 keys, parity clean) across both components; the complaint falls back to the existing translated general-evaluation string; the action row wraps at phone widths. 10/10 runtime assertions pass in Telugu at 390 px, pixel-inspected. Patient meta (age, gender, language, village) and MEWS sample-labelled score text are authored sample data and intentionally unchanged.'),
    ('Schedule and directory views English', 'Before: the master consultation schedule heading, the Voice Scribe buttons in dashboard/schedule/directory cards, the directory filter chips (All Registered / New This Week / Has Upcoming Visit / High Priority Triage), the showing-count line, the directory chief-complaint line and the directory triage badge stayed English. After: 7 keys per locale (dictionary now 654 keys, parity clean); 10/10 runtime assertions pass in Telugu at 390 px across both views, pixel-inspected. Chief-complaint values stay as authored sample data.'),
    ('Sample-data chips and health ID heading English', 'Before: five shared sample-data chip call sites (four bare, one styled) rendered English in every locale, the patient My Health heading had a hardcoded English tail (Profile & Health ID Card), and the my-health subtitle was untranslated. After: 3 keys per locale (dictionary now 657 keys, parity clean); all five chips wired to translated labels; heading and subtitle fully translated. 8/8 runtime assertions pass in Telugu at 390 px across home, my-health and appointments tabs.'),    ('Synthetic facility identifiers not marked as demo', 'Before: 6 patient records (12 occurrences) carried bare HFR-... facility IDs while the matching ABHA/HPR values were DEMO- prefixed. After: all HFR values DEMO- prefixed across every record; sweep confirms no non-DEMO HFR/HPR/ABHA identifiers remain; clinician-entered names, doses and instructions untouched. Verified at runtime in Telugu (DEMO-HFR-GJ-MSH-0018 visible on the registry card).'),
    ('Computed priority chips read as real triage', 'Before: doctor roster priority chips (Critical/Urgent/Moderate/Stable) on synthetic records had no sample marker. After: chip labels carry sample wording in all 6 locales (e.g. "Critical (sample)"); triage logic values unchanged.'),
    ('Canned assistant reply asserted facility hours', 'Before: the bundled patient-assistant fallback claimed OPD consultations run Monday to Saturday 9:00 AM - 2:00 PM at the local PHC. After: honest demo guidance (no medical advice, no live schedules, confirm timings with the PHC, 112/108 for urgent symptoms).'),
    ('Seeded demo chat not labelled as sample', 'Before: the patient AI Assistant tab opened with a pre-seeded medical Q&A (naming a doctor) with no sample marker. After: SAMPLE DATA chip on the assistant tab header (6th chip site).'),
    ('Seeded assistant chat gave medical advice with fictional doctor', 'Before: the patient AI Assistant opened with a hardcoded English reply directing honey, saline gargles and immediate contact with a fictional Dr Priya; a SAMPLE chip alone did not cure it. After: seeded exchange replaced with honest nonclinical demonstration guidance in all 6 locales (cannot assess symptoms, consult a qualified clinician, 112/108 if severe); a TDZ crash introduced during the fix was caught by the error boundary and fixed.'),
    ('Unverified helpline availability claims', 'Before: emergency banner claimed "104 Health Advice available 24x7" and the Call 108 button fired a fake alert. After: source-grounded text only (112 national emergency / 108 ambulance) in 6 locales; the button now opens the device dialer via tel:108. Owning official sources: 112.gov.in (Emergency Response Support System, Ministry of Home Affairs) and nhm.gov.in Emergency Response / Patient Transport Services (108) - links below.'),
    ('Assistant chat controls untranslated', 'Before: input placeholder, Voice/Listening and Send stayed English on Indic UIs. After: 4 keys per locale; dictionary 665 keys, parity clean.'),
    ('Named fictional doctor persona across fixtures (regression finding)', 'Found by re-verifying the patient Rx print output at 07:44 IST: the printed slip still carried a realistic doctor persona and an unmarked facility, contradicting the earlier bounded identity-cleanup claim. After: the full persona inventory (5-doctor login roster, booking/referral/reviewer/radiologist fallbacks, signup prefill, auth service default, sample-dialogue speaker, voice-persona labels, health-goals fallback) is neutralized to Dr. Demo Clinician A-F (synthetic) / Demo Reviewer / Demo Radiologist across ~30 sites in 25+ files; the real-looking NMC registration number is DEMO-NMC-0000; specialty claims on synthetic identities are demo-marked; the imaging-centre fixture is Demo Imaging Centre (synthetic). Clinician-entered values were not present in these fixtures and nothing user-authored was changed. Runtime-verified in Telugu at 390px (10/10 checks across assistant, appointments, Rx modal, doctor roster).'),
    ('Assistant header/subtitle over-promised capability', 'Before: the patient assistant header was hardcoded English and the subtitle invited symptom/diet/medicine questions the prototype honestly refuses. After: header translated in all 6 locales; subtitle rewritten to honest scope (general questions about appointments, medicine information and clinic visits; cannot assess symptoms or give medical advice; consult a qualified clinician) in all 6 locales. Dictionary now 667 keys per locale, parity clean.'),
    ('Real-brand and unmarked facility names on synthetic records (second regression finding)', 'Found by a broader facility-class sweep of the built bundle at 07:52 IST after the persona fix: synthetic lab/imaging/patient fixtures still carried real or realistic facility identities, including the Apollo brand (4 fixtures), Nizam (2), St. Jude, Gandhi Memorial (2), Kurnool Medical College, MetroPath, a fabricated NTEP certification on a TB centre, 18 generic district/PHC facilities without synthetic markers, a sample report filename naming a real lab chain, two instrument strings attributing to lab chains, and the receptionist offline fallback speaking fabricated OPD token hours for a nonexistent AyuSwar Hospital. After (rev 4, 51 replacements in 7 files): all neutralized to Demo/(synthetic)/(Simulation) forms; real device-model metadata (Siemens, GE, Philips, Sysmex, Bio-Rad, Roche) intentionally left as technical metadata, not affiliation claims. Coverage is a bounded pattern scan over facility-name, doctor-name and spoken-claim classes in source and built bundle - not an all-clean guarantee. Runtime-reverified: regression 7/7, persona sweep 10/10, 98/98 unit checks.'),
    ('Rx slip QR caption claimed a digital certificate', 'Before: the printed slip QR caption read "Encrypted with SHA-256 digital certificate" while the same slip carried a NOT A DIGITAL SIGNATURE marker (SHA-256 is a hash, and no certificate is issued). After: "Synthetic QR token - no digital certificate issued." Verified in the regenerated print PDF (attached to the handover report).'),

]




UNTESTED = [
    ('Native Android runtime', 'The APK is compile-verified only. Install, launch, hardware back button, microphone capture, TTS playback and offline behaviour on a physical phone are all untested.'),
    ('Voice input (microphone)', 'Native speech-recognition plugin and mic permission are packaged but never exercised on a device.'),
    ('Voice output (Gnani TTS)', 'The live TTS path fails through the production proxy (502 at the proxy edge / 404 upstream, observed during tonight\'s runs) despite a verified official endpoint contract; cause under research. Live synthesis playback in-app is therefore unavailable and shown as such; bundled sample WAVs and browser speech are the labelled fallback. Audible playback of any path on a real device is untested.'),
    ('Native export path (Capacitor Filesystem + Share)', 'Implementation compile-verified only; the file write and system share sheet have never executed on a device. Browser export of the same artifacts is verified (see "Browser export paths" in the verified section).'),
    ('Android notifications and runtime permissions', 'POST_NOTIFICATIONS, RECORD_AUDIO, CAMERA and location are declared in the manifest; a Capacitor Local Notifications service with a browser Notification fallback is wired in code. Native permission-request flows and system-notification display have never run on a device. In-app notification drawer entries are synthetic demo content.'),
    ('Adaptive assistant UI (model-generated)', 'Code path complete with strict safety checks and fallbacks. Runtime verification is blocked on backend AI configuration: the live backend status check at 22:20 IST reported Evon unconfigured (EVON_API_KEY / EVON_BASE_URL are read from deployment environment variables per the source config). Whether the current live deployment has been configured since was not re-verified - deployment settings are separate from source config, and inspecting or changing them needs authorized access to the hosting account, which is not granted for this work.'),
    ('Tamil, Kannada, Marathi translation quality', 'All ta/kn/mr strings (including clinical-adjacent demo copy) are agent-authored; no fluent human has reviewed them. Fluency and medical-translation quality are NOT verified.'),
    ('Runtime coverage beyond English/Telugu', 'Most screens are runtime-verified in Telugu (plus English baseline). Hindi/Tamil/Kannada/Marathi have dictionary parity (automated) and the sample-library runtime check, but not full-screen runtime evidence.'),
    ('Offline / airplane-mode matrix', 'Local features have honest internet-needed states, but no systematic offline test matrix has been run.'),
]

PENDING = [
    ('Portal tab internals beyond the dashboards', 'All six patient tabs (home, appointments, reports, medications, health goals, settings), the doctor dashboard overview/queue/analytics pills and the OPD workspace header (KPI strip, subview tabs, search, token-list heading) are now translated and runtime-verified in Telugu (see verified rows). Remaining largely hardcoded English: doctor reports/prescriptions tabs, patient-detail internals, per-tab modals and print paths. Caveat for the translated surfaces: stored record values, clinician-entered content and manual data strings intentionally stay as authored (largely English) - UI chrome translation only. Translation continues; claim stays partial until each surface is runtime-verified.'),
    ('WhatsApp reminder sender', 'No authority to send real WhatsApp messages; compose-only flow stands.'),
    ('Live TTS upstream failure', '502 at the proxy edge / 404 upstream through the production path despite a verified official endpoint contract; cause under research. No production change without owner approval; honest browser fallback in place.'),
    ('Sign-up screen (material product gap)', 'CORRECTED 08:00 IST after route inspection: the earlier absence claim was false. Sign-up IS reachable in the app: the /auth screen has a login/sign-up toggle opening a 3-step guided sign-up with synthetic demo prefill and demo OTP autofill, walkable end-to-end; completing it lands on the demo portal. No account is persisted anywhere (the view makes no network calls and writes nothing to storage; no backend is configured). So the gap is: no real account creation/persistence, not absence of the flow. Extending it into a local-only demo-profile creation screen stays pending owner decision.'),
    ('Rx print view shows on-screen controls', 'The printable Rx view renders its print/download controls at the top of the sheet in the generated PDF. It is a printable view, not a clean print-only document. Presentation limitation logged; document content below the controls is correct and synthetic-marked.'),
    ('Automatic medication reminders', 'No automatic reminder dispatch exists: WhatsApp reminders are compose-only with no send authority; local scheduled-notification code exists but is untested on device. All reminder content in the app is synthetic demo copy.'),
]

LIMITS = [
    ('Prototype with synthetic data', 'No real patient records, no real ambulance dispatch, no clinical advice. Disclaimers stay visible.'),
    ('No physical device available', 'All "verified" marks mean browser preview at phone size unless explicitly stated otherwise.'),
    ('Gnani STT status inconsistent across runs', 'Passed a live browser check at 22:42 IST (HTTP 200 returning the exact synthetic sentence via a mock-microphone fixture - explicitly not Android proof), but the same live call was blocked in the 23:24-23:32 IST regression rerun. Latest observed state is blocked; native on-device speech recognition is packaged as the fallback, device test pending.'),
]

def build(path):
    doc = Document()
    setup(doc)

    # Cover / first page
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run('AyuSwar Mobile App'); r.bold = True; r.font.size = Pt(24)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run('Handover Audit Report - Android Build (handover build for the 08:00-09:00 IST window; bounded coverage, not a full product audit)'); r.font.size = Pt(14)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run(GENERATED); r.font.size = Pt(10); r.font.color.rgb = GRAY
    hr(doc.add_paragraph())

    doc.add_heading('Summary', level=2)
    stats = [
        ('Checks verified working (browser preview at phone size)', str(len(VERIFIED))),
        ('Defects found and fixed this cycle', str(len(FIXED))),
        ('Built but untested areas', str(len(UNTESTED))),
        ('Pending work items', str(len(PENDING))),
        ('Automated test suite', '98 passed, 2 conditional skips, 0 failed'),
    ]
    table = doc.add_table(rows=0, cols=2)
    table.style = 'Table Grid'; table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for k, v in stats:
        row = table.add_row()
        row.cells[0].text = k; row.cells[1].text = v
        row.cells[1].paragraphs[0].runs[0].bold = True

    doc.add_paragraph()
    doc.add_heading('Build artifact under audit', level=2)
    item(doc, 'APK', '%s, %s, built %s. SHA-256: %s' % (APK['file'], APK['size'], APK['built'], APK['sha256']))
    p = doc.add_paragraph(APK['note']); p.runs[0].italic = True

    doc.add_heading('Links', level=2)
    for name, url in LINKS.items():
        p = doc.add_paragraph()
        p.add_run('%s: ' % name).bold = True
        add_hyperlink(p, url, url)

    doc.add_heading('Preview', level=2)
    previews = [
        ('/tmp/shots/patient_home_te_0506.png', 'Patient home, Telugu (icons fixed)'),
        ('/tmp/shots/sample_te_bottom_0426.png', 'Telugu sample answer, scrolled full text'),
        ('/tmp/shots/sentinel_te_0446.png', 'Doctor dashboard sentinel, Telugu'),
    ]
    table = doc.add_table(rows=2, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, (img, cap) in enumerate(previews):
        cell = table.cell(0, i)
        if os.path.exists(img):
            cell.paragraphs[0].add_run().add_picture(img, width=Cm(3.4))
        cap_p = table.cell(1, i).paragraphs[0]
        cap_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = cap_p.add_run(cap); r.font.size = Pt(8); r.font.color.rgb = GRAY

    doc.add_page_break()
    h1(doc, '1. Method and what "tested" means')
    doc.add_paragraph('The checks listed in this report are bounded coverage of the areas named, not proof that the entire product was exercised. Verification was done in a browser preview at 390 px phone size with scripted tap-throughs and pixel-inspected screenshots; generated artifacts (PDF, WAV) were verified by downloading and inspecting the actual output bytes, not only the button that produces them. The automated suite (98 checks) ran green at 05:05 IST. No physical Android device was available, so native runtime behaviour is reported as untested rather than assumed. Physical-device and on-screen-keyboard behaviour (focus retention, keyboard overlap, IME scrolling) is untested and distinct from the browser click/scroll/hit-test evidence cited in this report.')
    doc.add_paragraph('All timestamps are observed times (IST) recorded from the build log and file metadata.')
    doc.add_paragraph('Integrity note: an interim report during the cycle claimed the eight-sample review complete; a deeper cross-locale check afterwards found the Telugu and Hindi copies still carried directives. This report reflects the deeper findings and the actual checks run, not the earlier interim claim. No aggregate quality score is given: the counts above are check counts, not a rating.')

    h1(doc, '2. Verified working')
    for name, detail in VERIFIED:
        item(doc, name, detail, 'pass')

    h1(doc, '3. Defects found and fixed this cycle')
    for name, detail in FIXED:
        item(doc, name, detail, 'fixed')

    h1(doc, '4. Built but not yet tested')
    for name, detail in UNTESTED:
        item(doc, name, detail, 'built')

    h1(doc, '5. Pending work')
    for name, detail in PENDING:
        item(doc, name, detail, 'pending')

    h1(doc, '6. Standing limits')
    for name, detail in LIMITS:
        item(doc, name, detail, 'limit')

    h1(doc, '7. Reproduction')
    doc.add_paragraph('Build: npm run build, then Gradle assembleDebug (ANDROID_HOME and JDK 21 inline). Tests: npm test. Verification scripts live under the project root (*.cjs Playwright checks) and their names are recorded per finding in the live checklist File linked on page 1.')
    doc.add_paragraph('This report describes a synthetic-data prototype. Nothing in it is a medical claim, a certification, or a statement of clinical fitness.')

    doc.save(path)
    print('saved', path)

if __name__ == '__main__':
    build('/downloads/AyuSwar-mobile-audit.docx')
