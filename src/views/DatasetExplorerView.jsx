import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Database, 
  Search, 
  BookOpen, 
  Languages, 
  ChevronLeft, 
  Volume2, 
  Info,
  CheckCircle2,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { 
  CLINICAL_DISEASE_DATASET, 
  REGIONAL_COLLOQUIAL_DICTIONARY,
  predictClinicalDiagnosis 
} from '../data/kaggleClinicalDataset';
import { TOP_RESEARCH_DOMAINS } from '../data/researchPapersRepository';
import { useApp } from '../context/AppContext';

export default function DatasetExplorerView() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState('dictionary'); // 'dictionary' | 'diseases' | 'matcher' | 'papers'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');

  // Self-contained browser speech synthesis
  const playSpeech = (text, lang = 'te-IN') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.88;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
    }
  };
  
  // Matcher state
  const [symptomInput, setSymptomInput] = useState('తీవ్రమైన ఆయాసం, రాత్రి వేళ పొడి దగ్గు మరియు పీకల్లో పిల్లికూతలు');
  const [matchResult, setMatchResult] = useState(() => predictClinicalDiagnosis('తీవ్రమైన ఆయాసం, రాత్రి వేళ పొడి దగ్గు మరియు పీకల్లో పిల్లికూతలు'));

  const categories = ['All', 'Pulmonology', 'Cardiology', 'Infectious', 'Gastroenterology', 'Neurology', 'Orthopedics', 'Dermatology'];
  const languages = ['All', 'Telugu', 'Hindi', 'Kannada', 'Tamil', 'Marathi', 'Bengali', 'Code-Mixed'];

  const getLanguageTheme = (lang) => {
    switch (lang) {
      case 'Telugu':
        return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD', label: 'తెలుగు • Telugu' };
      case 'Hindi':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', label: 'हिंदी • Hindi' };
      case 'Kannada':
        return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0', label: 'ಕನ್ನಡ • Kannada' };
      case 'Tamil':
        return { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE', label: 'தமிழ் • Tamil' };
      case 'Marathi':
        return { bg: '#F3E8FF', text: '#6B21A8', border: '#E9D5FF', label: 'मराठी • Marathi' };
      case 'Bengali':
        return { bg: '#FFE4E6', text: '#9F1239', border: '#FECDD3', label: 'বাংলা • Bengali' };
      case 'Code-Mixed':
      default:
        return { bg: '#ECFEFF', text: '#0E7490', border: '#CFFAFE', label: 'Code-Mixed / Hinglish' };
    }
  };

  const getSeverityTheme = (sev) => {
    if (sev === 'Emergency Alert') return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };
    if (sev === 'Urgent') return { bg: '#FFEDD5', text: '#9A3412', border: '#FED7AA' };
    return { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' };
  };

  // Normalize REGIONAL_COLLOQUIAL_DICTIONARY object into an array of clinical terms
  const colloquialDictionaryList = React.useMemo(() => {
    if (!REGIONAL_COLLOQUIAL_DICTIONARY || typeof REGIONAL_COLLOQUIAL_DICTIONARY !== 'object') {
      return [];
    }
    return Object.entries(REGIONAL_COLLOQUIAL_DICTIONARY).map(([term, data]) => {
      let lang = data.language;
      if (!lang) {
        if (/[\u0C00-\u0C7F]/.test(term)) lang = 'Telugu';
        else if (/[\u0C80-\u0CFF]/.test(term)) lang = 'Kannada';
        else if (/[\u0B80-\u0BFF]/.test(term)) lang = 'Tamil';
        else if (/[\u0980-\u09FF]/.test(term)) lang = 'Bengali';
        else if (/[\u0900-\u097F]/.test(term)) lang = 'Hindi';
        else lang = 'Code-Mixed';
      }

      let region = data.region;
      if (!region) {
        if (lang === 'Telugu') region = 'Rayalaseema / Coastal AP';
        else if (lang === 'Kannada') region = 'Mysuru / Karnataka';
        else if (lang === 'Tamil') region = 'Madurai / Kongu';
        else if (lang === 'Bengali') region = 'Kolkata / Sundarbans';
        else if (lang === 'Marathi') region = 'Vidarbha / Maharashtra';
        else if (lang === 'Hindi') region = 'North India / Rural Belt';
        else region = 'Casualty OPD Dialect';
      }

      let speechLocale = 'en-IN';
      if (lang === 'Telugu') speechLocale = 'te-IN';
      else if (lang === 'Hindi') speechLocale = 'hi-IN';
      else if (lang === 'Kannada') speechLocale = 'kn-IN';
      else if (lang === 'Tamil') speechLocale = 'ta-IN';
      else if (lang === 'Marathi') speechLocale = 'mr-IN';
      else if (lang === 'Bengali') speechLocale = 'bn-IN';

      return {
        term,
        standardClinicalTerm: data.concept || 'Clinical Symptom',
        code: data.code || 'R69',
        snomed: data.snomed || '386053000',
        category: data.category || 'General',
        severity: data.severity || 'Routine',
        meaning: `${data.concept || term} (ICD-10: ${data.code || 'Unspecified'} • SNOMED: ${data.snomed || '386053000'})`,
        language: lang,
        region,
        speechLocale
      };
    });
  }, []);

  const languageCounts = React.useMemo(() => {
    const counts = { All: colloquialDictionaryList.length };
    languages.forEach(l => {
      if (l !== 'All') {
        counts[l] = colloquialDictionaryList.filter(item => item.language.toLowerCase() === l.toLowerCase()).length;
      }
    });
    return counts;
  }, [colloquialDictionaryList]);

  const filteredDiseases = CLINICAL_DISEASE_DATASET.filter(d => {
    const matchesCategory = selectedCategory === 'All' || d.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = !searchQuery || 
      d.diseaseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.icd10.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.teluguName && d.teluguName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.hindiName && d.hindiName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.kannadaName && d.kannadaName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.tamilName && d.tamilName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const filteredDictionary = colloquialDictionaryList.filter(item => {
    const matchesLang = selectedLanguage === 'All' || item.language.toLowerCase() === selectedLanguage.toLowerCase();
    if (!matchesLang) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.term.toLowerCase().includes(q) ||
      item.standardClinicalTerm.toLowerCase().includes(q) ||
      (item.meaning && item.meaning.toLowerCase().includes(q)) ||
      (item.region && item.region.toLowerCase().includes(q)) ||
      (item.code && item.code.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q));
  });

  const handleTestMatch = () => {
    const res = predictClinicalDiagnosis(symptomInput);
    setMatchResult(res);
  };

  const applySampleSymptom = (text) => {
    setSymptomInput(text);
    const res = predictClinicalDiagnosis(text);
    setMatchResult(res);
  };

  return (
    <div className="dataset-explorer-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ marginBottom: 20 }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-navy-700)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
          <ChevronLeft size={16} /> Return to Home
        </Link>
      </div>

      {/* Research Header Banner */}
      <div style={{ background: '#FAF8F5', border: '1px solid #D0DFE2', borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 4px 18px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#0F4C5C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, boxShadow: '0 6px 14px rgba(14, 116, 144, 0.3)' }}>
            <Database size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <h1 className="page-main-heading" style={{ margin: 0, fontSize: '1.5rem', color: '#091E26', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Pan-Indic Clinical Knowledge, Lexicon & Research Corpora
              </h1>
              <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '3px 9px', borderRadius: 999, fontWeight: 700, border: '1px solid #bae6fd' }}>
                Synthetic research sample
              </span>
              <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#166534', padding: '3px 9px', borderRadius: 999, fontWeight: 700, border: '1px solid #bbf7d0' }}>
                Rule-based demo matching
              </span>
              <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', padding: '3px 9px', borderRadius: 999, fontWeight: 700, border: '1px solid #fde68a' }}>
                ICD-10 • SNOMED CT concepts • sample formulary
              </span>
            </div>

            <p className="page-main-subtext" style={{ margin: '0 0 14px 0', color: '#2E4753', fontSize: '0.925rem', lineHeight: 1.55 }}>
              AyuSwar synthetic Indic speech and symptom-mapping sample. It includes bundled colloquial symptom examples across six Indian languages, mapped by deterministic rules to ICD-10/SNOMED CT reference concepts and sample generic-drug labels. No ICMR, WHO, ABDM, IndiaAI, or MeitY endorsement is claimed.
            </p>

            {/* Live Research Metrics Strip */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 6, borderTop: '1px solid #E2E8F0' }}>
              <div style={{ background: '#fff', border: '1px solid #D0DFE2', borderRadius: 8, padding: '6px 12px', fontSize: '0.8rem', color: '#2C4A52', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Languages size={14} color="#0e7490" />
                <span><strong>70</strong> vernacular colloquial mappings (6 languages)</span>
              </div>
              <div style={{ background: '#fff', border: '1px solid #D0DFE2', borderRadius: 8, padding: '6px 12px', fontSize: '0.8rem', color: '#2C4A52', display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={14} color="#0e7490" />
                <span><strong>22</strong> condition reference records (ICD-10/SNOMED)</span>
              </div>
              <div style={{ background: '#fff', border: '1px solid #D0DFE2', borderRadius: 8, padding: '6px 12px', fontSize: '0.8rem', color: '#2C4A52', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={14} color="#10B981" />
                <span>Rule-based sample matching (not a diagnosis)</span>
              </div>
              <div style={{ background: '#fff', border: '1px solid #D0DFE2', borderRadius: 8, padding: '6px 12px', fontSize: '0.8rem', color: '#2C4A52', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Volume2 size={14} color="#0e7490" />
                <span>Optional local speech playback</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dataset-tabs-row" style={{ display: 'flex', gap: 8, borderBottom: '2px solid #D0DFE2', marginBottom: 20, overflowX: 'auto', paddingBottom: 2 }}>
        <button
          onClick={() => setActiveTab('dictionary')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'dictionary' ? '2px solid #0e7490' : '2px solid transparent',
            marginBottom: -2,
            background: 'none',
            color: activeTab === 'dictionary' ? '#155E75' : '#2E4753',
            fontWeight: activeTab === 'dictionary' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.9rem'
          }}
        >
          <Languages size={16} />
          <span>Vernacular Lexicon ({colloquialDictionaryList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('diseases')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'diseases' ? '2px solid #0e7490' : '2px solid transparent',
            marginBottom: -2,
            background: 'none',
            color: activeTab === 'diseases' ? '#155E75' : '#2E4753',
            fontWeight: activeTab === 'diseases' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.9rem'
          }}
        >
          <BookOpen size={16} />
          <span>ICD-10 Disease Reference ({CLINICAL_DISEASE_DATASET.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matcher')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'matcher' ? '2px solid #0e7490' : '2px solid transparent',
            marginBottom: -2,
            background: 'none',
            color: activeTab === 'matcher' ? '#155E75' : '#2E4753',
            fontWeight: activeTab === 'matcher' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.9rem'
          }}
        >
          <Search size={16} />
          <span>Symptom Term Matcher (Non-Diagnostic)</span>
        </button>

        <button
          onClick={() => setActiveTab('papers')}
          style={{
            padding: '10px 18px',
            border: 'none',
            borderBottom: activeTab === 'papers' ? '2px solid #0e7490' : '2px solid transparent',
            marginBottom: -2,
            background: 'none',
            color: activeTab === 'papers' ? '#155E75' : '#2E4753',
            fontWeight: activeTab === 'papers' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.9rem'
          }}
        >
          <FileText size={16} />
          <span>Literature References</span>
        </button>
      </div>

      {/* Tab 1: Colloquial Dictionary */}
      {activeTab === 'dictionary' && (
        <div>
          {/* Pan-Indic Language Filter Bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2E4753', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Filter by Indic Language & Script:
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {languages.map((lang) => {
                const count = languageCounts[lang] || 0;
                const isSelected = selectedLanguage === lang;
                const theme = getLanguageTheme(lang);
                return (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: isSelected ? '1.5px solid #0e7490' : '1px solid #D0DFE2',
                      background: isSelected ? '#0e7490' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#2C4A52',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease'
                    }}
                  >
 <span>{lang === 'All'? 'All Languages': theme.label}</span>
                    <span style={{
                      fontSize: '0.725rem',
                      background: isSelected ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#64748B',
                      padding: '1px 6px',
                      borderRadius: 999,
                      fontWeight: 700
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Box */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Search vernacular phrases across Telugu, Hindi, Kannada, Tamil, Marathi, Bengali (e.g. పిల్లికూతలు, छाती में भारीपन, ಉಸಿರಾಟದ ತೊಂದರೆ, மூச்சுத் திணறல்)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 16px',
                border: '1.5px solid #D0DFE2',
                borderRadius: 8,
                fontSize: '0.9rem',
                outline: 'none',
                background: '#FFFFFF',
                color: '#091E26'
              }}
            />
          </div>

          {/* Cards Grid */}
          <div className="dataset-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 14 }}>
            {filteredDictionary.map((item, idx) => {
              const langTheme = getLanguageTheme(item.language);
              const sevTheme = getSeverityTheme(item.severity);
              return (
                <div key={idx} style={{ background: '#fff', border: '1px solid #D0DFE2', borderRadius: 12, padding: 18, minWidth: 0, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                  <div>
                    {/* Language & Severity Badges Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                      <span style={{
                        fontSize: '0.725rem',
                        background: langTheme.bg,
                        color: langTheme.text,
                        border: `1px solid ${langTheme.border}`,
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {item.language} • {item.region}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        background: sevTheme.bg,
                        color: sevTheme.text,
                        border: `1px solid ${sevTheme.border}`,
                        padding: '2px 7px',
                        borderRadius: 6,
                        fontWeight: 800,
                        letterSpacing: '0.3px',
                        textTransform: 'uppercase',
                        flexShrink: 0
                      }}>
                        {item.severity}
                      </span>
                    </div>

                    {/* Native Script Colloquial Term */}
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#091E26', marginBottom: 6, overflowWrap: 'break-word', letterSpacing: '-0.01em' }}>
                      {item.term}
                    </div>

                    {/* Standard Clinical Term */}
                    <div style={{ fontSize: '0.875rem', color: '#0e7490', fontWeight: 700, marginBottom: 8, overflowWrap: 'break-word' }}>
                      → {item.standardClinicalTerm}
                    </div>

                    {/* Coding Badges: ICD-10 & SNOMED CT */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      <span style={{ fontSize: '0.725rem', background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                        ICD-10: {item.code}
                      </span>
                      <span style={{ fontSize: '0.725rem', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                        SNOMED: {item.snomed}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.45, marginBottom: 12 }}>
                      <strong>Category:</strong> {item.category}
                    </div>
                  </div>

                  {/* Audio Pronunciation Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                    <button
                      onClick={() => playSpeech(item.term, item.speechLocale)}
                      title={`Pronounce in ${item.language}`}
                      style={{
                        border: '1px solid #D0DFE2',
                        background: '#FAF8F5',
                        borderRadius: 6,
                        padding: '5px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: '0.775rem',
                        fontWeight: 600,
                        color: '#0e7490'
                      }}
                    >
                      <Volume2 size={13} />
                      <span>Hear {item.language}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Disease Reference */}
      {activeTab === 'diseases' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search diseases or ICD-10 codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: '1 1 200px',
                minWidth: 0,
                padding: '10px 14px',
                border: '1px solid #D0DFE2',
                borderRadius: 8,
                fontSize: '0.9rem'
              }}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                flex: '0 1 160px',
                padding: '10px 14px',
                border: '1px solid #D0DFE2',
                borderRadius: 8,
                fontSize: '0.9rem',
                background: '#fff'
              }}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="dataset-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 14 }}>
            {filteredDiseases.map((d, idx) => (
              <div key={idx} style={{ background: '#fff', border: '1px solid #D0DFE2', borderRadius: 10, padding: 16, minWidth: 0, boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#091E26', minWidth: 0, overflowWrap: 'break-word' }}>
                    {d.diseaseName}
                  </div>
                  <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4, fontWeight: 700, flexShrink: 0 }}>
                    {d.icd10}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#698892', marginBottom: 8 }}>
                  Category: {d.category}
                </div>

                <div style={{ fontSize: '0.825rem', color: '#2C4A52', marginBottom: 6, overflowWrap: 'break-word' }}>
                  <strong>Telugu:</strong> {d.teluguName || 'N/A'} • <strong>Hindi:</strong> {d.hindiName || 'N/A'}
                </div>

                <div style={{ fontSize: '0.8rem', color: '#486770', background: '#FAF8F5', padding: 8, borderRadius: 6, overflowWrap: 'break-word' }}>
                  <strong>Key Symptoms:</strong> {Array.isArray(d.symptoms) ? d.symptoms.slice(0, 4).join(', ') : d.symptoms}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Matcher */}
      {activeTab === 'matcher' && (
        <div style={{ maxWidth: 800 }}>
          <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 10, marginBottom: 20 }}>
            <AlertTriangle size={18} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: '0.825rem', color: '#92400e', lineHeight: 1.45 }}>
              <strong>Engineering Demonstration Notice:</strong> This keyword-matching utility cross-references input phrases against the reference colloquial dictionary. It is NOT an autonomous machine learning inference engine and does NOT provide diagnostic decisions or clinical care plans.
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>
              Enter Telugu, Hindi, or English symptom phrase:
            </label>
            <textarea
              rows={3}
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #D0DFE2',
                borderRadius: 8,
                fontSize: '0.9rem',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Pan-Indic Multi-lingual Quick Testing Samples */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#486770', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Select a Multi-Lingual Sample Utterance to Test Entity Extraction:
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => applySampleSymptom('తీవ్రమైన ఆయాసం, రాత్రి వేళ పొడి దగ్గు మరియు పీకల్లో పిల్లికూతలు')}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  background: '#E0F2FE',
                  color: '#0369A1',
                  border: '1px solid #BAE6FD',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Telugu: ఆయాసం & పిల్లికూతలు (Asthma)
              </button>
              <button
                onClick={() => applySampleSymptom('सांस फूलना, सीने में भारीपन और रात को तेज घबराहट')}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  background: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #FDE68A',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
 Hindi: सांस फूलना & सीने में भारीपन (Angina)
              </button>
              <button
                onClick={() => applySampleSymptom('ಉಸಿರಾಟದ ತೊಂದರೆ, ಎದೆಯಲ್ಲಿ ಭಾರ ಮತ್ತು ಎದೆ ಬಡಿತ ಜೋರಾಗುವುದು')}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  background: '#D1FAE5',
                  color: '#065F46',
                  border: '1px solid #A7F3D0',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Kannada: ಉಸಿರಾಟದ ತೊಂದರೆ & ಎದೆಯಲ್ಲಿ ಭಾರ
              </button>
              <button
                onClick={() => applySampleSymptom('மூச்சுத் திணறல், நெஞ்சு பாரம் மற்றும் நெஞ்சு படபடப்பு')}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  background: '#E0E7FF',
                  color: '#3730A3',
                  border: '1px solid #C7D2FE',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Tamil: மூச்சுத் திணறல் & நெஞ்சு பாரம்
              </button>
              <button
                onClick={() => applySampleSymptom('श्वास घेण्यास त्रास, छातीत धडधडणे आणि छातीवर दडपण')}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  background: '#F3E8FF',
                  color: '#6B21A8',
                  border: '1px solid #E9D5FF',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Marathi: श्वास घेण्यास त्रास & छातीवर दडपण
              </button>
              <button
                onClick={() => applySampleSymptom('শ্বাসকষ্ট, বুকে চাপ ধরা এবং বুক ধড়ফড়ানি')}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  background: '#FFE4E6',
                  color: '#9F1239',
                  border: '1px solid #FECDD3',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Bengali: শ্বাসকষ্ট & বুকে চাপ ধরা
              </button>
              <button
                onClick={() => applySampleSymptom('Chest me heavy pain ho raha hai, breathing me problem hai')}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  background: '#ECFEFF',
                  color: '#0E7490',
                  border: '1px solid #CFFAFE',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Code-Mixed: Chest pain & breathing problem
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            <button
              onClick={handleTestMatch}
              style={{
                padding: '10px 22px',
                borderRadius: 8,
                background: '#0e7490',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(14, 116, 144, 0.25)'
              }}
            >
              Run Indic Entity Extraction
            </button>
          </div>

          {matchResult && (
            <div style={{ background: '#fff', border: '1px solid #D0DFE2', borderRadius: 10, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#091E26' }}>Keyword Extraction Results</h3>
              {matchResult.matchedTerms && matchResult.matchedTerms.length > 0 ? (
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {matchResult.matchedTerms.map((m, i) => (
                      <span key={i} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '4px 10px', borderRadius: 6, fontSize: '0.825rem' }}>
                        "{m.vernacular}" → <strong>{m.standard}</strong>
                      </span>
                    ))}
                  </div>
                  {matchResult.matchedDiseases && matchResult.matchedDiseases.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2C4A52', marginBottom: 8 }}>
                        Referenced Conditions with Matched Keywords:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {matchResult.matchedDiseases.map((d, i) => (
                          <div key={i} style={{ padding: 10, background: '#FAF8F5', borderRadius: 6, fontSize: '0.825rem', color: '#1e293b' }}>
                            <strong>{d.name}</strong> ({d.icd10}) — Keyword overlap score: {d.score}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: '#698892', fontSize: '0.875rem' }}>
                  No colloquial dictionary terms matched the provided input.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Papers */}
      {activeTab === 'papers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {TOP_RESEARCH_DOMAINS.map((domain, i) => (
            <div key={i} style={{
              background: '#fff',
              border: domain.isPrimaryResearch ? '2px solid #0e7490' : '1px solid #D0DFE2',
              borderRadius: 12,
              padding: 22,
              boxShadow: domain.isPrimaryResearch ? '0 6px 20px rgba(14, 116, 144, 0.12)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#091E26', fontWeight: 800 }}>
                  {domain.domain || domain.title}
                </h3>
                {domain.isPrimaryResearch && (
                  <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: 999, fontWeight: 800, border: '1px solid #bae6fd' }}>
 AyuSwar Landmark Contributions
                  </span>
                )}
              </div>
              <p style={{ margin: '0 0 14px 0', fontSize: '0.85rem', color: '#0F4C5C', fontWeight: 600 }}>Top Venues: {domain.topVenues || domain.description}</p>
              {domain.papers && domain.papers.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
                  {domain.papers.map((p, idx) => (
                    <div key={idx} style={{
                      padding: 14,
                      background: domain.isPrimaryResearch ? '#F8FCFD' : '#FAF8F5',
                      borderRadius: 10,
                      border: domain.isPrimaryResearch ? '1px solid #BAE6FD' : '1px solid #D0DFE2',
                      fontSize: '0.825rem',
                      minWidth: 0,
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem', overflowWrap: 'break-word' }}>
                          {p.title}
                        </div>
                        {p.citationCount && (
                          <span style={{ fontSize: '0.7rem', background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 6, fontWeight: 700, flexShrink: 0 }}>
                            {p.citationCount}
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#698892', fontSize: '0.775rem', marginBottom: 8, overflowWrap: 'break-word' }}>
                        {p.authors} • <em>{p.journal}</em> {p.doi && `• DOI: ${p.doi}`}
                      </div>
                      {p.coreInsight && (
                        <div style={{ color: '#2C4A52', marginTop: 6, lineHeight: 1.5, overflowWrap: 'break-word', background: '#FFFFFF', padding: '8px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                          <strong>Core Insight:</strong> {p.coreInsight}
                        </div>
                      )}
                      {p.recommendationForAyuSwar && (
                        <div style={{ color: '#0F4C5C', marginTop: 8, fontWeight: 600, overflowWrap: 'break-word' }}>
 <strong>Clinical Recommendation:</strong> {p.recommendationForAyuSwar}
                        </div>
                      )}
                      {p.appliedInProject && (
                        <div style={{ color: '#0369A1', marginTop: 4, fontSize: '0.775rem', fontWeight: 600, overflowWrap: 'break-word' }}>
 <strong>AyuSwar Implementation:</strong> {p.appliedInProject}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
