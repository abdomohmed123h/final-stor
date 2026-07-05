import { useEffect, useState } from "react";
import { load, save } from "../utils/storage";

// Behaves like useState, but the value is initialized from localStorage
// and automatically persisted back to it whenever it changes.
export function useLocalStorageState(key, defaultValue) {
  const [value, setValue] = useState(() => load(key, defaultValue));

  useEffect(() => {
    save(key, value);
  }, [key, value]);

  return [value, setValue];
}
