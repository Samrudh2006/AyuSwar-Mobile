# APK size and performance notes (debug APK 992b1dd)

Measured static/package facts from `ayuswar-mobile-debug-992b1dd.apk`
(78,135,400 bytes, SHA-256
e3589637198a47fc71461d0be4ecc00122afe4a3cbccd62d2bf0b76a3e6622c3),
enumerated 2026-11-20 with `unzip -l`. These are package contents only;
they say nothing by themselves about on-phone latency, memory or battery,
which have not been measured on a physical device.

Identity note (verified 2026-11-20): the published release asset
`AyuSwar-Mobile-66353cf-debug.apk` (SHA-256
1bddbc3542fcd9e3f9098fdbad3351946d17a9bef4f36393208095c07bf81ca1) is
ALSO exactly 78,135,400 bytes. The two files are different builds from
different commits: the release asset was re-downloaded and hash-verified,
and its zip entries differ from the 992b1dd APK's (114 entry lines
differ, including renamed content-hashed JS bundles; uncompressed
totals 134,972,653 vs 135,014,219). The equal compressed size is a
coincidence of zip totals, so SHA-256, not byte size, is the artifact
identifier throughout.

## Where the 78 MB goes (uncompressed sizes inside the APK, 128.8 MB total)

| Component | Size | Notes |
| --- | --- | --- |
| `assets/public/ort-wasm/` | 42.4 MB | ONNX Runtime Web WASM, TWO variants shipped: `ort-wasm-simd-threaded.jsep.wasm` (28.2 MB) + `ort-wasm-simd-threaded.wasm` (14.2 MB). A device executes one of them, chosen at runtime. |
| `assets/public/models/yamnet-v1/` | 15.9 MB | YAMNet TFJS model, 4 shards (acoustic lab). |
| `assets/public/models/tesseract-core/` | ~11 MB | Three JS/WASM variant builds (lstm, simd-lstm, relaxedsimd-lstm), one chosen at runtime. |
| `assets/public/models/tessdata/eng.traineddata` | 3.9 MB | OCR language data (English only). |
| `.wasm` total | 50.5 MB | Across ort + tesseract. |
| `.js` total | 17.4 MB | App bundle + tesseract JS variants. |
| Images (png 8.5 + jpg 8.4) | 16.9 MB | Section illustrations; only 0.8 MB is webp. Splash screens alone are ~5 MB across densities in `res/`. |
| `.wav` | 4.6 MB | Bundled sample audio. |
| `classes*.dex` | 8.6 MB | Debug build, no R8/minify. |
| `res/` | 8.3 MB | Launcher icons + splash densities. |

No `lib/` native libraries: there is no per-ABI duplication, so ABI
splits are not a size lever here.

## Size-reduction options (each with its trade-off)

1. Ship one ONNX Runtime variant (~14 MB saved). Keep the jsep build
   for modern WebViews; dropping the classic fallback means older
   WebViews lose the acoustic-lab model path. Which WebView versions
   need the fallback has not been verified.
2. Ship one tesseract-core variant (~7 MB saved). Same runtime-fallback
   question; the scanner falls back to a non-SIMD build on older
   devices today.
3. Convert section PNG/JPG illustrations to webp (~8-10 MB estimated,
   not yet measured per file). No functional trade-off; quality needs a
   visual check.
4. Move YAMNet + tessdata + ort to runtime download (~60 MB saved),
   using the same release-asset pattern as the ASR manifest
   (src/services/localVoice/localAsrManifest.js). Conflicts with the
   offline-first requirement in the brief unless first-run-with-network
   is accepted; a download-failure state must exist per feature.
5. Release build with R8/ProGuard and resource shrinking (dex/res
   reduction; debug-only overhead removed). Standard release hygiene,
   already the plan for any non-debug build.
6. Regenerate splash screens at lower weight (~3-4 MB across `res/`).

Illustrative floor, not a promise: options 1+2+3 keep everything
on-device and land roughly in the mid-50 MB range; adding option 4
approaches ~15-20 MB at the cost of the offline guarantee for the
affected features on first run.

## Performance: what is NOT measured

- Phone startup time, WASM compile/instantiate time for ort/tesseract,
  YAMNet inference latency, memory footprint, and battery impact are all
  unmeasured. The 28 MB jsep WASM in particular implies a large
  compile step on first acoustic-lab use; whether that is acceptable on
  the user's phone class is an open question requiring a physical-device
  test (physical-phone test remains a parked user decision).
- Web-page weight: 183 static shell assets are precached by the service
  worker (dist/sw-assets.json); first-load and cache-update data cost
  has not been measured on a mobile network.

## Decision needed (user)

The main fork is option 4 (runtime model downloads) versus keeping the
APK fully self-contained: it trades APK size against the brief's
offline-first requirement. Variant pruning (1-3) is safe to do
regardless once the fallback-WebView question in (1)(2) is answered.
