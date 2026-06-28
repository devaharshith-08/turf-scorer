// src/hooks/useHapticFeedback.js
//
// Small reusable hook wrapping navigator.vibrate().
// Per PRD Page 3: "Haptics: navigator.vibrate(40) on every button press."
// No npm package needed — this is a native browser API.

"use client";

import { useCallback } from "react";

export function useHapticFeedback() {
  return useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(40);
    }
  }, []);
}