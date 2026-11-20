#!/usr/bin/env python3
"""
AyuSwar AI - FHIR R4 bundle validation.

Two honesty tiers:

1. BASE R4 (implemented here): parses every bundle in
   benchmarks/data/synthetic_fhir/ with fhir.resources (pydantic schemas for
   FHIR R4). This catches malformed resources, wrong field types and missing
   required fields against base FHIR R4 only.

2. NRCeS / ABDM PROFILE VALIDATION (not implemented here): conformance
   against the Indian ABDM Implementation Guide profiles
   (https://nrces.in/ndhm/fhir/r4/) requires the published IG package plus a
   profile-aware validator (e.g. the HAPI FHIR validator JAR). That is a
   separate, heavier step; do not describe base-R4 parsing as ABDM profile
   validation.

Exit code 0 only when every bundle parses as valid base FHIR R4.
"""

import glob
import json
import os
import sys

BUNDLE_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "benchmarks", "data", "synthetic_fhir"
)


def main():
    try:
        # ABDM/NRCeS profiles build on FHIR R4. fhir.resources 8.x defaults
        # to R5, whose Encounter/MedicationRequest shapes differ, so import
        # the R4B model package explicitly (closest shipped model to R4).
        from fhir.resources.R4B.bundle import Bundle
    except ImportError:
        print("[!] fhir.resources R4B models not installed. Run: pip install fhir.resources")
        print("    Base R4 validation NOT RUN - this is not a pass.")
        return 2

    paths = sorted(glob.glob(os.path.join(BUNDLE_DIR, "*.json")))
    if not paths:
        print(f"[!] no bundles found in {BUNDLE_DIR}; run scripts/generate_synthetic_fhir.py first")
        return 2

    failures = 0
    for path in paths:
        name = os.path.basename(path)
        try:
            with open(path, encoding="utf-8") as fh:
                bundle = Bundle.model_validate(json.load(fh))
            types = [type(e.resource).__name__ for e in bundle.entry]
            print(f"  ok {name}: {len(types)} resources ({', '.join(types)})")
        except Exception as exc:
            failures += 1
            print(f"  FAIL {name}: {exc}")

    print(f"base FHIR R4 validation: {len(paths) - failures}/{len(paths)} bundles valid")
    print("note: NRCeS/ABDM profile conformance is NOT covered by this check")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
