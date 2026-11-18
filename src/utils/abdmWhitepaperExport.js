/**
 * Prototype integration-status export.
 *
 * This document deliberately reports implementation status instead of presenting
 * certification, official approval, clinical readiness, or live external delivery.
 */

export function generateAbdmWhitepaperText() {
  const now = new Date().toISOString();
  return `AYUSWAR AI - PROTOTYPE INTEGRATION STATUS
Generated: ${now}

SCOPE
This is a synthetic-data software prototype status report. It is not a compliance
certificate, government approval, clinical validation, signed prescription, or
proof of connection to any external health registry.

CURRENT STATUS
- Demo clinician and patient identities: synthetic only.
- External health registry connection: not connected in this build.
- PKI / digital signing credential: not connected in this build.
- Structured export: local research-format draft only; it must not be presented
  as a validated exchange document or official prescription.
- WhatsApp, SMS, and IVR dispatch: not connected in this build.
- Speech services: availability is tested separately; failure states must remain
  visible and must not be replaced with fabricated audio or text.
- Offline storage: local prototype storage only; remote sync requires separate
  setup, credentials, review, and approval.
- Medication and price examples: bundled synthetic examples only; they are not
  current prices, stock, substitutions, or dispensing advice.
- Acoustic analysis: research signal outputs only; no diagnosis or disease
  likelihood is claimed.

REQUIRED BEFORE PRODUCTION USE
1. Verified owner-approved credentials and deployment configuration.
2. Security, privacy, consent, retention, and audit review.
3. Source-of-truth verification for every external integration.
4. Clinical safety and regulatory review by qualified stakeholders.
5. Device testing on supported Android hardware and OS versions.
6. Clear separation of demo data from real patient data.

SIGN-OFF
No authorized sign-off is claimed by this generated report.`;
}

export function downloadAbdmWhitepaper() {
  const content = generateAbdmWhitepaperText();
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'AyuSwar_AI_prototype_integration_status.txt';
  a.click();
  URL.revokeObjectURL(url);
}

export function printAbdmDossier() {
  const content = generateAbdmWhitepaperText();
  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) {
    downloadAbdmWhitepaper();
    return;
  }
  const escapeHtml = value => value.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  printWindow.document.write(`<!DOCTYPE html><html><head><title>AyuSwar AI - Prototype Integration Status</title><style>@page{size:A4 portrait;margin:15mm}body{font-family:Inter,Arial,sans-serif;color:#081C24;margin:0;padding:24px;font-size:13px;line-height:1.55}pre{white-space:pre-wrap;font:inherit;border-left:3px solid #0F4C5C;padding-left:16px}.title{font-size:20px;font-weight:900;color:#0F4C5C;margin:0 0 8px}.notice{background:#FFF7ED;border:1px solid #FDBA74;border-radius:8px;padding:10px 12px;margin:14px 0;font-weight:700}</style></head><body><h1 class="title">AyuSwar AI - Prototype Integration Status</h1><div class="notice">Synthetic prototype report. No certification, official approval, clinical readiness, live registry connection, signing credential, or external dispatch is claimed.</div><pre>${escapeHtml(content)}</pre></body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
