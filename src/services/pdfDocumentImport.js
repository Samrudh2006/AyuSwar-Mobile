// pdfDocumentImport - bounded local PDF text import (approved integration slice).
// Rules (handoff):
//  - Lazy-load the pdf.js worker only when a PDF is actually imported.
//  - Cap file size and page count. No PDF scripts (isEvalSupported false), no URL fetch.
//  - Extracted text is UNVERIFIED document text, not OCR output and never a
//    medicine identity. Provenance is carried with every page.
//  - Cancel destroys the loading task and worker; nothing persists.

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_PAGES = 20;

import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let pdfjsPromise = null;
const loadPdfjs = () => {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      return pdfjs;
    });
  }
  return pdfjsPromise;
};

// Returns { ok, fileName, pageCount, pages: [{page, text}], truncated }
// or { ok: false, kind: 'oversize'|'not-pdf'|'password'|'corrupt'|'no-text' }.
// Cancellation is caller-side: the caller destroys the loading task and drops state.
export async function importPdfText(file, { onProgress } = {}) {
  if (!file || file.type !== 'application/pdf') return { ok: false, kind: 'not-pdf' };
  if (file.size > MAX_BYTES) return { ok: false, kind: 'oversize' };

  const pdfjs = await loadPdfjs();
  const data = await file.arrayBuffer();
  const task = pdfjs.getDocument({ data, isEvalSupported: false, disableAutoFetch: true, disableStream: true });
  let doc;
  try {
    doc = await task.promise;
  } catch (err) {
    const name = err?.name || '';
    if (name === 'PasswordException') return { ok: false, kind: 'password' };
    return { ok: false, kind: 'corrupt' };
  }

  const pageCount = doc.numPages;
  const pagesToRead = Math.min(pageCount, MAX_PAGES);
  const pages = [];
  let totalChars = 0;
  try {
    for (let i = 1; i <= pagesToRead; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map(it => ('str' in it ? it.str : '')).join(' ').replace(/\s+/g, ' ').trim();
      pages.push({ page: i, text });
      totalChars += text.length;
      onProgress?.(i, pagesToRead);
    }
  } catch {
    await task.destroy().catch(() => {});
    return { ok: false, kind: 'corrupt' };
  }
  await task.destroy().catch(() => {});

  if (totalChars < 3) return { ok: false, kind: 'no-text', pageCount };
  return { ok: true, fileName: file.name, pageCount, pages, truncated: pageCount > pagesToRead };
}
