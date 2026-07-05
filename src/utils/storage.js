// Thin wrapper around localStorage with safe JSON parsing/stringifying.
// Falls back silently (returning the default value) if storage is
// unavailable or the stored value is corrupted.
export const load = (key, defaultValue) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore write failures (e.g. storage full or disabled).
  }
};
