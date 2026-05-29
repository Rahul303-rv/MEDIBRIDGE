import { useEffect, useRef } from "react";

/**
 * Run `callback` once on mount, then repeatedly at `intervalMs`.
 * Uses a ref so the callback always sees current state/closures without
 * having to re-create the interval on every render.
 *
 * Use for keeping list pages fresh (status changes, new records, unread counts)
 * without forcing the user to manually refresh.
 *
 * @example
 *   usePolling(() => {
 *     api.get("/api/v1/patient/symptom-intakes").then(r => setIntakes(r.data));
 *   }, 10000);
 */
export function usePolling(callback: () => void, intervalMs: number = 10000) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const id = setInterval(() => cbRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
