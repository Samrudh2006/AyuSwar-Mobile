// pdfImportGuards - pure gates for the bounded local PDF text import.
// Kept free of pdfjs/Vite imports so the same checks the browser enforces
// also run under plain Node in the test suite.

export const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_PAGES = 20;

// Returns null when the file may proceed, or the specific rejection kind.
export function guardPdfFile(file) {
  if (!file || file.type !== 'application/pdf') return 'not-pdf';
  if (file.size > MAX_BYTES) return 'oversize';
  return null;
}

// How many pages of a document may be imported, and whether that is partial.
export function planExtraction(pageCount) {
  const pagesToRead = Math.min(pageCount, MAX_PAGES);
  return { pagesToRead, truncated: pageCount > pagesToRead };
}
