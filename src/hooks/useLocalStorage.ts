"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Type-safe localStorage hook with versioned keys and error handling.
 * Falls back gracefully when localStorage is unavailable (SSR, quota exceeded).
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: { serialize?: (v: T) => string; deserialize?: (v: string) => T }
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const serialize = options?.serialize ?? JSON.stringify;
  const deserialize = options?.deserialize ?? JSON.parse;

  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(deserialize(item));
      }
    } catch {
      // localStorage unavailable or corrupted
    }
  }, [key, deserialize]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, serialize(nextValue));
        } catch {
          // Quota exceeded or unavailable
        }
        return nextValue;
      });
    },
    [key, serialize]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    setStoredValue(initialValue);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
