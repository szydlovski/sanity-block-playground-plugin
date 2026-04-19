/**
 * Build the flat `namedSchemaTypes` map from your Studio `schema.types` array
 * by picking only the type names you need in the playground form.
 */
export function pickSchemaTypesByName(
  schemaTypes: readonly unknown[],
  names: readonly string[],
): Record<string, unknown> {
  const nameSet = new Set(names);
  const out: Record<string, unknown> = {};

  for (const entry of schemaTypes) {
    if (!entry || typeof entry !== "object") continue;
    const name = (entry as { name?: unknown }).name;
    if (typeof name !== "string" || !nameSet.has(name)) continue;
    out[name] = entry as unknown;
  }

  return out;
}
