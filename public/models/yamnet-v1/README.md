# Google YAMNet TFJS v1
Original Google model downloaded from the official Kaggle model variation with kagglehub. Unmodified graph/four weight shards. labels.json is a parsed JSON form of the original class CSV. Retain Apache 2.0 license and attribution.

For React/Capacitor: bundle locally, lazy-load TensorFlow.js and graph, input float32 mono 16kHz samples. Use model output whose last dimension is 521 as scores; embedding dimension is1024. Warm-up and dispose tensors. Scores are independent, uncalibrated event scores, NOT probabilities, not medical diagnoses. Never softmax the521scores or display a certainty percentage.

Initial evaluation using TFJS4.22.0 CPU on12one-second real excerpts plus2separate synthetic tones found cough/speech recognition in some examples but also Sneeze for cough and unrelated labels for vowels/breathing. This is inference/debugging evidence, NOT accuracy validation. Require Unknown/Uncertain presentation and declared user-selected task. Do not use predicted type as a hard gate to silently discard valid audio. Browser/WebView/Android latency and memory must be tested. Keep raw class names as event hints, not patient labels.
