import { useCallback, useState } from "react";

// Manages a single "active modal" node, plus helpers to open/close it.
// Keeping this as a hook avoids repeating `setModal(null)` closures
// throughout every page component.
export function useModal() {
  const [modal, setModal] = useState(null);
  const closeModal = useCallback(() => setModal(null), []);
  const openModal = useCallback((node) => setModal(node), []);

  return { modal, openModal, closeModal, setModal };
}
