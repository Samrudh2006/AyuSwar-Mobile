#!/usr/bin/env python3
"""
AyuSwar AI - synthetic FHIR R4 bundle generator.

Builds small, clearly-synthetic FHIR R4 collection Bundles for the demo
consultation flow: one Patient, one Encounter, one Condition, one Observation
and one MedicationRequest per fictional patient. No real person is
represented: ids, names, phones and dates are invented fixtures (Synthea's
approach - https://github.com/synthetichealth/synthea - applied at prototype
scale without running the full generator).

Output: benchmarks/data/synthetic_fhir/<patient_id>.json

These bundles are for structure/validation testing only. They are not ABDM
profile-conformant documents yet: NRCeS profile validation is tracked as a
separate step (see scripts/validate_fhir_bundles.py header).
"""

import json
import os
import uuid

SYNTHETIC_PATIENTS = [
    {
        "patient_id": "syn-patient-001",
        "given": "Demo",
        "family": "RuralPatientA",
        "gender": "female",
        "birthDate": "1978-04-12",
        "language": "te",
        "condition": "Essential (primary) hypertension",
        "condition_icd10": "I10",
        "observation": ("8480-6", "Systolic blood pressure", "mm[Hg]", 142),
        "medication": "Amlodipine 5mg oral tablet",
    },
    {
        "patient_id": "syn-patient-002",
        "given": "Demo",
        "family": "RuralPatientB",
        "gender": "male",
        "birthDate": "1965-11-03",
        "language": "hi",
        "condition": "Type 2 diabetes mellitus without complications",
        "condition_icd10": "E11.9",
        "observation": ("2339-0", "Glucose [Mass/volume] in Blood", "mg/dL", 168),
        "medication": "Metformin hydrochloride 500mg oral tablet",
    },
    {
        "patient_id": "syn-patient-003",
        "given": "Demo",
        "family": "RuralPatientC",
        "gender": "female",
        "birthDate": "1990-07-27",
        "language": "te",
        "condition": "Acute upper respiratory infection, unspecified",
        "condition_icd10": "J06.9",
        "observation": ("8310-5", "Body temperature", "Cel", 38.4),
        "medication": "Paracetamol 500mg oral tablet",
    },
]

OUT_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "benchmarks", "data", "synthetic_fhir"
)


def _uuid():
    return "urn:uuid:" + str(uuid.uuid4())


def build_bundle(spec):
    patient_ref = _uuid()
    encounter_ref = _uuid()
    entries = [
        {
            "fullUrl": patient_ref,
            "resource": {
                "resourceType": "Patient",
                "id": spec["patient_id"],
                "meta": {"tag": [{"code": "synthetic-demo-fixture"}]},
                "identifier": [
                    {"system": "https://ayuswar.example/synthetic-patient-id", "value": spec["patient_id"]}
                ],
                "name": [{"use": "usual", "family": spec["family"], "given": [spec["given"]]}],
                "gender": spec["gender"],
                "birthDate": spec["birthDate"],
                "communication": [
                    {"language": {"coding": [{"system": "urn:ietf:bcp:47", "code": spec["language"]}]}}
                ],
            },
        },
        {
            "fullUrl": encounter_ref,
            "resource": {
                "resourceType": "Encounter",
                "id": spec["patient_id"] + "-enc",
                "meta": {"tag": [{"code": "synthetic-demo-fixture"}]},
                "status": "finished",
                "class": {"code": "AMB", "display": "ambulatory"},
                "subject": {"reference": patient_ref},
                "period": {"start": "2026-11-20T09:30:00+05:30", "end": "2026-11-20T09:45:00+05:30"},
            },
        },
        {
            "fullUrl": _uuid(),
            "resource": {
                "resourceType": "Condition",
                "id": spec["patient_id"] + "-cond",
                "meta": {"tag": [{"code": "synthetic-demo-fixture"}]},
                "clinicalStatus": {
                    "coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]
                },
                "code": {
                    "coding": [
                        {"system": "http://hl7.org/fhir/sid/icd-10", "code": spec["condition_icd10"], "display": spec["condition"]}
                    ],
                    "text": spec["condition"],
                },
                "subject": {"reference": patient_ref},
                "encounter": {"reference": encounter_ref},
            },
        },
        {
            "fullUrl": _uuid(),
            "resource": {
                "resourceType": "Observation",
                "id": spec["patient_id"] + "-obs",
                "meta": {"tag": [{"code": "synthetic-demo-fixture"}]},
                "status": "final",
                "code": {
                    "coding": [
                        {"system": "http://loinc.org", "code": spec["observation"][0], "display": spec["observation"][1]}
                    ]
                },
                "subject": {"reference": patient_ref},
                "encounter": {"reference": encounter_ref},
                "valueQuantity": {
                    "value": spec["observation"][3],
                    "unit": spec["observation"][2],
                    "system": "http://unitsofmeasure.org",
                    "code": spec["observation"][2],
                },
            },
        },
        {
            "fullUrl": _uuid(),
            "resource": {
                "resourceType": "MedicationRequest",
                "id": spec["patient_id"] + "-med",
                "meta": {"tag": [{"code": "synthetic-demo-fixture"}]},
                "status": "completed",
                "intent": "order",
                "medicationCodeableConcept": {"text": spec["medication"]},
                "subject": {"reference": patient_ref},
                "encounter": {"reference": encounter_ref},
            },
        },
    ]
    return {
        "resourceType": "Bundle",
        "id": spec["patient_id"] + "-bundle",
        "meta": {
            "lastUpdated": "2026-11-20T10:00:00+05:30",
            "tag": [{"code": "synthetic-demo-fixture", "display": "AyuSwar synthetic demo data; no real person"}],
        },
        "type": "collection",
        "entry": entries,
    }


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for spec in SYNTHETIC_PATIENTS:
        bundle = build_bundle(spec)
        path = os.path.join(OUT_DIR, spec["patient_id"] + ".json")
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(bundle, fh, indent=2, ensure_ascii=False)
        print(f"wrote {path} ({len(bundle['entry'])} resources)")


if __name__ == "__main__":
    main()
