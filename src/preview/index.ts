export {
  mergePreviewProps,
  parseBlockPreviewSearchParams,
  serializeBlockPreviewSearchParams,
} from "../block-preview-params";
export type { BlockPreviewQueryPayload } from "../block-preview-params";

import type { ComponentType } from "react";

export type ServerBlockComponent = ComponentType<Record<string, unknown>>;

export function resolveServerBlock(
  blockName: string,
  registry: Record<string, ServerBlockComponent>,
): ServerBlockComponent | null {
  return registry[blockName] ?? null;
}
