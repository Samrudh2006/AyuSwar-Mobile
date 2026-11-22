# System architecture

Authoritative document: [docs/CLINICAL_EVIDENCE_ENGINE.md](../../docs/CLINICAL_EVIDENCE_ENGINE.md).

Summary: React/Vite mobile web app wrapped by Capacitor for Android; OPD scribe
and evidence engine run client-side; model calls are optional and every model
output passes through deterministic verification before any draft section uses
it. Objective/assessment/plan sections never consume model text.
