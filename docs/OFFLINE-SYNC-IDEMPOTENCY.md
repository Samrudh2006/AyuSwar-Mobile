# Offline Sync Idempotency Keys

Status: client side implemented; server-side dedupe documented, NOT applied
or verified. Exactly-once delivery is not claimed.

## What exists today

- Every queued record carries a stable client-generated `idempotencyKey`
  (`ik_<ts>_<rand>`), stamped in `saveOfflineRecord`. Records enqueued
  before this change fall back to their queue id (`off_...`) as the key.
- During sync, the key is surfaced in the insert payload as
  `idempotency_key` ONLY when the target table advertises that column.
  Support is probed once per table per session
  (`select('idempotency_key', { head: true })`); on any probe error the key
  is omitted so existing backends keep syncing unchanged.

## Why surfacing is probed

PostgREST rejects an insert that names a column missing from the schema
cache (PGRST204). Sending the key unconditionally would fail every sync
upload on an un-migrated backend; the probe fails safe instead.

## Enabling server-side dedupe (manual step, unverified here)

```sql
alter table patient_vitals_log add column if not exists idempotency_key text;
alter table clinical_encounters add column if not exists idempotency_key text;
create unique index if not exists patient_vitals_log_idempotency_key_uidx on patient_vitals_log (idempotency_key);
create unique index if not exists clinical_encounters_idempotency_key_uidx on clinical_encounters (idempotency_key);
```

With the unique indexes in place, the sync inserts can switch to
`upsert(row, { onConflict: 'idempotency_key' })` so a retried upload after
an ambiguous failure (for example a timeout after the server committed)
collapses to one row. That switch and any verification against the live
backend are NOT done here: no backend access was available in this
environment, and exactly-once delivery is not claimed.
