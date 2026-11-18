/**
 * AyuSwar AI — source-checked research and technical reference repository.
 * Entries below are real external publications or documentation located during
 * the mobile-build audit. They inform design only; they do not certify AyuSwar,
 * validate clinical output, or imply endorsement by their publishers.
 */
const reference = (id, title, authors, journal, doi, sourceUrl, coreInsight, recommendationForAyuSwar, appliedInProject) => ({
  id,
  title,
  authors,
  journal,
  doi,
  citationCount: 'Source checked during audit',
  sourceUrl,
  coreInsight,
  recommendationForAyuSwar,
  appliedInProject
});

export const TOP_RESEARCH_DOMAINS = [
  {
    domain: 'Ambient documentation and clinician review',
    topVenues: 'NEJM Catalyst',
    papers: [
      reference(
        'ref_ambient_scribes_2024',
        'Ambient Artificial Intelligence Scribes to Alleviate the Burden of Clinical Documentation',
        'Tierney et al.',
        'NEJM Catalyst (2024)',
        '10.1056/CAT.23.0404',
        'https://catalyst.nejm.org/doi/full/10.1056/CAT.23.0404',
        'The paper discusses ambient AI scribes as a way to reduce clinical documentation burden.',
        'Keep AI output editable and clinician-reviewed; do not present a draft as a diagnosis or prescription.',
        'ClinicalConsole and LiveScribeSessionModal use draft-first documentation and explicit review states.'
      )
    ]
  },
  {
    domain: 'Indic speech technology',
    topVenues: 'Interspeech / AI4Bharat',
    papers: [
      reference(
        'ref_vistaar_2023',
        'Vistaar: Diverse Benchmarks and Training Sets for Indian Language ASR',
        'Bhogale et al. (AI4Bharat)',
        'Interspeech (2023)',
        '10.21437/Interspeech.2023-2589',
        'https://www.isca-archive.org/interspeech_2023/bhogale23_interspeech.html',
        'The work provides diverse Indian-language ASR benchmarks and training resources.',
        'Treat multilingual transcription quality as service- and microphone-dependent; show honest failure states.',
        'Gnani/Groq transcription boundaries, language selectors, and local recording diagnostics.'
      )
    ]
  },
  {
    domain: 'Digital health safety and governance',
    topVenues: 'WHO guideline',
    papers: [
      reference(
        'ref_who_digital_2019',
        'Recommendations on Digital Interventions for Health System Strengthening',
        'World Health Organization',
        'WHO guideline (2019)',
        'ISBN 9789241550505',
        'https://www.who.int/publications/i/item/9789241550505',
        'WHO frames digital health interventions as health-system tools requiring appropriate governance and implementation context.',
        'Keep emergency, clinical, and sharing claims limited to implemented and verified behavior.',
        'Prototype disclaimers, sample-only emergency labels, and honest service-status surfaces.'
      )
    ]
  },
  {
    domain: 'Interoperability and public technical references',
    topVenues: 'ABDM, NLM, openFDA documentation',
    papers: [
      reference(
        'ref_abdm_fhir_ig',
        'FHIR Implementation Guide for ABDM',
        'National Health Authority / ABDM documentation',
        'ABDM FHIR R4 Implementation Guide v6.5.0',
        'Implementation guide URL',
        'https://www.nrces.in/ndhm/fhir/r4',
        'The guide defines ABDM FHIR R4 profiles and artifacts for health-record exchange.',
        'A local JSON export may be FHIR-shaped, but it must not claim ABDM validation or registry synchronization.',
        'ClinicalConsole and PatientPortal label downloads as local research drafts.'
      ),
      reference(
        'ref_nlm_clinical_tables',
        'NLM Clinical Tables ICD-10-CM API Documentation',
        'US National Library of Medicine',
        'Public API documentation',
        'API documentation URL',
        'https://clinicaltables.nlm.nih.gov/apidoc/icd10cm/v3/doc.html',
        'The public API returns ICD-10-CM terminology search results.',
        'Use returned codes as reference candidates only; clinician review is still required.',
        'LiveTelemetryBadge and DoctorClinicalLibraryTab use a synthetic asthma lookup and display live/unavailable status.'
      ),
      reference(
        'ref_openfda_label_api',
        'openFDA Drug Label API Documentation',
        'US Food and Drug Administration openFDA',
        'Public API documentation',
        'API documentation URL',
        'https://open.fda.gov/apis/drug/label/',
        'openFDA provides drug-label data and warns that results are unvalidated and should not guide medical care.',
        'Display live/unavailable status and avoid patient-specific medication-safety claims.',
        'LiveTelemetryBadge uses a synthetic metformin lookup and labels it as reference data.'
      )
    ]
  }
];
