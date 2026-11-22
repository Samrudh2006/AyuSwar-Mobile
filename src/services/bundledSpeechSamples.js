// Bundled sample recordings are bound to their exact canonical scripts.
// A bundled WAV may only play when the requested text matches its canonical
// script exactly (whitespace-normalized); keyword-only matching is not enough,
// so edited or patient-specific text can never trigger a packaged recording.
const BUNDLED_SAMPLE_BINDINGS = [
  {
    url: '/audio/gnani_telugu_rx_narayana_rao.wav',
    langCode: 'te-IN',
    canonical: 'నారాయణ రావు గారు, వినండి: ఈ ఆకుపచ్చ రంగు మాత్ర ఉదయం టిఫిన్ తర్వాత ఒకటి వేసుకోవాలి. ఈ నీలం రంగు మాత్ర రాత్రి భోజనం తర్వాత ఒకటి వేసుకోవాలి. కూరల్లో ఉప్పు బాగా తగ్గించండి.'
  },
  {
    url: '/audio/gnani_hindi_rx_aarav_kumar.wav',
    langCode: 'hi-IN',
    canonical: 'आरव की माता जी, ध्यान से सुनें: यह पीला सिरप रोज सुबह 5ml देना है, 3 दिन तक। और यह लाल सिरप सिर्फ तब देना है जब बुखार आए। बच्चे को गुनगुने पानी की पट्टी दें।'
  }
];
const normalizeForSampleMatch = (value) => (value || '').replace(/\s+/g, ' ').trim();


// Omit langCode only for the existing speech-service fallback, which detects
// language from the sanitized script. Downloads must also match the UI language.
export function getBoundSampleAudioUrl(text, langCode) {
  if (typeof text !== 'string') return null;
  const requested = normalizeForSampleMatch(text);
  const binding = BUNDLED_SAMPLE_BINDINGS.find(b =>
    normalizeForSampleMatch(b.canonical) === requested &&
    (langCode === undefined || b.langCode === langCode));
  return binding?.url || null;
}
