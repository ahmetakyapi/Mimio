"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface GameTimerReturn {
  /** Elapsed seconds since start */
  elapsed: number;
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Start or restart the timer */
  start: () => void;
  /** Pause the timer */
  pause: () => void;
  /** Reset to zero and stop */
  reset: () => void;
  /** Formatted time string (MM:SS) */
  formatted: string;
}

/**
 * Dedicated game timer hook.
 * Extracted from MimioApp to reduce state coupling.
 */
export function useGameTimer(): GameTimerReturn {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    startTimeRef.current = Date.now();
    setElapsed(0);
    setIsRunning(true);
    intervalRef.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setElapsed(0);
    setIsRunning(false);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return { elapsed, isRunning, start, pause, reset, formatted };
}
