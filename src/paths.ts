/** Read a dotted path from a nested object (e.g. `link.type`). */
export function getAtPath(obj: unknown, path: string): unknown {
  if (obj == null || path === "") return undefined;
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

/** Immutable set on a dotted path, creating object shells as needed. */
export function setAtPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const parts = path.split(".").filter(Boolean);
  if (parts.length === 0) return { ...obj };

  function walk(
    cur: Record<string, unknown>,
    idx: number,
  ): Record<string, unknown> {
    const key = parts[idx];
    if (idx === parts.length - 1) {
      return { ...cur, [key]: value };
    }
    const inner = cur[key];
    const base =
      inner && typeof inner === "object" && !Array.isArray(inner)
        ? (inner as Record<string, unknown>)
        : {};
    return { ...cur, [key]: walk(base, idx + 1) };
  }

  return walk({ ...obj }, 0);
}
