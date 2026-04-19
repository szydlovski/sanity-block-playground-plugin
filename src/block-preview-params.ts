/**
 * Shared query serialization for Studio iframe URLs and the host preview route.
 * Single encoding path (no double-encode with URLSearchParams).
 */

export interface BlockPreviewQueryPayload {
  block: string;
  props: Record<string, unknown>;
}

/** Returns the query string (no leading `?`). */
export function serializeBlockPreviewSearchParams(
  payload: BlockPreviewQueryPayload,
): string {
  const params = new URLSearchParams();
  params.set("block", payload.block);
  params.set("props", JSON.stringify(payload.props));
  return params.toString();
}

function firstString(
  value: string | string[] | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function getParamFromSearchParamsLike(
  input: { get: (key: string) => string | null },
  key: string,
): string | null {
  return input.get(key);
}

/**
 * Parse `block` and `props` from URLSearchParams or a Next.js-style searchParams object.
 * Also accepts URLSearchParams-like values (e.g. ReadonlyURLSearchParams) via `.get()`.
 */
export function parseBlockPreviewSearchParams(
  input:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | { get: (key: string) => string | null },
): { block: string | null; props: Record<string, unknown> } {
  const fromParams =
    input instanceof URLSearchParams ||
    (typeof input === "object" &&
      input !== null &&
      typeof (input as { get?: unknown }).get === "function");

  const blockRaw = fromParams
    ? getParamFromSearchParamsLike(
        input as { get: (key: string) => string | null },
        "block",
      )
    : firstString(
        (input as Record<string, string | string[] | undefined>).block,
      );
  const propsRaw = fromParams
    ? getParamFromSearchParamsLike(
        input as { get: (key: string) => string | null },
        "props",
      )
    : firstString(
        (input as Record<string, string | string[] | undefined>).props,
      );

  const block = blockRaw && blockRaw.length > 0 ? blockRaw : null;

  if (!propsRaw || propsRaw.length === 0) {
    return { block, props: {} };
  }

  try {
    const parsed = JSON.parse(propsRaw) as unknown;
    const props =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    return { block, props };
  } catch {
    return { block, props: {} };
  }
}

/** Shallow merge: parsed URL props override defaults for top-level keys only. */
export function mergePreviewProps(
  defaults: Record<string, unknown>,
  parsed: Record<string, unknown>,
): Record<string, unknown> {
  return { ...defaults, ...parsed };
}
