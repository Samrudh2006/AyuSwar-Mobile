/**
 * AyuSwar AI — Data Provenance & STT Metric Engine Verification
 * test/data_provenance.test.js
 *
 * 1. PMBJP official product reference (src/data/pmbjpOfficialProducts.js)
 *    must carry live-source provenance and honest match typing, and must
 *    never present an unmatched formulary entry as verified.
 * 2. The STT benchmark must run dependency-free (stdlib metric engine)
 *    and report corpus + per-language WER/CER.
 * 3. stt_metrics known-answer checks (identity, substitution, empty hyp).
 */

import { execSync } from 'node:child_process';
import { PMBJP_OFFICIAL_PRODUCTS } from '../src/data/pmbjpOfficialProducts.js';

const results = [];
const check = (name, fn) => {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, err });
  }
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

check('PMBJP reference carries live source URL and fetch date', () => {
  assert(PMBJP_OFFICIAL_PRODUCTS.source === 'https://www.pmbi.co.in/ProductList.aspx', 'source URL changed');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(PMBJP_OFFICIAL_PRODUCTS.fetchedAt), 'fetchedAt must be ISO date');
});

check('PMBJP entries: match typing honest, matched rows fully sourced', () => {
  const entries = Object.entries(PMBJP_OFFICIAL_PRODUCTS.entries);
  assert(entries.length === 39, `expected 39 formulary links, got ${entries.length}`);
  const allowed = new Set(['exact-strength', 'same-salt-different-strength', 'salt-only', 'not-found']);
  for (const [id, e] of entries) {
    assert(allowed.has(e.matchType), `${id}: unknown matchType ${e.matchType}`);
    if (e.matchType === 'not-found') {
      assert(e.official === null, `${id}: not-found but official data present`);
    } else {
      assert(e.official && e.official.drugCode && e.official.genericName, `${id}: missing official identity`);
      // PMBI marks zero-MRP products 'under process'; price must be null-with-note, never a silent 0
      if (e.official.mrpInr === null) {
        assert(e.official.mrpNote, `${id}: null MRP without explanatory note`);
      } else {
        assert(typeof e.official.mrpInr === 'number' && e.official.mrpInr > 0, `${id}: invalid MRP`);
      }
    }
  }
});

check('STT benchmark runs stdlib-only with per-language breakdown', () => {
  const out = execSync('python3 benchmarks/run_stt_benchmark.py', { encoding: 'utf-8' });
  assert(out.includes('Metric engine:'), 'engine line missing');
  assert(out.includes('Per-language breakdown:'), 'language breakdown missing');
  assert(/Telugu\s+n=20/.test(out), 'Telugu group missing');
  assert(/Hindi\s+n=15/.test(out), 'Hindi group missing');
  assert(/Code-Mixed\s+n=15/.test(out), 'Code-Mixed group missing');
  assert(/Word Error Rate \(WER\)\s+: 0\.\d+/.test(out), 'corpus WER missing');
});

check('stt_metrics known-answer identities hold', () => {
  const out = execSync(
    `python3 -c "import sys; sys.path.insert(0,'benchmarks'); import stt_metrics as m; ` +
    `assert m.wer(['a b c'],['a b c'])==0.0; ` +
    `assert abs(m.wer(['a b c'],['a x c'])-1/3)<1e-9; ` +
    `assert m.sentence_wer('a b','')==1.0; ` +
    `assert m.wer(['Hello, World!'],['hello world'])==0.0; ` +
    `print('ok')"`,
    { encoding: 'utf-8' }
  );
  assert(out.trim() === 'ok', 'known-answer checks failed');
});

check('fleurs_eval ingests FLEURS-format TSV with known-answer WER and pair accounting', () => {
  const out = execSync(
    'python3 benchmarks/fleurs_eval.py --refs benchmarks/data/fleurs_format_fixture.tsv ' +
    '--hyps benchmarks/data/fleurs_format_fixture_hyps.tsv --model fixture-stub --split dev',
    { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
  const j = JSON.parse(out);
  assert(j.matched === 3, `expected 3 matched pairs, got ${j.matched}`);
  assert(j.unmatched_references.length === 1 && j.unmatched_references[0] === 'c.wav', 'unmatched reference not surfaced');
  assert(j.unmatched_hypotheses.length === 1 && j.unmatched_hypotheses[0] === 'zzz.wav', 'unmatched hypothesis not surfaced');
  assert(Math.abs(j.corpus.wer - 2 / 9) < 1e-9, `corpus WER ${j.corpus.wer} != 2/9`);
  assert(j.per_gender.FEMALE.wer === 0.0, 'identity pair must score 0');
  assert(Math.abs(j.per_gender.MALE.wer - 1 / 3) < 1e-9, `MALE WER ${j.per_gender.MALE.wer} != 1/3`);
  assert(typeof j.corpus.cer === 'number' && j.corpus.cer > 0 && j.corpus.cer < 1, 'CER missing or out of range');
  assert(j.model === 'fixture-stub' && j.split === 'dev', 'output must be self-describing');
});

let failed = 0;
for (const r of results) {
  if (r.ok) console.log(`  ✓ ${r.name}`);
  else {
    failed += 1;
    console.error(`  ✗ ${r.name}: ${r.err.message}`);
  }
}
console.log(`data_provenance: ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
