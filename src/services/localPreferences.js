// Device-local, non-secret UI preferences. Values are namespaced by demo account
// so one signed-in demo profile does not inherit another profile's settings.
export function loadLocalPreferences(scope) {
  try {
    const raw = localStorage.getItem(`ayuswar_local_preferences:${scope}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocalPreferences(scope, values) {
  try {
    localStorage.setItem(`ayuswar_local_preferences:${scope}`, JSON.stringify({ ...values, savedAt: new Date().toISOString() }));
    return true;
  } catch {
    return false;
  }
}
