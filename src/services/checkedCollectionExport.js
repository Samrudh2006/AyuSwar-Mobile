// The only transport boundary used by the two current FHIR collection actions.
// Validation and serialization happen before any file/cache/share operation.
import { exportTextFile } from './exportFileService.js';
import { checkExportIntegrity, integrityFailureMessage } from '../utils/exportIntegrity.js';

export async function exportCheckedCollection({ bundle, kind, filename, shareTitle }, writeFile = exportTextFile) {
  const result = checkExportIntegrity(bundle, kind);
  if (!result.ok) return { mode: 'blocked', errors: result.errors, message: integrityFailureMessage(result) };
  return writeFile({ filename, shareTitle, text: JSON.stringify(bundle, null, 2) });
}
