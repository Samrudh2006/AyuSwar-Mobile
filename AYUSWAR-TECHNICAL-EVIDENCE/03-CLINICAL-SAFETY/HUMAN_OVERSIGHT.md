# Human oversight

Clinician review actions, correction history and sign-off limits:
[src/services/clinicalEvidencePersistence.js](../../src/services/clinicalEvidencePersistence.js)
and the review UI tests (phase 41). Every review action records reviewer
identity, a real action-time timestamp and a reason; demo reviewers are
labelled DEMO and can never produce a real clinical sign-off. Persistence is
opt-in; non-synthetic sessions require a documented consent basis.
