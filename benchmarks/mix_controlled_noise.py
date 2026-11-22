#!/usr/bin/env python3
"""mix_controlled_noise.py — seeded, SNR-controlled noise mixing over the
FLEURS eval audio for the controlled-noise ASR degradation measurement.

This is SYNTHETIC CORRUPTION of real read speech: it answers "how does the
offline fallback ASR degrade as crowd-noise SNR drops", nothing more. It is
not recorded clinical noise and does not simulate the in-app capture path.

Noise source: Microsoft MS-SNSD (https://github.com/microsoft/MS-SNSD),
noise_test/Babble_*.wav (16 kHz mono int16). LICENSE UNRESOLVED: the repo
README licenses code as MIT but noise data under upstream terms (Freesound
CC0 selections or DEMAND CC BY-SA 3.0) with no per-file mapping, and the
Babble files carry no metadata. Output of this script is provisional and
not for publication until re-run with a clearly licensed noise source.

Method (kept deliberately simple and fully recorded):
- Per clip, a seeded RNG (master seed + clip filename) picks the noise file
  and a random start offset inside it.
- Speech level: whole-clip RMS of the float32 FLEURS signal (no VAD;
  FLEURS clips are short and speech-dominant — recorded as a limit).
- Noise gain = rms_speech / (rms_noise_segment * 10^(snr_db/20)).
- Mixed signal clamped to int16 range, written as 16 kHz mono int16 WAV.

Usage:
  python3 benchmarks/mix_controlled_noise.py \
    --audio-dir eval-data/fleurs/te_in/audio/test \
    --noise-dir /tmp/noise --out-dir /tmp/noisy-fleurs/te_in/test \
    --snrs 20 10 5 --seed 20261122
"""
import argparse, hashlib, json, math, os, struct, sys, wave

def read_wav_float(path):
    """Return (list_of_float, framerate). Handles int16 (fmt 1) and float32 (fmt 3) mono."""
    with open(path, 'rb') as fh:
        buf = fh.read()
    if buf[0:4] != b'RIFF' or buf[8:12] != b'WAVE':
        raise ValueError(f'not RIFF/WAVE: {path}')
    pos, fmt, data, sr = 12, None, None, None
    while pos + 8 <= len(buf):
        cid = buf[pos:pos+4]; size = struct.unpack('<I', buf[pos+4:pos+8])[0]
        if cid == b'fmt ':
            fmt = struct.unpack('<H', buf[pos+8:pos+10])[0]
            ch = struct.unpack('<H', buf[pos+10:pos+12])[0]
            sr = struct.unpack('<I', buf[pos+12:pos+16])[0]
            if ch != 1:
                raise ValueError(f'mono only: {path}')
        elif cid == b'data':
            data = buf[pos+8:pos+8+size]
        pos += 8 + size + (size & 1)
    if fmt == 1:
        n = len(data) // 2
        return [s / 32768.0 for s in struct.unpack(f'<{n}h', data)], sr
    if fmt == 3:
        n = len(data) // 4
        return list(struct.unpack(f'<{n}f', data)), sr
    raise ValueError(f'unsupported wav format {fmt}: {path}')

def write_wav_int16(path, samples, sr):
    clipped = [max(-32768, min(32767, int(round(s * 32768.0)))) for s in samples]
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(struct.pack(f'<{len(clipped)}h', *clipped))

def rms(xs):
    return math.sqrt(sum(x * x for x in xs) / max(1, len(xs)))

def clip_seed(master, name):
    h = hashlib.sha256(f'{master}:{name}'.encode()).digest()
    return int.from_bytes(h[:8], 'big')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--audio-dir', required=True)
    ap.add_argument('--noise-dir', required=True)
    ap.add_argument('--out-dir', required=True)
    ap.add_argument('--snrs', type=float, nargs='+', required=True)
    ap.add_argument('--seed', type=int, required=True)
    ap.add_argument('--noise-glob', default='Babble_*.wav')
    args = ap.parse_args()

    import glob, random
    noise_files = sorted(glob.glob(os.path.join(args.noise_dir, args.noise_glob)))
    if not noise_files:
        sys.exit(f'no noise files matching {args.noise_glob} in {args.noise_dir}')
    noises = []
    for nf in noise_files:
        samples, sr = read_wav_float(nf)
        if sr != 16000:
            sys.exit(f'noise not 16kHz: {nf}')
        noises.append((os.path.basename(nf), samples))

    clips = sorted(glob.glob(os.path.join(args.audio_dir, '*.wav')))
    if not clips:
        sys.exit(f'no clips in {args.audio_dir}')

    import hashlib as _hl
    noise_pins = {n: _hl.sha256(open(os.path.join(args.noise_dir, n), 'rb').read()).hexdigest() for n, _ in noises}
    manifest = {'seed': args.seed, 'snrs': args.snrs, 'noise_files': [n for n, _ in noises],
                'noise_sha256': noise_pins,
                'noise_upstream': {'repo': 'https://github.com/microsoft/MS-SNSD',
                                   'revision': 'fe61c4ba0d9ac8dd7e23d719cc79f8947e1dc742',
                                   'files_uploaded_in': '2bb469c2765658dd0d7e527959876c909e14e21b'},
                'method': 'whole-clip speech RMS (no VAD), random noise offset, int16 clamp',
                'clips': []}
    for snr in args.snrs:
        os.makedirs(os.path.join(args.out_dir, f'snr{snr:g}'), exist_ok=True)
    for clip in clips:
        name = os.path.basename(clip)
        speech, sr = read_wav_float(clip)
        if sr != 16000:
            sys.exit(f'clip not 16kHz: {clip}')
        rng = random.Random(clip_seed(args.seed, name))
        noise_name, noise = noises[rng.randrange(len(noises))]
        speech_rms = rms(speech)
        entry = {'clip': name, 'noise': noise_name, 'speech_rms': round(speech_rms, 8), 'levels': {}}
        for snr in args.snrs:
            need = len(speech)
            off = rng.randrange(0, len(noise) - need - 1) if len(noise) > need + 1 else 0
            seg = noise[off:off + need]
            if len(seg) < need:
                seg = (seg * (need // max(1, len(seg)) + 1))[:need]
            n_rms = rms(seg)
            gain = speech_rms / (n_rms * (10.0 ** (snr / 20.0)))
            mixed = [s + g * n for s, n, g in zip(speech, seg, [gain] * need)]
            out_path = os.path.join(args.out_dir, f'snr{snr:g}', name)
            write_wav_int16(out_path, mixed, 16000)
            entry['levels'][f'snr{snr:g}'] = {'offset': off, 'noise_gain': round(gain, 8)}
        manifest['clips'].append(entry)
    os.makedirs(args.out_dir, exist_ok=True)
    with open(os.path.join(args.out_dir, 'mix_manifest.json'), 'w') as fh:
        json.dump(manifest, fh, indent=1)
    print(f'mixed {len(clips)} clips x {len(args.snrs)} SNR levels; manifest written')

if __name__ == '__main__':
    main()
