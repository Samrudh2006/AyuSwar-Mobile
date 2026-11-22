import React, { useState, useEffect, useRef } from 'react';
import { importPdfText } from '../services/pdfDocumentImport';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Camera, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Scan, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  X,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { openCvPreprocessor } from '../services/openCvOcrPreprocessor';
import { evaluatePharmacovigilanceSafety } from '../services/pharmacovigilanceSentinel';
import { extractBatchAndExpiry, matchDrugFromOcrText, assessOcrLegibility } from '../services/prescriptionOcrParsing';

export default function PrescriptionScannerView() {
  const { isDemoMode } = useApp();
  const [selectedSampleIdx, setSelectedSampleIdx] = useState(0);
  const [userScanAttempted, setUserScanAttempted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrPhase, setOcrPhase] = useState('idle'); // 'idle' | 'preprocessing' | 'loading-wasm' | 'recognizing' | 'success' | 'empty-error' | 'failed'
  const [measuredProgress, setMeasuredProgress] = useState(null); // numeric progress exposed ONLY when measured
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('');
  const [activeTab, setActiveTab] = useState('samples'); // 'samples' | 'camera' | 'upload'
  const [uploadedImage, setUploadedImage] = useState(null);
  const [liveOcrResult, setLiveOcrResult] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [useCvEnhancement, setUseCvEnhancement] = useState(true);
  const [cvPreprocessedUrl, setCvPreprocessedUrl] = useState(null);
  const [cvStats, setCvStats] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const ocrAbortRef = useRef(false);
  const tesseractWorkerRef = useRef(null);

  // Terminate persistent Tesseract worker on unmount
  useEffect(() => {
    return () => {
      if (tesseractWorkerRef.current) {
        try {
          tesseractWorkerRef.current.terminate();
        } catch {}
        tesseractWorkerRef.current = null;
      }
    };
  }, []);

  const OCR_SAMPLES = [
    {
      id: 'sample_pantocid',
      brand: 'Pantocid-40 (Crinkled Blister Strip)',
      genericSalt: 'Pantoprazole Gastro-resistant 40mg',
      nfiCode: 'BUNDLED SAMPLE',
      dosageForm: 'Enteric-Coated Tablet',
      janAushadhiGeneric: 'Sample generic candidate (bundled)',
      brandedPrice: 'Bundled sample MRP (not live)',
      janAushadhiPrice: 'Bundled sample reference (not live)',
      savingsPct: 'Sample basket estimate',
      vernacularTe: 'Bundled sample instruction text; not dosing advice',
      realImageUrl: '/images/medicines/yellow_pantoprazole.jpg',
      extractedText: 'PANTOCID-40 B.No. P40291 EXP. 08/2027 MFG. SUN PHARMA PANTOPRAZOLE SODIUM IP EQ. TO PANTOPRAZOLE 40 MG',
      ddiConflict: null,
      contourDetected: true,
      imagePlaceholderColor: '#FEF3C7',
      pillColor: '#F59E0B',
      boundingBoxes: [
        { label: 'BRAND_NAME', text: 'PANTOCID-40', x: 28, y: 35, w: 220, h: 32, conf: 'Sample overlay' },
        { label: 'ACTIVE_SALT', text: 'PANTOPRAZOLE SODIUM 40MG', x: 28, y: 75, w: 280, h: 26, conf: 'Sample overlay' },
        { label: 'BATCH_EXP', text: 'B.No: P40291 • EXP: 08/2027', x: 28, y: 110, w: 240, h: 24, conf: 'Sample overlay' }
      ]
    },
    {
      id: 'sample_glycomet',
      brand: 'Glycomet-500 SR (Cut Blister Foil)',
      genericSalt: 'Metformin Hydrochloride Prolonged Release 500mg',
      nfiCode: 'BUNDLED SAMPLE',
      dosageForm: 'Sustained-Release Tablet',
      janAushadhiGeneric: 'Sample generic candidate (bundled)',
      brandedPrice: 'Bundled sample MRP (not live)',
      janAushadhiPrice: 'Bundled sample reference (not live)',
      savingsPct: 'Sample basket estimate',
      vernacularTe: 'Bundled sample instruction text; not dosing advice',
      realImageUrl: '/images/medicines/pink_metformin.jpg',
      extractedText: 'GLYCOMET-500 SR B.No. GM9124 EXP. 11/2026 METFORMIN HYDROCHLORIDE EXTENDED RELEASE IP 500 MG',
      ddiConflict: null,
      contourDetected: true,
      imagePlaceholderColor: '#FFF7ED',
      pillColor: '#E11D48',
      boundingBoxes: [
        { label: 'BRAND_NAME', text: 'GLYCOMET-500 SR', x: 30, y: 32, w: 240, h: 32, conf: 'Sample overlay' },
        { label: 'ACTIVE_SALT', text: 'METFORMIN HYDROCHLORIDE 500MG', x: 30, y: 72, w: 300, h: 26, conf: 'Sample overlay' },
        { label: 'BATCH_EXP', text: 'B.No: GM9124 • EXP: 11/2026', x: 30, y: 108, w: 230, h: 24, conf: 'Sample overlay' }
      ]
    },
    {
      id: 'sample_combiflam',
      brand: 'Combiflam (NSAID Combination Strip)',
      genericSalt: 'Ibuprofen 400mg + Paracetamol 325mg',
      nfiCode: 'BUNDLED SAMPLE',
      dosageForm: 'Oral Film-Coated Tablet',
      janAushadhiGeneric: 'Sample generic candidate (bundled)',
      brandedPrice: 'Bundled sample MRP (not live)',
      janAushadhiPrice: 'Bundled sample reference (not live)',
      savingsPct: 'Sample basket estimate',
      vernacularTe: 'Bundled sample instruction text; not dosing advice',
      realImageUrl: '/images/medicines/white_paracetamol.jpg',
      extractedText: 'COMBIFLAM TABLET IBUPROFEN IP 400 MG PARACETAMOL IP 325 MG SANOFIAVENTIS B.No. CB2049',
      ddiConflict: 'Sample interaction flag only: verify the original medicines with a pharmacist or qualified clinician.',
      contourDetected: true,
      imagePlaceholderColor: '#FEE2E2',
      pillColor: '#B91C1C',
      boundingBoxes: [
        { label: 'BRAND_NAME', text: 'COMBIFLAM TABLET', x: 26, y: 34, w: 250, h: 34, conf: 'Sample overlay' },
        { label: 'DUAL_SALT', text: 'IBUPROFEN 400MG + PARACETAMOL 325MG', x: 26, y: 76, w: 320, h: 28, conf: 'Sample overlay' },
        { label: 'MFG_BATCH', text: 'SANOFIAVENTIS • B.No: CB2049', x: 26, y: 112, w: 240, h: 22, conf: 'Sample overlay' }
      ]
    },
    {
      id: 'sample_amlodipine',
      brand: 'Amlodipine 5mg (Blue Blister Strip)',
      genericSalt: 'Amlodipine Besylate 5mg IP',
      nfiCode: 'BUNDLED SAMPLE',
      dosageForm: 'Oral Antihypertensive Tablet',
      janAushadhiGeneric: 'Sample generic candidate (bundled)',
      brandedPrice: 'Bundled sample MRP (not live)',
      janAushadhiPrice: 'Bundled sample reference (not live)',
      savingsPct: 'Sample basket estimate',
      vernacularTe: 'Bundled sample instruction text; not dosing advice',
      realImageUrl: '/images/medicines/blue_amlodipine.jpg',
      extractedText: 'AMLODIPINE 5MG TABLETS EXP 10/2026 LOT 1437 BP CARDIOVASCULAR IP 5 MG',
      ddiConflict: null,
      contourDetected: true,
      imagePlaceholderColor: '#E0F2FE',
      pillColor: '#0284C7',
      boundingBoxes: [
        { label: 'BRAND_NAME', text: 'AMLODIPINE 5MG', x: 26, y: 34, w: 220, h: 32, conf: 'Sample overlay' },
        { label: 'ACTIVE_SALT', text: 'AMLODIPINE BESYLATE 5MG', x: 26, y: 76, w: 280, h: 26, conf: 'Sample overlay' },
        { label: 'BATCH_EXP', text: 'LOT: 1437 • EXP: 10/2026', x: 26, y: 112, w: 230, h: 22, conf: 'Sample overlay' }
      ]
    },
    {
      id: 'sample_atorvastatin',
      brand: 'Atorvastatin 20mg (Orange Lipid-Lowering)',
      genericSalt: 'Atorvastatin Calcium 20mg IP',
      nfiCode: 'BUNDLED SAMPLE',
      dosageForm: 'Film-Coated Tablet',
      janAushadhiGeneric: 'Sample generic candidate (bundled)',
      brandedPrice: 'Bundled sample MRP (not live)',
      janAushadhiPrice: 'Bundled sample reference (not live)',
      savingsPct: 'Sample basket estimate',
      vernacularTe: 'Bundled sample instruction text; not dosing advice',
      realImageUrl: '/images/medicines/orange_atorvastatin.jpg',
      extractedText: 'ATORVASTATIN 20MG TABLETS LOT: EXP 12/26 ATORVASTATIN CALCIUM TRIHYDRATE IP 20 MG',
      ddiConflict: 'Sample interaction flag only: verify the original medicines with a pharmacist or qualified clinician.',
      contourDetected: true,
      imagePlaceholderColor: '#FFEDD5',
      pillColor: '#EA580C',
      boundingBoxes: [
        { label: 'BRAND_NAME', text: 'ATORVASTATIN 20MG', x: 28, y: 34, w: 240, h: 32, conf: 'Sample overlay' },
        { label: 'ACTIVE_SALT', text: 'ATORVASTATIN CALCIUM 20MG', x: 28, y: 76, w: 290, h: 26, conf: 'Sample overlay' },
        { label: 'BATCH_EXP', text: 'LOT: EXP 12/26 • BARCODE VERIFIED', x: 28, y: 112, w: 260, h: 22, conf: 'Sample overlay' }
      ]
    },
    {
      id: 'sample_augmentin',
      brand: 'Augmentin 625 Duo (Aluminum Blister Strip)',
      genericSalt: 'Amoxicillin 500mg + Clavulanate 125mg',
      nfiCode: 'BUNDLED SAMPLE',
      dosageForm: 'Film-Coated Tablet',
      janAushadhiGeneric: 'Sample generic candidate (bundled)',
      brandedPrice: 'Bundled sample MRP (not live)',
      janAushadhiPrice: 'Bundled sample reference (not live)',
      savingsPct: 'Sample basket estimate',
      vernacularTe: 'Bundled sample instruction text; not dosing advice',
      realImageUrl: '/images/medicines/silver_amoxicillin_blister.jpg',
      extractedText: 'AMOXICILLIN 500MG CAPSULES BP BATCH: L 34512A EXP: 10/26 POTASSIUM CLAVULANATE',
      ddiConflict: 'Sample allergy-review flag only: verify allergy history with a pharmacist or qualified clinician.',
      contourDetected: true,
      imagePlaceholderColor: 'var(--m-card-cool)',
      pillColor: '#486770',
      boundingBoxes: [
        { label: 'BRAND_NAME', text: 'AMOXICILLIN 500MG', x: 26, y: 34, w: 230, h: 32, conf: 'Sample overlay' },
        { label: 'ACTIVE_SALT', text: 'AMOXICILLIN + CLAVULANATE', x: 26, y: 76, w: 280, h: 26, conf: 'Sample overlay' },
        { label: 'BATCH_EXP', text: 'BATCH: L 34512A • EXP: 10/26', x: 26, y: 112, w: 250, h: 22, conf: 'Sample overlay' }
      ]
    }
  ];

  // Feature 4: NEJM AI Beers Criteria & Renal Safety Sentinel State
  const [patientAgeProfile, setPatientAgeProfile] = useState('geriatric'); // 'adult' | 'geriatric'
  const [patientEgfrProfile, setPatientEgfrProfile] = useState('normal'); // 'normal' | 'mild' | 'severe'

  // Current display data: live OCR result, an honest empty state after a user
  // scan that produced nothing, or the explicitly selected bundled sample.
  const EMPTY_SCAN_RESULT = { id: 'empty-scan', brand: 'No result from this scan', keywords: [], boundingBoxes: [], extractedText: '', genericSalt: 'No text recognized - try a clearer, well-lit photo', dosageForm: '-', nfiCode: 'NO RESULT', matchType: 'No candidate', imagePlaceholderColor: 'var(--m-card-cool)', realImageUrl: null, batchNumber: 'Not identified', expiryDate: 'Not identified', vernacularTe: null, ddiConflict: null, pillColor: '#94A3B8' };
  const baseSample = liveOcrResult || (userScanAttempted && !isScanning ? EMPTY_SCAN_RESULT : OCR_SAMPLES[selectedSampleIdx]);
  const currentSample = { ...baseSample, nfiCode: liveOcrResult ? (liveOcrResult.sourceKind === 'pdf-text-layer' ? 'UNVERIFIED PDF TEXT IMPORT' : 'UNVERIFIED OCR CANDIDATE') : (userScanAttempted && !isScanning ? 'NO RESULT' : 'BUNDLED SAMPLE'), vectorConfidence: 'Verify exact ingredient, strength and release form', brandedPrice: 'Not checked', janAushadhiPrice: 'Not checked', savingsPct: 'Not measured', janAushadhiGeneric: 'No live stock, price or equivalence check', vernacularTe: null };

  // Evaluate Beers Criteria & KDIGO Renal Safety
  const activeKeywords = currentSample.keywords || [currentSample.id || '', currentSample.brand || ''];
  const ageVal = patientAgeProfile === 'geriatric' ? 68 : 42;
  const egfrVal = patientEgfrProfile === 'severe' ? 24 : patientEgfrProfile === 'mild' ? 40 : 92;

  const beersSafety = {
    severity: 'UNVERIFIED', badge: 'No safety clearance', color: '#7a571d', bgColor: '#fff5e4', borderColor: '#b9a075',
    title: 'Clinical medication safety is not established',
    details: `Selected hypothetical profile: age ${ageVal}, eGFR ${egfrVal}. OCR cannot establish medicine identity, contraindications, interactions or safe dosing.`,
    recommendation: 'Verify the original label, exact ingredient, strength and release form with a pharmacist or qualified clinician. No dispensing or dose recommendation is made.'
  };

  // Stop webcam stream helper
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start real HTML5 webcam video feed
  const startWebcam = async () => {
    stopWebcam();
    setCameraError(null);
    setLiveOcrResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setActiveTab('camera');
    } catch (err) {
      console.warn("Webcam access error:", err);
      setCameraError("Camera permission denied or camera device not found. Please upload a medicine strip image directly.");
    }
  };

  // Run Real In-Browser Tesseract.js OCR with OpenCV Preprocessing
  const executeRealOcr = async (imageSource, previewUrl = null) => {
    ocrAbortRef.current = false;
    setIsScanning(true);
    setUserScanAttempted(true);
    setLiveOcrResult(null); // never let a previous result pose as this scan's output
    setOcrPhase('preprocessing');
    setMeasuredProgress(null); // No fixed numeric progress during preparation
    setOcrProgress(0);
    setOcrStatusText('Reading image on your device: Preparing foil contours...');

    let imageToOcr = imageSource;
    const resultPreviewUrl = previewUrl || (typeof imageSource === 'string' ? imageSource : null);
    if (useCvEnhancement) {
      try {
        const cvResult = await openCvPreprocessor.preprocessForOcr(imageSource, { dewarpPerspective: true });
        if (ocrAbortRef.current) return;
        imageToOcr = cvResult.processedDataUrl;
        setCvPreprocessedUrl(cvResult.processedDataUrl);
        setCvStats(cvResult.stats);
      } catch (cvErr) {
        console.warn('OpenCV enhancement fallback:', cvErr);
      }
    }

    if (ocrAbortRef.current) return;

    try {
      setOcrPhase('loading-wasm');
      setMeasuredProgress(null);
      setOcrStatusText('Reading image on your device: Initializing local WASM engine...');

      let result;
      const progressLogger = (m) => {
        if (ocrAbortRef.current) return;
        if (m.status === 'recognizing text') {
          setOcrPhase('recognizing');
          const pct = Math.min(99, Math.max(1, Math.round((m.progress || 0) * 100)));
          setMeasuredProgress(pct);
          setOcrProgress(pct);
          setOcrStatusText(`Reading image on your device: Extracting packaging text (${pct}%)...`);
        } else if (m.status) {
          setOcrStatusText(`Reading image on your device: ${m.status}...`);
        }
      };

      try {
        const { default: Tesseract } = await import('tesseract.js');
        if (!tesseractWorkerRef.current) {
          tesseractWorkerRef.current = await Tesseract.createWorker('eng', 1, {
            workerPath: '/models/worker.min.js',
            corePath: '/models/tesseract-core',
            langPath: '/models/tessdata',
            cacheMethod: 'none',
            gzip: false,
            logger: progressLogger
          });
        }
        result = await tesseractWorkerRef.current.recognize(imageToOcr);
      } catch (workerErr) {
        console.warn('Persistent worker error, falling back to direct recognize:', workerErr);
        try {
          const { default: Tesseract } = await import('tesseract.js');
          result = await Tesseract.recognize(imageToOcr, 'eng', { workerPath: '/models/worker.min.js', corePath: '/models/tesseract-core', langPath: '/models/tessdata', cacheMethod: 'none', gzip: false, logger: progressLogger });
        } catch (recErr) {
          console.warn('Direct recognize also failed:', recErr);
        }
      }

      if (ocrAbortRef.current) return;

      const rawText = result?.data?.text ? result.data.text.trim() : '';

      // On error/empty result: stop animation and offer clearer-image retry, NO success check!
      if (!rawText || rawText.length < 3) {
        setOcrPhase('empty-error');
        setIsScanning(false);
        setMeasuredProgress(null);
        setOcrProgress(0);
        setOcrStatusText('No legible text found. Please hold medicine strip flat under bright light.');
        return;
      }

      // Legibility gate: unreliable OCR (low engine confidence or symbol-soup)
      // must not reach the formulary matcher or the result card as a candidate.
      const ocrConfidence = typeof result?.data?.confidence === 'number' ? result.data.confidence : null;
      const legibility = assessOcrLegibility(rawText, ocrConfidence);
      if (!legibility.legible) {
        // Confidence stays internal: it is a rejection heuristic, not a
        // probability that a reading is correct, so it is never shown to users.
        setOcrPhase('empty-error');
        setIsScanning(false);
        setMeasuredProgress(null);
        setOcrProgress(0);
        setOcrStatusText('Could not read this image reliably. No medicine details were inferred. Retake: hold the strip flat, fill the frame, and use bright even light.');
        return;
      }

      // Show 100% + check only after successful processing with non-empty text
      setOcrPhase('success');
      setMeasuredProgress(100);
      setOcrProgress(100);
      setOcrStatusText('Reading image on your device: Text recognized successfully!');

      const { batch, expiry } = extractBatchAndExpiry(rawText);
      const matchedDrug = matchDrugFromOcrText(rawText);

      // Clinical AI Post-OCR Reconstructor using Groq reasoning
      const groqRecon = null; // No generative medicine-identity substitution.

      // If Groq determined this is NOT a medicine (e.g. fruits, vegetables, food, household item)
      if (groqRecon && groqRecon.isMedicine === false) {
        setLiveOcrResult({
          isLiveExtraction: true,
          isNonMedicine: true,
 brand: `⚠ ${groqRecon.detectedItem || 'Non-Medical Object Detected'}`,
          genericSalt: 'No pharmaceutical medicine or doctor prescription found in this image.',
          nfiCode: 'NOT-A-MEDICINE',
          dosageForm: 'Non-Pharmaceutical',
          realImageUrl: resultPreviewUrl,
          janAushadhiGeneric: 'Please scan a valid medicine packaging strip or prescription slip.',
          brandedPrice: 'N/A',
          janAushadhiPrice: 'N/A',
          savingsPct: 'No Medicine Detected',
          extractedText: rawText,
          reconstructedPrescription: null,
          batchNumber: 'None',
          expiryDate: 'None',
          vernacularTe: groqRecon.vernacularMessage || 'ఇది ఔషధం లేదా ప్రిస్క్రిప్షన్ కాదని గుర్తించబడింది. దయచేసి సరైన మందుల ప్యాకింగ్ లేదా ప్రిస్క్రిప్షన్ కాగితాన్ని స్కాన్ చేయండి.',
          ddiConflict: null,
          pillColor: '#DC2626',
          imagePlaceholderColor: '#FEF2F2'
        });
        setIsScanning(false);
        setOcrPhase('idle');
        return;
      }

      if (groqRecon && groqRecon.medications && groqRecon.medications.length > 0) {
        const topMed = groqRecon.medications[0];
        setLiveOcrResult({
          isLiveExtraction: true,
          brand: `${topMed.brandName || matchedDrug?.brand || 'OCR candidate'} [AI reconstruction - unverified]`,
          genericSalt: `${topMed.genericName} (${topMed.dosage || 'Standard Strength'})`,
          nfiCode: 'UNVERIFIED OCR CANDIDATE',
          dosageForm: topMed.timing || matchedDrug?.dosageForm || 'Oral Form',
          realImageUrl: matchedDrug?.imageUrl || resultPreviewUrl,
          janAushadhiGeneric: `Sample generic candidate: ${topMed.genericName} (not a live PMBJP check)`,
          brandedPrice: 'Not checked (no live MRP)',
          janAushadhiPrice: 'Not checked (no live stock or price)',
          savingsPct: 'Not measured (sample only)',
          extractedText: rawText,
          reconstructedPrescription: groqRecon,
          batchNumber: batch || 'Detected on packaging',
          expiryDate: expiry || 'Current Shelf Life',
          vernacularTe: topMed.instructions || matchedDrug?.vernacularTe || 'వైద్యుని సూచన ప్రకారం సరైన సమయానికి వాడండి',
          ddiConflict: matchedDrug?.ddiConflict || null,
          pillColor: '#047857',
          imagePlaceholderColor: '#ECFDF5'
        });
      } else if (matchedDrug) {
        setLiveOcrResult({
          isLiveExtraction: true,
          brand: `${matchedDrug.brand} [Live OCR Extracted]`,
          genericSalt: matchedDrug.genericSalt,
          nfiCode: matchedDrug.nfiCode,
          dosageForm: matchedDrug.dosageForm,
          realImageUrl: matchedDrug.imageUrl,
          janAushadhiGeneric: matchedDrug.janAushadhiGeneric,
          brandedPrice: 'Bundled sample MRP (not live)',
          janAushadhiPrice: 'Bundled sample reference (not live)',
          savingsPct: 'Sample basket estimate',
          extractedText: rawText || 'No text extracted',
          batchNumber: batch || 'Detected on packaging',
          expiryDate: expiry || 'Inspected',
          vernacularTe: matchedDrug.vernacularTe,
          ddiConflict: matchedDrug.ddiConflict,
          pillColor: '#0F4C5C',
          imagePlaceholderColor: '#E6FAF8',
          matchType: matchedDrug.matchType || 'Unverified candidate',
          vectorConfidence: 'Candidate only - verify against the original label'
        });
      } else {
        // Fallback with raw extracted text
        setLiveOcrResult({
          isLiveExtraction: true,
          brand: `Extracted Text: ${rawText.slice(0, 32)}...`,
          genericSalt: 'No exact dictionary candidate - inspect extracted text',
          nfiCode: 'BUNDLED SAMPLE',
          dosageForm: 'Solid Dosage Form',
          realImageUrl: resultPreviewUrl || null, // never substitute an unrelated medicine photo for an unmatched scan
          janAushadhiGeneric: 'Bundled sample formulary reference',
          brandedPrice: 'Check local MRP',
          janAushadhiPrice: 'Not checked (no live stock or price)',
          savingsPct: 'Not measured (sample only)',
          vernacularTe: 'వైద్యుని సలహా ప్రకారం జెనెరిక్ ఔషధాల వివరాలు చూడండి',
          extractedText: rawText,
          batchNumber: batch || 'Not identified',
          expiryDate: expiry || 'Not identified',
          ddiConflict: null,
          pillColor: '#52707C',
          imagePlaceholderColor: 'var(--m-card-cool)'
        });
      }
      setIsScanning(false);
      setOcrPhase('idle');
    } catch (ocrErr) {
      console.error("Tesseract OCR execution error:", ocrErr);
      setOcrPhase('failed');
      setIsScanning(false);
      setMeasuredProgress(null);
      setCameraError("OCR recognition encountered an error. Please try uploading a clearer image.");
    }
  };

  const handleCancelOcr = () => {
    ocrAbortRef.current = true;
    setIsScanning(false);
    setOcrPhase('idle');
    setMeasuredProgress(null);
    setOcrProgress(0);
    setOcrStatusText('');
  };

  // Capture video frame to canvas & run OCR
  const handleCaptureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setUploadedImage(dataUrl);
      stopWebcam();
      setActiveTab('upload');
      executeRealOcr(dataUrl);
    }
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      stopWebcam();
      setActiveTab('upload');
      executeRealOcr(file, url);
    }
  };

  // Local PDF import (bounded): extract text layer on-device, review before use.
  const [pdfImport, setPdfImport] = useState({ status: 'idle' });
  const pdfCancelRef = useRef(false);
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    pdfCancelRef.current = false;
    setPdfImport({ status: 'extracting', fileName: file.name, done: 0, total: 0 });
    try {
      const res = await importPdfText(file, {
        onProgress: (done, total) => { if (!pdfCancelRef.current) setPdfImport(p => p.status === 'extracting' ? { ...p, done, total } : p); }
      });
      if (pdfCancelRef.current) { setPdfImport({ status: 'idle' }); return; }
      if (!res.ok) { setPdfImport({ status: 'error', kind: res.kind, pageCount: res.pageCount }); return; }
      setPdfImport({
        status: 'review',
        fileName: res.fileName,
        pageCount: res.pageCount,
        truncated: res.truncated,
        ackPartial: false,
        text: res.pages.map(pg => `[Page ${pg.page}] ${pg.text}`).join('\n\n')
      });
    } catch (err) {
      if (!pdfCancelRef.current) setPdfImport({ status: 'error', kind: 'corrupt' });
    }
  };
  const usePdfDraft = () => {
    const text = (pdfImport.text || '').trim();
    if (text.length < 3) return;
    const { batch, expiry } = extractBatchAndExpiry(text);
    const matchedDrug = matchDrugFromOcrText(text);
    setUserScanAttempted(true);
    setLiveOcrResult({
      isLiveExtraction: true,
      brand: `PDF import${pdfImport.truncated ? ` (partial - first 20 of ${pdfImport.pageCount} pages)` : ''}: ${pdfImport.fileName || 'document'}`,
      genericSalt: matchedDrug ? `${matchedDrug.brand} (unverified dictionary candidate)` : 'Unverified document text - no medicine match',
      nfiCode: 'UNVERIFIED PDF TEXT LAYER',
      dosageForm: 'Document text, not OCR',
      realImageUrl: null,
      janAushadhiGeneric: 'Text came from the PDF text layer, not image OCR. Check every word against the original document.',
      brandedPrice: 'Not checked',
      janAushadhiPrice: 'Not checked',
      savingsPct: 'Not measured',
      extractedText: text,
      batchNumber: batch || 'None found',
      expiryDate: expiry || 'None found',
      vernacularTe: null,
      sourceKind: 'pdf-text-layer'
    });
    setPdfImport({ status: 'idle' });
  };

  return (
    <div className="scanner-view-container" style={{ padding: '36px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ background: 'rgba(255,253,246,0.92)', borderRadius: '16px', padding: '14px 18px 18px', marginBottom: '28px', boxShadow: '0 2px 12px rgba(8,28,36,0.08)', backdropFilter: 'blur(6px)' }}>
      {/* Breadcrumb Navigation */}
      <div className="m-view-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0F4C5C', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
          <ArrowLeft size={16} />
          <span>Home</span>
        </Link>
        <span style={{ color: '#4A5A50' }}>/</span>
        <span style={{ color: '#122028', fontSize: '13px' }}>Solutions</span>
        <span style={{ color: '#4A5A50' }}>/</span>
        <span style={{ color: '#081C24', fontSize: '13px', fontWeight: 700 }}>Blister Strip & Paper Rx Scanner</span>
      </div>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FFF7ED', color: '#92400E', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800 }}>
            <Scan size={14} />
            <span>REAL IN-BROWSER OCR + PDF TEXT WORKSPACE</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ECFDF5', color: '#065F46', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 750 }}>
            <ShieldCheck size={14} />
            <span>Designed for client-side OCR and PDF text processing</span>
          </div>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 850, color: '#081C24', marginBottom: '10px' }}>
          AyuVision Blister Strip & Prescription Scanner
        </h1>
        <p style={{ fontSize: '14.5px', color: '#37525C', maxWidth: '850px', lineHeight: 1.6 }}>
          This scanner can read packaging or prescription photos on your device with Tesseract OCR, or import the text layer of a prescription PDF locally. Check every word against the original. Local dictionary suggestions are unverified candidates, not medicine identification, substitution, live pricing or stock checks.
        </p>
      </div>
      </div>

      {/* Live OCR Active Notification Banner */}
      {liveOcrResult && (
        <div style={{
          background: '#F0FDFA',
          border: '1.5px solid #D4AF37',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} color="#0F766E" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F766E' }}>
                {liveOcrResult.sourceKind === 'pdf-text-layer' ? 'PDF Text Import Active' : 'Live In-Browser OCR Result Active'}
              </div>
              <div style={{ fontSize: '12px', color: '#134E4A' }}>
                {liveOcrResult.sourceKind === 'pdf-text-layer'
                  ? 'Imported from the PDF text layer on this device. No OCR or optical inspection was run.'
                  : 'Parsed from your uploaded image / camera frame in WebAssembly.'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setLiveOcrResult(null);
              setUploadedImage(null);
              setActiveTab('samples');
            }}
            style={{
              background: '#0F766E',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 750,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <X size={14} />
            <span>Reset to Preset Samples</span>
          </button>
        </div>
      )}

      {/* Workspace Grid */}
      <div className="scanner-workspace-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
        {/* Left Column: Interactive Input / Sample Selector */}
        <div style={{ background: 'var(--m-card)', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#081C24', marginBottom: '8px' }}>
              1. Input Medicine Packaging Sample
            </h3>
            <p style={{ fontSize: '13px', color: '#52707C' }}>
              Upload any physical medicine strip image, capture using live camera, or test with clinical presets.
            </p>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '8px', background: 'var(--m-card)', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => {
                stopWebcam();
                setLiveOcrResult(null);
                setActiveTab('samples');
              }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'samples' ? '#0A2540' : 'transparent',
                color: activeTab === 'samples' ? '#FFFFFF' : '#52707C',
                fontSize: '12px',
                fontWeight: 750,
                cursor: 'pointer'
              }}
            >
              Preset Samples (3)
            </button>
            <button
              onClick={startWebcam}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'camera' ? '#0A2540' : 'transparent',
                color: activeTab === 'camera' ? '#FFFFFF' : '#52707C',
                fontSize: '12px',
                fontWeight: 750,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
            >
              <Camera size={13} />
              <span>Live WebCam</span>
            </button>
            <label
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                background: activeTab === 'upload' ? '#0A2540' : 'transparent',
                color: activeTab === 'upload' ? '#FFFFFF' : '#52707C',
                fontSize: '12px',
                fontWeight: 750,
                cursor: 'pointer',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <Upload size={13} />
              <span>Upload Foil</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              <input type="file" accept="application/pdf" onChange={handlePdfUpload} style={{ display: 'none' }} data-pdf-input="true" />
            </label>
          </div>

          {/* Local PDF import: bounded text-layer extraction, reviewed before use */}
          <div style={{ marginTop: '10px' }}>
            {pdfImport.status === 'idle' && (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: 'var(--m-card-cool)', border: '1px dashed #94A3B8', color: '#0F4C5C', fontSize: '12px', fontWeight: 750, cursor: 'pointer' }}>
                <Upload size={13} />
                <span>Import PDF (text layer, on-device)</span>
                <input type="file" accept="application/pdf" onChange={handlePdfUpload} style={{ display: 'none' }} />
              </label>
            )}
            {pdfImport.status === 'extracting' && (
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#F0F9FF', border: '1px solid #BAE6FD', fontSize: '12px', color: '#075985' }}>
                <b>Extracting text from {pdfImport.fileName} on this device...</b>
                {pdfImport.total ? <span> Page {pdfImport.done} of {pdfImport.total} (measured).</span> : <span> Preparing document...</span>}
                <button onClick={() => { pdfCancelRef.current = true; setPdfImport({ status: 'idle' }); }} style={{ marginLeft: 10, fontSize: '11px', fontWeight: 800, color: '#991B1B', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Cancel</button>
              </div>
            )}
            {pdfImport.status === 'error' && (
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA', fontSize: '12px', color: '#991B1B' }}>
                {pdfImport.kind === 'password' && 'This PDF is password-protected. It was not opened.'}
                {pdfImport.kind === 'oversize' && 'This PDF is larger than 15 MB. Import a smaller document.'}
                {pdfImport.kind === 'not-pdf' && 'That file is not a PDF.'}
                {pdfImport.kind === 'no-text' && `No readable text layer found${pdfImport.pageCount ? ` in ${pdfImport.pageCount} page(s)` : ''}. Scanned-image PDFs are not OCR-imported here; use the image upload instead.`}
                {pdfImport.kind === 'corrupt' && <>This PDF could not be read (corrupt or unsupported). Try a different file, or a clear photo or scan of the prescription instead.</>}
                <button onClick={() => setPdfImport({ status: 'idle' })} style={{ marginLeft: 10, fontSize: '11px', fontWeight: 800, color: '#0F4C5C', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Dismiss</button>
              </div>
            )}
            {pdfImport.status === 'review' && (
              <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--m-card)', border: '1.5px solid #D0DFE2' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#081C24', marginBottom: 4 }}>
                  {pdfImport.fileName} - {pdfImport.pageCount} page(s){pdfImport.truncated ? ' (first 20 pages only)' : ''}
                </div>
                <div style={{ fontSize: '11px', color: '#52707C', marginBottom: 8 }}>
                  Extracted from the PDF text layer on this device. This is not OCR output and not verified medicine information - review and correct before use.
                </div>
                {pdfImport.truncated && (
                  <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#FFFBEB', border: '1.5px solid #F59E0B', marginBottom: 8 }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#92400E', marginBottom: 4 }}>
                      Partial import - this document is incomplete here
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#78350F', lineHeight: 1.5 }}>
                      This document has {pdfImport.pageCount} pages. Only the first 20 were imported; {pdfImport.pageCount - 20} page(s) were not read. Missing pages can change what this document means. To read the rest, split the PDF and import the remaining pages separately.
                    </div>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 8, fontSize: '11.5px', fontWeight: 750, color: '#92400E', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!pdfImport.ackPartial}
                        onChange={e => setPdfImport(p => ({ ...p, ackPartial: e.target.checked }))}
                        style={{ marginTop: 2 }}
                      />
                      I understand this import is incomplete (first 20 of {pdfImport.pageCount} pages)
                    </label>
                  </div>
                )}
                <textarea
                  value={pdfImport.text}
                  onChange={e => setPdfImport(p => ({ ...p, text: e.target.value }))}
                  rows={7}
                  style={{ width: '100%', fontSize: '12px', padding: '8px', borderRadius: '8px', border: '1px solid #D0DFE2', fontFamily: 'monospace', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={usePdfDraft}
                    disabled={!!pdfImport.truncated && !pdfImport.ackPartial}
                    style={{ padding: '8px 14px', borderRadius: '8px', background: (!pdfImport.truncated || pdfImport.ackPartial) ? '#0A2540' : '#94A3B8', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 800, cursor: (!pdfImport.truncated || pdfImport.ackPartial) ? 'pointer' : 'not-allowed' }}
                  >
                    Use as unverified draft{pdfImport.truncated ? ' (partial - first 20 pages)' : ''}
                  </button>
                  <button onClick={() => setPdfImport({ status: 'idle' })} style={{ padding: '8px 14px', borderRadius: '8px', background: 'none', color: '#486770', border: '1px solid #D0DFE2', fontSize: '12px', fontWeight: 750, cursor: 'pointer' }}>
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Camera Error Message */}
          {cameraError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px', fontSize: '11.5px', color: '#991B1B' }}>
              {cameraError}
            </div>
          )}

          {/* Live WebCam Feed View */}
          {activeTab === 'camera' && (
            <div style={{
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#040B17',
              border: '2px solid #0284C7',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                style={{ width: '100%', maxHeight: '260px', objectFit: 'cover' }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Optical Reticle Overlays */}
              <div style={{
                position: 'absolute',
                inset: '20px',
                border: '2px dashed rgba(16, 185, 129, 0.7)',
                borderRadius: '8px',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  background: 'rgba(4, 11, 23, 0.85)',
                  color: '#047857',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}>
                  Align medicine blister strip inside green box
                </div>
              </div>

              {/* Capture Button */}
              <div style={{ padding: '10px', width: '100%', background: '#081224', display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCaptureFrame}
                  style={{
                    flex: 1,
                    background: '#047857',
                    color: '#041B15',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px',
                    fontSize: '12.5px',
                    fontWeight: 850,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Camera size={15} />
                  <span>Capture Frame & Run Tesseract OCR</span>
                </button>
                <button
                  onClick={stopWebcam}
                  style={{
                    background: '#1E293B',
                    color: '#94A3B8',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Samples List */}
          {activeTab === 'samples' && !liveOcrResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {OCR_SAMPLES.map((sample, idx) => (
                <div
                  key={sample.id}
                  onClick={() => {
                    setSelectedSampleIdx(idx);
                    setLiveOcrResult(null);
                    setUserScanAttempted(false);
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: selectedSampleIdx === idx ? '2px solid #0F4C5C' : '1px solid #D0DFE2',
                    background: selectedSampleIdx === idx ? '#F0FDFA' : '#FFFDF8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 160ms ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {sample.realImageUrl ? (
                      <img 
                        src={sample.realImageUrl} 
                        alt={sample.brand} 
                        style={{ 
                          width: '42px', 
                          height: '42px', 
                          borderRadius: '8px', 
                          objectFit: 'cover', 
                          border: '1.5px solid #D0DFE2',
                          flexShrink: 0
                        }} 
                      />
                    ) : (
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: sample.pillColor }} />
                    )}
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#081C24' }}>{sample.brand}</div>
                      <div style={{ fontSize: '12px', color: '#52707C' }}>{sample.genericSalt}</div>
                    </div>
                  </div>
                  {sample.ddiConflict && (
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#B91C1C', background: '#FEE2E2', padding: '2px 8px', borderRadius: '10px' }}>
                      DDI Alert
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Visual Canvas Representation with Real Preview */}
          {activeTab !== 'camera' && (
            <div style={{
              height: '240px',
              borderRadius: '12px',
              background: uploadedImage 
                ? `url(${uploadedImage}) center/contain no-repeat #091E26` 
                : currentSample.realImageUrl 
                  ? `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.65)), url(${currentSample.realImageUrl}) center/cover no-repeat #091E26`
                  : currentSample.imagePlaceholderColor,
              border: '2px solid #D0DFE2',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {!uploadedImage && liveOcrResult?.sourceKind === 'pdf-text-layer' && (
                <div style={{ width: '100%', height: '100%', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#486770', textAlign: 'center', lineHeight: 1.6 }}>
                    Imported from a PDF text layer.<br />No optical inspection was run - there is no packaging image for this result.
                  </div>
                </div>
              )}
              {!uploadedImage && liveOcrResult?.sourceKind !== 'pdf-text-layer' && (
                <div style={{ width: '100%', height: '100%', padding: '20px', position: 'relative' }}>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#081C24', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#047857', display: 'inline-block' }} />
                    Optical Packaging Inspection [Reference Preset HUD]
                  </div>

                  {/* Render Bounding Boxes */}
                  {currentSample.boundingBoxes?.map((bb, bIdx) => (
                    <div
                      key={bIdx}
                      style={{
                        position: 'absolute',
                        top: `${bb.y}px`,
                        left: `${bb.x}px`,
                        width: `${bb.w}px`,
                        height: `${bb.h}px`,
                        border: '1.5px solid #047857',
                        background: 'rgba(16, 185, 129, 0.08)',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 6px',
                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.25)'
                      }}
                    >
                      <span style={{ fontSize: '9px', fontWeight: 850, color: '#065F46', background: '#A7F3D0', padding: '1px 4px', borderRadius: '3px' }}>
                        {bb.label}
                      </span>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#047857', fontFamily: 'monospace' }}>
                        {bb.conf}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Teal Liquid Wave in Rounded Medicine-Foil Container */}
              {(isScanning || ocrPhase === 'empty-error' || ocrPhase === 'failed') && (
                <div
                  role="progressbar"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={measuredProgress ?? undefined}
                  aria-live="polite"
                  aria-label="Reading medicine blister foil image on your device"
                  className="ayuswar-foil-liquid-overlay"
                >
                  <div className="ayuswar-foil-blister-card">
                    {/* Metallic Foil Texture Highlight */}
                    <div className="ayuswar-foil-emboss-pattern" />

                    {/* Liquid Reservoir */}
                    <div
                      className={`ayuswar-liquid-body ${
                        ocrPhase === 'preprocessing' || ocrPhase === 'loading-wasm'
                          ? 'ayuswar-liquid-indeterminate'
                          : ocrPhase === 'empty-error' || ocrPhase === 'failed'
                          ? 'ayuswar-liquid-drained'
                          : ''
                      }`}
                      style={{
                        height:
                          ocrPhase === 'recognizing' && measuredProgress !== null
                            ? `${measuredProgress}%`
                            : ocrPhase === 'success'
                            ? '100%'
                            : ocrPhase === 'empty-error' || ocrPhase === 'failed'
                            ? '0%'
                            : '22%'
                      }}
                    >
                      {/* Sinusoidal Wave Crest */}
                      <svg
                        className="ayuswar-liquid-wave-svg"
                        viewBox="0 0 400 30"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M 0 15 Q 50 0 100 15 T 200 15 T 300 15 T 400 15 L 400 30 L 0 30 Z"
                          fill="rgba(45, 212, 191, 0.95)"
                        />
                      </svg>
                    </div>

                    {/* Foil Blister Cavity Rim Indicator */}
                    <div className="ayuswar-foil-pill-rim" />

                    {/* Center Phase Icon / Percentage Display */}
                    <div className="ayuswar-foil-center-hud">
                      {ocrPhase === 'success' ? (
                        <div className="ayuswar-liquid-success-badge">
                          <CheckCircle2 size={30} color="#FFFFFF" />
                          <span style={{ fontSize: '11px', fontWeight: 900, color: '#FFFFFF' }}>100%</span>
                        </div>
                      ) : ocrPhase === 'empty-error' || ocrPhase === 'failed' ? (
                        <div className="ayuswar-liquid-error-badge">
                          <AlertTriangle size={26} color="#F59E0B" />
                        </div>
                      ) : measuredProgress !== null ? (
                        <div className="ayuswar-liquid-percent-readout">
                          <span className="ayuswar-liquid-num">{measuredProgress}</span>
                          <span className="ayuswar-liquid-pct">%</span>
                        </div>
                      ) : (
                        <div className="ayuswar-liquid-prep-pulse">
                          <Scan size={24} color="#0F4C5C" className="ayuswar-liquid-scan-icon" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Accessible Status Copy & Action */}
                  <div className="ayuswar-liquid-status-block">
                    <div className="ayuswar-liquid-primary-label">
                      {ocrPhase === 'empty-error' && 'No readable result'}
                      {ocrPhase === 'failed' && 'Reading failed'}
                      {ocrPhase === 'success' && 'Reading complete'}
                      {(ocrPhase === 'preprocessing' || ocrPhase === 'loading-wasm' || ocrPhase === 'recognizing' || ocrPhase === 'idle') && 'Reading image on your device'}
                    </div>
                    <div className="ayuswar-liquid-subtext">
                      {ocrPhase === 'preprocessing' && 'Enhancing foil contrast with OpenCV.js...'}
                      {ocrPhase === 'loading-wasm' && 'Initializing in-memory Tesseract WASM...'}
                      {ocrPhase === 'recognizing' && (
                        <span>
                          Extracting text: <strong>{measuredProgress}%</strong>
                        </span>
                      )}
                      {ocrPhase === 'success' && 'Text recognized successfully!'}
                      {ocrPhase === 'empty-error' && 'No legible text detected. Ensure strip is held flat.'}
                      {ocrPhase === 'failed' && 'Recognition failed. Please try a clearer picture.'}
                    </div>
                    <div className="ayuswar-liquid-privacy-badge">
 Client-side execution • Image stays on your device
                    </div>

                    {/* Actions: Cancel during run, or Retry on empty/error */}
                    {(ocrPhase === 'empty-error' || ocrPhase === 'failed') ? (
                      <button
                        onClick={() => {
                          setOcrPhase('idle');
                          setIsScanning(false);
                          setUploadedImage(null);
                        }}
                        className="ayuswar-liquid-retry-btn"
                      >
                        <RefreshCw size={13} />
                        <span>Retry with Clearer Image</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleCancelOcr}
                        className="ayuswar-liquid-cancel-btn"
                      >
                        <X size={13} />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OpenCV.js Computer Vision Preprocessing Badge & Toggle - image scans only,
              hidden while a PDF text import is active (no image to preprocess) */}
          {liveOcrResult?.sourceKind !== 'pdf-text-layer' && (
          <div style={{
            background: useCvEnhancement ? '#F0FDF4' : 'var(--m-card-cool)',
            border: useCvEnhancement ? '1px solid #BBF7D0' : '1px solid #D0DFE2',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <span style={{ fontSize: '14px'}}></span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#091E26' }}>
                  OpenCV.js Adaptive Foil Binarization
                </div>
                <div style={{ fontSize: '10.5px', color: '#52707C' }}>
                  {cvStats 
                    ? `Otsu Threshold: ${cvStats.otsuThreshold} • Contrast Range: ${cvStats.minLuminance}–${cvStats.maxLuminance}`
                    : 'Optional image contrast preprocessing; it may not improve difficult foil text'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setUseCvEnhancement(v => !v)}
              style={{
                background: useCvEnhancement ? '#15803D' : '#94A3B8',
                color: '#FFFDF8',
                border: 'none',
                borderRadius: '14px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {useCvEnhancement ? 'Preprocessing on' : 'CV: OFF'}
            </button>
          </div>
          )}

          {/* Action Button */}
          {uploadedImage && (
            <button
              onClick={() => executeRealOcr(uploadedImage)}
              disabled={isScanning}
              style={{
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: '#0F4C5C',
                color: '#FFFDF8',
                fontSize: '13px',
                fontWeight: 800,
                cursor: isScanning ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.16)'
              }}
            >
              <RefreshCw size={16} />
              <span>{isScanning ? 'Processing In-Browser OCR...' : 'Re-run OCR Extraction on Upload'}</span>
            </button>
          )}
        </div>

        {/* Right Column: OCR Extraction & Formulary Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Raw Extracted Bounding Box / OCR Tokens */}
            <div style={{ background: '#0A2540', color: 'var(--m-card-cool)', padding: '12px 14px', borderRadius: '10px', fontSize: '11.5px', fontFamily: 'monospace', marginBottom: '18px', lineHeight: 1.5 }}>
              <div style={{ color: '#5EEAD4', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{liveOcrResult?.sourceKind === 'pdf-text-layer' ? '// PDF Text Layer Import (not OCR):' : '// Tesseract.js Extracted Text Tokens:'}</span>
                {liveOcrResult && (
                  <span style={{ color: '#6EE7B7', fontSize: '10.5px' }}>{liveOcrResult.sourceKind === 'pdf-text-layer' ? '● LOCAL PDF TEXT LAYER' : '● LIVE WASM EXTRACTION'}</span>
                )}
              </div>
              <div style={{ maxHeight: '80px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                {currentSample.extractedText}
              </div>
            </div>


          {/* Card: Resolved Active Chemical Compound */}
          <div style={{ background: 'var(--m-card)', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '24px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F4C5C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {currentSample.sourceKind === 'pdf-text-layer' ? 'PDF text import and unverified dictionary candidate' : 'OCR text and unverified dictionary candidate'}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 750, color: '#091E26', background: 'var(--m-card)', padding: '2px 8px', borderRadius: '6px', fontFamily: 'monospace' }}>
                {currentSample.nfiCode}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              {currentSample.realImageUrl && (
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '1.5px solid #D0DFE2',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                  <img 
                    src={currentSample.realImageUrl} 
                    alt={currentSample.brand} 
                    style={{ width: '100%', height: '100%', objectFit: currentSample.isLiveExtraction ? 'contain' : 'cover', background: 'var(--m-card)' }} 
                  />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '18px', fontWeight: 850, color: '#081C24', margin: '0 0 4px 0' }}>
                  {currentSample.genericSalt}
                </h2>
                <div style={{ fontSize: '12.5px', color: '#52707C' }}>
                  Form: {currentSample.dosageForm} • Brand: <strong>{currentSample.brand}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <span style={{ fontSize: '10.5px', background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, border: '1px solid #BAE6FD' }}>
 {currentSample.vectorConfidence || 'Unverified candidate'}
                  </span>
                  <span style={{ fontSize: '10.5px', background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontWeight: 750 }}>
                    Bundled reference only - not NFI verification
                  </span>
                </div>
                {currentSample.vernacularTe && (
                  <div style={{ fontSize: '12px', color: '#0F4C5C', fontWeight: 750, marginTop: '4px' }}>
                    తెలుగు: {currentSample.vernacularTe}
                  </div>
                )}
              </div>
            </div>

            {/* Sample Generic Cost Comparison */}
            <div style={{ background: 'var(--m-card)', borderRadius: '12px', border: '1px solid #D0DFE2', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#52707C', textTransform: 'uppercase' }}>
                  Availability and price status
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#081C24', marginTop: '2px' }}>
                  {currentSample.janAushadhiGeneric}
                </div>
                <div style={{ fontSize: '12px', color: '#486770', marginTop: '2px' }}>
                  Sample comparison only: <s>{currentSample.brandedPrice}</s> → <strong style={{ color: '#0F766E' }}>{currentSample.janAushadhiPrice}</strong>
                </div>
              </div>
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#047857' }}>
                  {currentSample.savingsPct}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 750, color: '#065F46' }}>
                  Sample estimate only
                </div>
              </div>
            </div>
          </div>

          {/* DDI Safety Alert if any */}
          {currentSample.ddiConflict ? (
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '14px', padding: '18px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <AlertTriangle size={20} color="#DC2626" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#991B1B', marginBottom: '4px' }}>
                  Automated Safety Sentinel Alert
                </div>
                <p style={{ fontSize: '12.5px', color: '#B91C1C', lineHeight: 1.5, margin: 0 }}>
                  {currentSample.ddiConflict}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} color="#15803D" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>
                Interaction safety has not been established. Missing warnings do not mean safe.
              </span>
            </div>
          )}

          {/* Feature 4: NEJM AI Pharmacovigilance & Beers Criteria Sentinel Card */}
          <div style={{
            background: beersSafety.bgColor,
            border: `1.5px solid ${beersSafety.borderColor}`,
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color={beersSafety.color} />
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#081C24' }}>
                  Medication safety review - not a clearance
                </span>
              </div>
              <span style={{
                background: beersSafety.color,
                color: '#FFFDF8',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '12px'
              }}>
                {beersSafety.badge}
              </span>
            </div>

            {/* Interactive Clinical Controls: Age Profile & eGFR Level */}
            <div style={{
              background: 'var(--m-card)',
              borderRadius: '12px',
              padding: '12px',
              border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {/* Age Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 750, color: '#486770' }}>
                  Patient Age Profile:
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setPatientAgeProfile('adult')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: patientAgeProfile === 'adult' ? '1.5px solid #0F4C5C' : '1px solid #D0DFE2',
                      background: patientAgeProfile === 'adult' ? '#E6FAF8' : 'var(--m-card-cool)',
                      color: patientAgeProfile === 'adult' ? '#0F4C5C' : '#52707C',
                      fontSize: '11.5px',
                      fontWeight: 750,
                      cursor: 'pointer'
                    }}
                  >
                    Adult (&lt;65 yrs)
                  </button>
                  <button
                    onClick={() => setPatientAgeProfile('geriatric')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: patientAgeProfile === 'geriatric' ? '1.5px solid #B91C1C' : '1px solid #D0DFE2',
                      background: patientAgeProfile === 'geriatric' ? '#FEE2E2' : 'var(--m-card-cool)',
                      color: patientAgeProfile === 'geriatric' ? '#B91C1C' : '#52707C',
                      fontSize: '11.5px',
                      fontWeight: 750,
                      cursor: 'pointer'
                    }}
                  >
                    Geriatric (≥65 yrs Beers)
                  </button>
                </div>
              </div>

              {/* eGFR Renal Function Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 750, color: '#486770' }}>
                  Renal Function (eGFR):
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { id: 'normal', label: '>60 mL/min' },
                    { id: 'mild', label: '30–59 (Mild)' },
                    { id: 'severe', label: '<30 (Severe)' }
                  ].map(eg => (
                    <button
                      key={eg.id}
                      onClick={() => setPatientEgfrProfile(eg.id)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '8px',
                        border: patientEgfrProfile === eg.id ? '1.5px solid #0A2540' : '1px solid #D0DFE2',
                        background: patientEgfrProfile === eg.id ? '#0A2540' : 'var(--m-card-cool)',
                        color: patientEgfrProfile === eg.id ? '#FFFFFF' : '#52707C',
                        fontSize: '11px',
                        fontWeight: 750,
                        cursor: 'pointer'
                      }}
                    >
                      {eg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sentinel Findings & Recommendation */}
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: beersSafety.color, marginBottom: '4px' }}>
                {beersSafety.title}
              </div>
              <div style={{ fontSize: '12px', color: '#2C4A52', lineHeight: 1.5, marginBottom: '6px' }}>
                {beersSafety.details}
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.8)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                color: '#081C24',
                border: '1px solid rgba(0,0,0,0.06)'
              }}>
 <strong>Sentinel Recommendation:</strong> {beersSafety.recommendation}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scoped CSS for Teal Liquid Wave in Rounded Foil Container */}
      <style>{`
        .ayuswar-foil-liquid-overlay {
          position: absolute;
          inset: 0;
          background: rgba(8, 28, 36, 0.94);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 16px;
          z-index: 50;
        }

        /* Medicine Foil Container */
        .ayuswar-foil-blister-card {
          position: relative;
          width: 140px;
          height: 165px;
          border-radius: 28px;
          border: 2px solid #D4AF37;
          background: radial-gradient(circle at 50% 30%, #0F3B4A 0%, #061B23 100%);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16), inset 0 2px 4px rgba(255, 255, 255, 0.2);
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .ayuswar-foil-emboss-pattern {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(45, 212, 191, 0.12) 1px, transparent 1px);
          background-size: 8px 8px;
          pointer-events: none;
          z-index: 2;
        }

        .ayuswar-foil-pill-rim {
          position: absolute;
          top: 14px;
          bottom: 14px;
          left: 20px;
          right: 20px;
          border-radius: 999px;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          pointer-events: none;
          z-index: 3;
        }

        /* Teal Liquid Wave Body */
        .ayuswar-liquid-body {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: #0F4C5C;
          transition: height 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1;
        }

        .ayuswar-liquid-indeterminate {
          animation: liquidWaveHover 2.2s ease-in-out infinite alternate;
        }

        .ayuswar-liquid-drained {
          background: rgba(239, 68, 68, 0.15) !important;
        }

        .ayuswar-liquid-wave-svg {
          position: absolute;
          top: -12px;
          left: 0;
          width: 200%;
          height: 14px;
          animation: liquidWaveSlide 2.5s linear infinite;
        }

        .ayuswar-foil-center-hud {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 4;
          pointer-events: none;
        }

        .ayuswar-liquid-percent-readout {
          display: flex;
          align-items: baseline;
          gap: 2px;
          color: #FFFFFF;
          font-family: var(--font-main);
          font-weight: 850;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        }

        .ayuswar-liquid-num {
          font-size: 32px;
          line-height: 1;
        }

        .ayuswar-liquid-pct {
          font-size: 14px;
          color: #0F4C5C;
        }

        .ayuswar-liquid-success-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          animation: successPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ayuswar-liquid-scan-icon {
          animation: iconFloat 2s ease-in-out infinite;
        }

        /* Status copy */
        .ayuswar-liquid-status-block {
          text-align: center;
          max-width: 290px;
          color: #FFFFFF;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .ayuswar-liquid-primary-label {
          font-size: 13.5px;
          font-weight: 800;
          letter-spacing: -0.2px;
          color: #FFFFFF;
        }

        .ayuswar-liquid-subtext {
          font-size: 11.5px;
          color: #D1E1E6;
          line-height: 1.4;
        }

        .ayuswar-liquid-privacy-badge {
          font-size: 9.5px;
          font-weight: 750;
          color: #99F6E4;
          background: rgba(45, 212, 191, 0.16);
          border: 1px solid rgba(45, 212, 191, 0.45);
          padding: 2px 8px;
          border-radius: 6px;
          margin-top: 2px;
        }

        .ayuswar-liquid-cancel-btn {
          margin-top: 8px;
          padding: 6px 14px;
          min-height: 38px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #D0DFE2;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: background 0.15s ease;
        }

        .ayuswar-liquid-retry-btn {
          margin-top: 8px;
          padding: 7px 16px;
          min-height: 40px;
          border-radius: 8px;
          background: #B45309;
          border: none;
          color: #FFFFFF;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35);
        }

        @keyframes liquidWaveSlide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes liquidWaveHover {
          0% { height: 18%; }
          100% { height: 26%; }
        }

        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); opacity: 0.7; }
          50% { transform: translateY(-4px); opacity: 1; }
        }

        @keyframes successPop {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* prefers-reduced-motion: static status, no waves/ripples/spinners */
        @media (prefers-reduced-motion: reduce) {
          .ayuswar-liquid-wave-svg,
          .ayuswar-liquid-indeterminate,
          .ayuswar-liquid-scan-icon,
          .ayuswar-liquid-success-badge {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
