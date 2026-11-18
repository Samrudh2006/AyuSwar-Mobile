/**
 * Time-derived appointment grouping helpers.
 *
 * Prototype design rule: elapsed clock time alone must NEVER change the
 * stored status of an actual/user-created record. Time-derived Past/Upcoming
 * grouping is applied ONLY to bundled synthetic fixtures so the demo stays
 * honest about what time it is; real bookings keep their explicit status
 * until a clinician or the user changes it.
 */

const FIXTURE_ID_RE = /^(DEMO-APT-|OPD-APT-1\d{2}$)/;

export const isBundledFixture = (a) => !!a && typeof a.id === 'string' && FIXTURE_ID_RE.test(a.id);

export const parseSlotMinutes = (t) => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(t || '');
  if (!m) return null;
  let h = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + parseInt(m[2], 10);
};

/**
 * True when a bundled fixture's same-day slot time has passed by more than
 * `graceMin` minutes relative to `now`. Non-fixtures always return false.
 * offsetDays > 0 (future) never passes; offsetDays < 0 is already past by date.
 */
export const isFixtureSlotPassed = (a, now = new Date(), graceMin = 45) => {
  if (!isBundledFixture(a)) return false;
  if ((a.offsetDays || 0) !== 0) return false;
  const mins = parseSlotMinutes(a.time);
  if (mins == null) return false;
  return (now.getHours() * 60 + now.getMinutes()) - mins > graceMin;
};
