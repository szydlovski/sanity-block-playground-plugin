import type { BlockPlaygroundOptions } from "./types";

/** Identity helper for clearer inference at the call site. */
export function defineBlockPlayground(
  options: BlockPlaygroundOptions,
): BlockPlaygroundOptions {
  return options;
}
