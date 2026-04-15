import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

/**
 * Debounces `value` while the same `blockKey` is selected. When `blockKey` changes,
 * returns the new `value` on that render — **not** the previous block’s debounced
 * state (which would otherwise paint once with the wrong props on the new component).
 */
export function useDebouncedValueForBlockKey<T>(
  blockKey: string | null,
  value: T,
  ms: number,
): T {
  const [prevBlockKey, setPrevBlockKey] = useState(blockKey);
  const [debounced, setDebounced] = useState(value);

  const blockChanged = blockKey !== prevBlockKey;
  if (blockChanged) {
    setPrevBlockKey(blockKey);
    setDebounced(value);
  }

  useEffect(() => {
    if (blockChanged) return;
    const id = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(id);
  }, [blockChanged, blockKey, value, ms]);

  return blockChanged ? value : debounced;
}
