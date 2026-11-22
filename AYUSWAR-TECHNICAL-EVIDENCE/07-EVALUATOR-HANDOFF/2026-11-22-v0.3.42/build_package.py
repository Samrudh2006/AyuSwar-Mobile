"""Build the dated evidence-only ZIP. No model/provider execution or APK build."""
from pathlib import Path
import hashlib
import json
import subprocess
import zipfile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
APP_REV = '843ea7bf2b26a6d983f665e1488cb17f86d2010c'
TEST_REV = '651cf79e3b822afe7334fe3b939a120e96b0266c'
NAME = 'AyuSwar-Mobile-Evaluator-Evidence-2026-11-22-v0.3.42.zip'
PREFIX = HERE.relative_to(ROOT).as_posix()

def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)

assert json.loads((ROOT / 'package.json').read_text())['version'] == '0.3.42-debug'
assert not git('diff', '--name-only', APP_REV, '--', 'src', 'test', 'android', 'package.json', 'package-lock.json').strip(), 'Application/test inputs changed beyond released snapshot'
run = json.loads((HERE / 'accepted-651cf79/TEST_RESULTS.json').read_text())
assert run['revision'] == TEST_REV and run['trackedWorkingTreeDirty'] is False
assert (run['assertionsPassed'], run['conditionalAssertionsSkipped'], run['suiteProcessesFailed']) == (550, 3, 0)
assert json.loads((HERE / 'accepted-651cf79/SPAN_GUARDS.json').read_text())['passed'] == 42

payload = {}
origins = {}
def add(name, data, source, transform=None):
    assert name not in payload, name
    payload[name] = data
    origins[name] = {'sourcePath': source, 'transform': transform}

# Existing tracked evidence/docs/benchmark records, excluding old marketing video
# binaries. Old records are never regenerated. The current undated index alone
# is read from the approved packaging worktree rather than its stale base copy.
paths = git('ls-tree', '-r', '--name-only', APP_REV, '--', 'AYUSWAR-TECHNICAL-EVIDENCE', 'docs', 'benchmarks', 'LICENSE', 'NOTICE').decode().splitlines()
for name in sorted(paths):
    if name.startswith('docs/videos/'):
        continue
    data = git('show', APP_REV + ':' + name)
    transform = None
    if name == 'AYUSWAR-TECHNICAL-EVIDENCE/README.md':
        text = (ROOT / name).read_text()
        text = '\n'.join('The outer ZIP is this archive and is not nested inside itself.' if '[Download the evaluator evidence ZIP]' in line else line for line in text.split('\n'))
        data = text.encode()
        transform = 'New packaging index, with self-ZIP link replaced for archive use'
    add(name, data, name + '@' + APP_REV if transform is None else name, transform)

# New accepted evidence and reader files, both at their repository paths and at
# easy-to-open archive-root paths used by the entry guide.
for path in sorted(HERE.rglob('*')):
    if not path.is_file() or path.name in {NAME, 'MANIFEST.json'}:
        continue
    name = path.relative_to(ROOT).as_posix()
    add(name, path.read_bytes(), name)
    if path.name in {'START-HERE.md', 'RELEASE-IDENTITY.json'} or path.parent.name == 'accepted-651cf79':
        short = path.relative_to(HERE).as_posix()
        add(short, path.read_bytes(), name)

# A minimal dependency-free replay kit, not a full app checkout. These source
# bytes match both the accepted test commit and the released application.
services = ['clinicalEvidenceEngine.js', 'clinicalEvidenceVerifier.js', 'clinicalEvidencePersistence.js', 'clinicalEvidenceTypes.js']
for relative in ['src/services/' + name for name in services] + ['test/phase53_evidence_span_guards.test.js']:
    data = git('show', APP_REV + ':' + relative)
    assert data == git('show', TEST_REV + ':' + relative)
    add('replay-span-guards/' + relative, data, relative + '@' + APP_REV)
add('replay-span-guards/package.json', b'{"private":true,"type":"module"}\n', 'Generated module wrapper for the 42-check replay only')

manifest = {
    'schemaVersion': 1,
    'snapshot': '2026-11-22-v0.3.42',
    'applicationReleaseRevision': APP_REV,
    'acceptedFullSuiteRevision': TEST_REV,
    'scope': 'Evidence/documentation package, not an APK, full app checkout, new experiment or clinical validation. Historical inputs keep their own recorded dates/revisions. Marketing video binaries, model weights and original corpora are not included.',
    'fullSuite': {'passed': 550, 'actualConditionalSkips': 3, 'failedSuiteProcesses': 0},
    'manifestPathsExcludedFromOwnChecksum': ['MANIFEST.json', PREFIX + '/MANIFEST.json'],
    'files': [dict(path=name, bytes=len(payload[name]), sha256=hashlib.sha256(payload[name]).hexdigest(), **origins[name]) for name in sorted(payload)]
}
manifest_bytes = (json.dumps(manifest, indent=2) + '\n').encode()
(HERE / 'MANIFEST.json').write_bytes(manifest_bytes)
with zipfile.ZipFile(HERE / NAME, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for name, data in sorted({**payload, 'MANIFEST.json': manifest_bytes, PREFIX + '/MANIFEST.json': manifest_bytes}.items()):
        info = zipfile.ZipInfo(name, date_time=(2026, 11, 22, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        archive.writestr(info, data, compresslevel=9)
print(json.dumps({'zip': str(HERE / NAME), 'payloadFiles': len(payload), 'zipBytes': (HERE / NAME).stat().st_size, 'zipSha256': hashlib.sha256((HERE / NAME).read_bytes()).hexdigest()}, indent=2))
