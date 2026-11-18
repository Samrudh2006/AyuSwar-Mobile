import { PitchDetector } from 'pitchy';
/**
 * AyuSwar AI — Acoustic DSP & Feature Extraction Engine (acousticDspEngine.js)
 *
 * Implements digital signal processing for voice and audio signals:
 * 1. Pitch estimation using the YIN algorithm with sub-sample parabolic interpolation.
 * 2. Adjacent-frame period and RMS variation (not cycle jitter/shimmer).
 * 3. Periodicity-residual-derived HNR estimate (dB).
 * 4. Spectral Centroid (Hz).
 * 5. Silence & empty buffer detection with honest error throwing.
 * 6. Honest unvoiced / aperiodic signal handling (F0 reported as unavailable).
 *
 * NON-DIAGNOSTIC NOTICE:
 * Physical acoustic parameters are audio engineering measurements, not medical diagnoses.
 */

export const LAB_STATES = {
  AWAITING_AUDIO: 'AWAITING_AUDIO',
  RECORDING: 'RECORDING',
  ANALYSING: 'ANALYSING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR'
};

// In-place iterative radix-2 FFT. re/im are Float32Array of length n (power of 2).
function fftRadix2(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cwr = 1;
      let cwi = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k];
        const ui = im[i + k];
        const vr = re[i + k + len / 2] * cwr - im[i + k + len / 2] * cwi;
        const vi = re[i + k + len / 2] * cwi + im[i + k + len / 2] * cwr;
        re[i + k] = ur + vr;
        im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr;
        im[i + k + len / 2] = ui - vi;
        const ncwr = cwr * wr - cwi * wi;
        cwi = cwr * wi + cwi * wr;
        cwr = ncwr;
      }
    }
  }
}

// True spectral centroid (Hz): frequency-bin magnitudes from a Hann-windowed DFT,
// not time-domain sample positions.
function spectralCentroidHz(frame, sampleRate) {
  const n = frame.length;
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1))); // Hann
    re[i] = frame[i] * w;
  }
  fftRadix2(re, im);
  let num = 0;
  let den = 0;
  const binHz = sampleRate / n;
  for (let k = 1; k <= n / 2; k++) {
    const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
    num += k * binHz * mag;
    den += mag;
  }
  return den > 0 ? num / den : 0;
}

/**
 * Computes physical acoustic DSP metrics from raw floating-point audio channel data.
 * @param {Float32Array|number[]} channelData - Audio samples in range [-1.0, 1.0]
 * @param {number} sampleRate - Sample rate in Hz (e.g., 44100 or 48000)
 * @returns {Object} Extracted acoustic features
 */
export function computeAcousticDspMetrics(channelData, sampleRate) {
  if (!channelData || channelData.length === 0) {
    throw new Error('Audio input is empty. Please provide valid audio.');
  }

  // 1. Global RMS Energy & Silence Gate
  let totalSumSq = 0;
  for (let i = 0; i < channelData.length; i++) {
    totalSumSq += channelData[i] * channelData[i];
  }
  const globalRms = Math.sqrt(totalSumSq / channelData.length);
  if (globalRms < 0.001) {
    throw new Error('Audio signal is silent or empty. Please record or upload audible sound.');
  }

  const durationSec = Number((channelData.length / sampleRate).toFixed(2));
  const frameSize = 2048;
  const halfBufferSize = Math.floor(frameSize / 2);
  const hopSize = 1024;
  const numFrames = Math.max(1, Math.floor((channelData.length - frameSize) / hopSize));

  const pitchEstimates = [];
  const chronologicalPitchTrack = [];
  const hnrEstimates = [];
  const amplitudes = [];
  let totalCentroid = 0;
  let centroidFrames = 0;
  const pitchyDetector = PitchDetector.forFloat32Array(frameSize);
  const pitchyFrames = [];

  // Search range: 50 Hz to 500 Hz
  const minTau = Math.max(2, Math.floor(sampleRate / 500));
  const maxTau = Math.min(halfBufferSize - 1, Math.floor(sampleRate / 50));

  for (let f = 0; f < numFrames; f++) {
    const start = f * hopSize;
    const frame = channelData.subarray(start, Math.min(channelData.length, start + frameSize));
    if (frame.length < frameSize) break;

    // Frame RMS
    let frameSumSq = 0;
    for (let i = 0; i < frameSize; i++) {
      frameSumSq += frame[i] * frame[i];
    }
    const frameRms = Math.sqrt(frameSumSq / frameSize);
    if (frameRms < 0.005) continue; // Skip ambient noise / silence

    // Spectral Centroid (real DFT magnitude spectrum, Hann-windowed)
    const centroidHz = spectralCentroidHz(frame, sampleRate);
    if (centroidHz > 0) {
      totalCentroid += centroidHz;
      centroidFrames++;
    }

    // Independent MPM/clarity estimate from pinned MIT-licensed Pitchy 4.1.0.
    const [mpmF0, clarity] = pitchyDetector.findPitch(frame, sampleRate);
    if (Number.isFinite(mpmF0) && mpmF0 >= 50 && mpmF0 <= 500 && clarity >= 0.8) {
      pitchyFrames.push({ f0: mpmF0, clarity });
    }

    // YIN Pitch Estimation
    // Step 1: Difference Function
    const yinBuffer = new Float32Array(halfBufferSize);
    for (let tau = 0; tau < halfBufferSize; tau++) {
      let sum = 0;
      for (let i = 0; i < halfBufferSize; i++) {
        const delta = frame[i] - frame[i + tau];
        sum += delta * delta;
      }
      yinBuffer[tau] = sum;
    }

    // Step 2: Cumulative Mean Normalized Difference Function
    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < halfBufferSize; tau++) {
      runningSum += yinBuffer[tau];
      yinBuffer[tau] = (yinBuffer[tau] * tau) / (runningSum || 1);
    }

    // Step 3: Absolute Threshold Search
    const threshold = 0.15;
    let tau = minTau;
    while (tau < maxTau) {
      if (yinBuffer[tau] < threshold) {
        while (tau + 1 < maxTau && yinBuffer[tau + 1] < yinBuffer[tau]) {
          tau++;
        }
        break;
      }
      tau++;
    }

    let isVoiced = false;
    let bestTau = tau;

    if (tau < maxTau && yinBuffer[tau] < threshold) {
      isVoiced = true;
    } else {
      // Secondary check for distinct minimum below 0.22
      let minVal = Infinity;
      let minT = -1;
      for (let t = minTau; t < maxTau; t++) {
        if (yinBuffer[t] < minVal) {
          minVal = yinBuffer[t];
          minT = t;
        }
      }
      if (minVal < 0.22) {
        bestTau = minT;
        isVoiced = true;
      }
    }

    // Step 4: Sub-sample Parabolic Interpolation
    if (isVoiced && bestTau > 0) {
      let betterTau = bestTau;
      if (bestTau > 0 && bestTau < halfBufferSize - 1) {
        const s0 = yinBuffer[bestTau - 1];
        const s1 = yinBuffer[bestTau];
        const s2 = yinBuffer[bestTau + 1];
        const denom = 2 * (s0 - 2 * s1 + s2);
        if (denom !== 0) {
          betterTau = bestTau + (s0 - s2) / denom;
        }
      }

      const f0 = sampleRate / betterTau;
      if (f0 >= 50 && f0 <= 500) {
        pitchEstimates.push(f0);
        chronologicalPitchTrack.push({
          timeSec: Number((start / sampleRate).toFixed(2)),
          f0: Math.round(f0 * 10) / 10,
          rms: Number(frameRms.toFixed(3))
        });
        amplitudes.push(frameRms);

        const dVal = Math.max(0.0001, Math.min(0.99, yinBuffer[bestTau]));
        const hnr = 10 * Math.log10((1 - dVal) / dVal);
        hnrEstimates.push(Math.max(0, hnr));
      }
    }
  }

  const avgCentroid = centroidFrames > 0 ? Math.round(totalCentroid / centroidFrames) : null;
  const hasVoicing = pitchEstimates.length > 0;

  // Unvoiced / Aperiodic input handling
  if (!hasVoicing) {
    return {
      status: 'SUCCESS',
    sampleRate,
      isVoiced: false,
      durationSec,
      totalFrames: numFrames,
      voicedFrames: 0,
      pitchF0: null, // honestly unavailable
      pitchRegister: 'Unavailable (Unvoiced)',
      jitterPct: null, // honestly unavailable
      shimmerPct: null, // honestly unavailable
      hnrDb: null, // honestly unavailable
      spectralCentroid: avgCentroid,
      signalLabel: 'Unvoiced / Broadband Aperiodic Signal',
      providerLabel: 'Browser-based DSP - prototype analysis'
    };
  }

  // Median Pitch F0 for robustness against octave jumps (sorted COPY; chronological order kept for jitter)
  const sortedPitch = [...pitchEstimates].sort((a, b) => a - b);
  const medianF0 = Number((sortedPitch[Math.floor(sortedPitch.length / 2)]).toFixed(1));
  const mpmSorted = pitchyFrames.map(f => f.f0).sort((a,b) => a-b);
  const pitchyF0 = mpmSorted.length ? Number(mpmSorted[Math.floor(mpmSorted.length / 2)].toFixed(1)) : null;
  const clarityValues = pitchyFrames.map(f => f.clarity).sort((a,b) => a-b);
  const pitchyClarity = clarityValues.length ? Number(clarityValues[Math.floor(clarityValues.length / 2)].toFixed(3)) : null;

  // Adjacent voiced-frame period variation, not cycle-to-cycle jitter.
  const chronologicalF0 = chronologicalPitchTrack.map((p) => p.f0);
  let periodDiffSum = 0;
  let totalPeriod = 0;
  const periods = chronologicalF0.map((f) => 1000.0 / f);
  for (let i = 0; i < periods.length - 1; i++) {
    periodDiffSum += Math.abs(periods[i + 1] - periods[i]);
    totalPeriod += periods[i];
  }
  totalPeriod += periods[periods.length - 1];
  const avgPeriod = periods.length > 0 ? totalPeriod / periods.length : 0;
  const jitterPct = periods.length > 1 && avgPeriod > 0
    ? Number((((periodDiffSum / (periods.length - 1)) / avgPeriod) * 100).toFixed(2))
    : 0.0;

  // Adjacent voiced-frame RMS variation, not cycle-to-cycle shimmer.
  let ampDiffSum = 0;
  let totalAmp = 0;
  for (let i = 0; i < amplitudes.length - 1; i++) {
    ampDiffSum += Math.abs(amplitudes[i + 1] - amplitudes[i]);
    totalAmp += amplitudes[i];
  }
  totalAmp += amplitudes[amplitudes.length - 1];
  const avgAmp = totalAmp / amplitudes.length;
  const shimmerPct = amplitudes.length > 1 && avgAmp > 0
    ? Number((((ampDiffSum / (amplitudes.length - 1)) / avgAmp) * 100).toFixed(2))
    : 0.0;

  // Median Harmonics-to-Noise Ratio (HNR in dB)
  hnrEstimates.sort((a, b) => a - b);
  const medianHnr = Number((hnrEstimates[Math.floor(hnrEstimates.length / 2)]).toFixed(1));

  // Pitch estimates show octave disagreements on real-vowel comparator checks.
  // Disable arbitrary physiological/clinical derivatives rather than renaming them.
  const pitchRegister = 'Experimental F0; octave ambiguity unresolved';
  const cppDb = null;
  const f1Hz = null;
  const f2Hz = null;
  const voiceHealthScore = null;
  const glottalClosureQuality = null;

  return {
    status: 'SUCCESS',
    sampleRate,
    isVoiced: true,
    durationSec,
    totalFrames: numFrames,
    voicedFrames: pitchEstimates.length,
    pitchF0: Math.round(medianF0 * 10) / 10,
    pitchRegister,
    pitchReliability: 'experimental-octave-ambiguity',
    pitchyF0, pitchyClarity, pitchyVersion: '4.1.0',
    measurementDefinitions: { jitterPct: 'adjacent-voiced-frame-period-variation', shimmerPct: 'adjacent-voiced-frame-rms-variation', hnrDb: 'yin-residual-derived-estimate' },
    jitterPct,
    shimmerPct,
    hnrDb: medianHnr,
    cppDb,
    f1Hz,
    f2Hz,
    voiceHealthScore,
    glottalClosureQuality,
    pitchTrack: chronologicalPitchTrack,
    spectralCentroid: avgCentroid,
    signalLabel: 'Voiced Phonation Signal',
    providerLabel: 'Browser-based DSP - prototype analysis'
  };
}
