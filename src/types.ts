import type { ComponentType } from "react";

export interface BlockEntry {
  /** Unique key, matches `?block=` (e.g. Sanity section `_type`). */
  name: string;
  /** Display name in the sidebar. */
  label: string;
  /** Sidebar grouping bucket. */
  category?: string;
  /** Whether this section has a registered schema definition. */
  hasSchema?: boolean;
  /** How preview should render in Studio (direct client render vs server iframe). */
  preview?: { mode: "client" | "server" };
}

export interface BlockFieldDefinition {
  /** Dotted path, e.g. `heading` or `link.externalUrl`. */
  path: string;
  label: string;
  description?: string;
  /** Raw Sanity field definition (`defineField` result) — drives the schema form. */
  schema?: unknown;
}

export interface BlockStory {
  /** Stable story ID for the section (e.g. `default`, `alt`). */
  id: string;
  /** Story label shown in the props panel. */
  label: string;
  /** Props object applied to the preview/form. */
  props: Record<string, unknown>;
}

export interface BlockPlaygroundOptions {
  title?: string;
  /** Returns registered blocks; the plugin never imports app sections. */
  getBlocks: () => BlockEntry[];
  /**
   * Optional: default props when switching blocks (e.g. from mock files).
   * If omitted, the preview route should merge URL props with its own defaults.
   */
  getDefaultProps?: (blockName: string) => Record<string, unknown>;
  /**
   * Optional: named story presets for the selected section.
   * When missing, playground falls back to `getDefaultProps`.
   */
  getStories?: (blockName: string) => BlockStory[];
  /**
   * Optional: form fields for the props panel. When missing or returning `[]`,
   * only the raw JSON editor is shown.
   */
  getFieldDefinitions?: (blockName: string) => BlockFieldDefinition[];
  /** Resolves a client-safe preview component for a selected block. */
  resolveComponent?: (
    blockName: string,
  ) => ComponentType<Record<string, unknown>> | null;
  /** Builds iframe URL for blocks rendered in `preview.mode = "server"`. */
  buildServerPreviewUrl?: (args: {
    block: string;
    props: Record<string, unknown>;
  }) => string | null;
  /** Optional named schema type map used by the playground field renderer. */
  namedSchemaTypes?: Record<string, unknown>;
}
