// Presentation shared by on-screen and exported research measurements.
// No clinical norms or disease interpretation are derived from these estimates.
export function acousticResearchRows(metrics) {
  const value = (number, unit) => Number.isFinite(number) ? `${number} ${unit}` : 'Unavailable';
  return [
    ['Spectral centroid', value(metrics.spectralCentroid, 'Hz'), 'FFT magnitude-weighted spectral centre.'],
    ['Pitchy MPM pitch candidate', value(metrics.pitchyF0, 'Hz'), 'Pitchy 4.1.0, MIT. Periodic pitch estimate, not disease inference; octave ambiguity remains.'],
    ['Pitchy clarity', value(metrics.pitchyClarity, '(0-1)'), 'Periodicity measure, NOT correctness confidence or disease probability. High clarity can accompany a wrong octave.'],
    ['YIN pitch candidate', value(metrics.pitchF0, 'Hz'), 'Experimental estimate. Octave disagreement found in real vowel comparisons; not a verified pitch measurement.'],
    ['Frame period variation', value(metrics.jitterPct, '%'), 'Adjacent voiced-frame period variation. Not cycle-to-cycle jitter; depends on pitch estimates.'],
    ['Frame RMS variation', value(metrics.shimmerPct, '%'), 'Adjacent voiced-frame amplitude variation. Not cycle-to-cycle shimmer.'],
    ['Periodicity-derived HNR estimate', value(metrics.hnrDb, 'dB'), 'YIN residual-derived engineering estimate, not a clinical HNR test.'],
    ['CPP / formants / voice-health score', 'Not measured', 'Unsupported derived values are disabled. No disease inference or clinical normality assessment.']
  ];
}
