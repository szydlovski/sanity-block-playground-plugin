import type { ComponentType, LazyExoticComponent } from "react";

/** Allowed in `clientBlocks`; includes `React.lazy` for code-split previews. */
export type ClientPreviewComponent =
  | ComponentType<Record<string, unknown>>
  | LazyExoticComponent<ComponentType<Record<string, unknown>>>;

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
  /** Props object applied to the preview/form (replaces full state when selected). */
  props: Record<string, unknown>;
}

/** Shared fields for client and server block entries (no component on server metadata). */
export interface BlockDefinitionBase {
  name: string;
  label: string;
  category?: string;
  /** Whether this section has a registered schema definition (informational). */
  hasSchema?: boolean;
  defaultProps?: Record<string, unknown>;
  stories?: BlockStory[];
  /** Drives the Fields tab; when empty, only Full JSON is available. */
  fields?: BlockFieldDefinition[];
}

/** Studio-safe: includes a client-rendered preview component (no server-only imports). */
export interface ClientBlockDefinition extends BlockDefinitionBase {
  component: ClientPreviewComponent;
}

/**
 * Metadata-only block for iframe/server preview. Do not import server components here —
 * resolve components in the Next (or app) route using `@pipeville/sanity-block-playground-plugin/preview`.
 */
export interface ServerBlockMetadata extends BlockDefinitionBase {
  // no `component`; render is always server/iframe
}

/** Sidebar + tool: discriminated by how preview is produced. */
export interface UnifiedBlockEntry {
  name: string;
  label: string;
  category?: string;
  hasSchema?: boolean;
  render: "client" | "server";
}

/**
 * Options for `blockPlaygroundPlugin`. Use `clientBlocks` for in-Studio preview and
 * `serverBlocks` for iframe preview; both lists appear as one in the sidebar.
 */
export interface BlockPlaygroundOptions {
  title?: string;
  clientBlocks: ClientBlockDefinition[];
  serverBlocks?: ServerBlockMetadata[];
  /** Order category headings; unspecified categories sort alphabetically after these. */
  categoryOrder?: string[];
  /**
   * Pathname for the iframe preview route, e.g. `/block-preview`.
   * Combined with `serializeBlockPreviewSearchParams` from the `preview` entry.
   * Ignored if `buildServerPreviewUrl` is set.
   */
  serverPreviewBasePath?: string;
  /**
   * Full control over the iframe URL. When omitted, `serverPreviewBasePath` is used
   * with the canonical query string from `serializeBlockPreviewSearchParams`.
   */
  buildServerPreviewUrl?: (args: {
    block: string;
    props: Record<string, unknown>;
  }) => string | null;
  /** Optional named schema type map used by the playground field renderer. */
  namedSchemaTypes?: Record<string, unknown>;
}

/**
 * Normalized options passed through React context. Most callers only need
 * {@link BlockPlaygroundOptions}; this type is exposed for advanced tooling.
 */
export interface ResolvedBlockPlaygroundOptions {
  title?: string;
  blocks: UnifiedBlockEntry[];
  categoryOrder?: string[];
  namedSchemaTypes?: Record<string, unknown>;
  getDefaultProps: (blockName: string) => Record<string, unknown>;
  getStories: (blockName: string) => BlockStory[];
  getFieldDefinitions: (blockName: string) => BlockFieldDefinition[];
  resolveComponent: (blockName: string) => ClientPreviewComponent | null;
  buildServerPreviewUrl?: (args: {
    block: string;
    props: Record<string, unknown>;
  }) => string | null;
}
