# AyuSwar Performance Report

Generated from `PERFORMANCE_METRICS.json` in this folder, produced by
`node scripts/measure_performance.mjs` (reproducible; fails loudly when a
build step fails).

## What this report measures - and what it does not

Measured here, on one sandbox machine:

- Production build step durations (vite build, prerender, service-worker
  manifest).
- Built bundle composition and sizes (dist/).
- Test suite wall-clock duration (from the recorded suite run).

**Not measured here - no app-performance claim is made:**

- App startup / time-to-interactive latency.
- Render, frame-rate or scroll performance.
- ASR/TTS inference speed on real audio.
- Native Android runtime performance (WebView cold start, bridge latency).
- Memory usage under load, battery drain, real-network behavior.

Reason: this environment has no Android device or emulator session and no
instrumented runtime harness, so none of those workloads exist to measure.
Build seconds and suite seconds are toolchain throughput on this machine,
NOT user-perceived performance, and are not presented as such.

## Environment (workload qualification)

| Fact | Value |
|---|---|
| Machine | 1 vCPU Intel Xeon 6975P-C, 1993 MB RAM, linux x64 (sandbox) |
| Node | v22.23.5 |
| Git revision | 89aad44 (working tree dirty at measurement time: the performance script/report themselves were uncommitted) |
| Measured at | recorded in PERFORMANCE_METRICS.json (`generatedAt`) |

## Measured: production build

Workload: full production build, 2255 modules transformed (vite v8.3.3).

| Step | Wall time |
|---|---|
| vite build | 3495 ms |
| prerender | 40 ms |
| generate-sw-manifest | 26 ms |
| **Total** | **3561 ms** |

## Measured: built bundle (dist/)

289 files, 119,169,686 bytes total. Composition by extension:

| Extension | Files | Bytes |
|---|---|---|
| .wasm | 5 | 52,945,051 |
| .js | 99 | 18,997,115 |
| .bin | 4 | 16,038,316 |
| .png | 45 | 8,926,146 |
| .jpg | 25 | 8,760,106 |
| .wav | 20 | 4,785,280 |
| .traineddata | 1 | 4,113,088 |
| .mjs | 3 | 1,343,903 |

Largest assets: `ort-wasm-simd-threaded.jsep.wasm` 29,520,971 B,
`ort-wasm-simd-threaded.wasm` 14,848,852 B, YAMNet model shards 4 x
4,194,304 B, `eng.traineddata` (Tesseract) 4,113,088 B.

Service worker precache: 191 static shell assets (dist/sw-assets.json).

Note: the 119 MB dist total is dominated by on-device ML payloads (ONNX
Runtime WASM, YAMNet, Tesseract) and media. This is a size fact, not a
load-time measurement; what a user actually downloads depends on route,
cache and lazy-loading behavior, which were not measured.

## Measured: test suite duration

396 specs executed and passed, 3 conditional skips, 0 failed in 91.24 s
(recorded run at 89aad44). This is suite wall-clock on the same sandbox,
not app performance.

## Related published artifact (size fact only)

The published v0.3.34-faea07f debug APK is 78,487,226 bytes (see the APK
provenance document). APK install-size/startup behavior on a device was
not measured.

## Missing metrics and what would be needed

| Missing metric | Needed to measure honestly |
|---|---|
| Startup / TTI latency | Android device or emulator with tracing |
| Render/frame performance | Device profiling (e.g. Android Studio profiler) |
| ASR/TTS inference speed | Timed runs over real recorded audio on target hardware |
| Memory/battery under load | Device soak testing |
| Network behavior (sync retries, backoff timing in the wild) | Instrumented backend + devices |

## Reproduce

```
node scripts/measure_performance.mjs
```

Writes `PERFORMANCE_METRICS.json` next to this report, recording the git
revision and dirty state at measurement time.
