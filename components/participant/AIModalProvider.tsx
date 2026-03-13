"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface AIModalContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const AIModalContext = createContext<AIModalContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function useAIModal() {
  return useContext(AIModalContext);
}

export default function AIModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <AIModalContext.Provider value={{ isOpen, open, close }}>
      {children}
    </AIModalContext.Provider>
  );
}
