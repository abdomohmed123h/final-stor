import { useCallback, useRef, useState } from "react";

// Provides a `showToast(message)` function and the current toast message,
// which automatically clears itself after a short delay.
export function useToast(durationMs = 2500) {
  const [toast, setToast] = useState("");
  const timeoutRef = useRef(null);

  const showToast = useCallback(
    (message) => {
      setToast(message);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setToast(""), durationMs);
    },
    [durationMs]
  );

  return { toast, showToast };
}
