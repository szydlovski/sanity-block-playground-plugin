import { serializeBlockPreviewSearchParams } from "./block-preview-params";
import type {
  BlockFieldDefinition,
  BlockPlaygroundOptions,
  BlockStory,
  ClientBlockDefinition,
  ClientPreviewComponent,
  ResolvedBlockPlaygroundOptions,
  ServerBlockMetadata,
  UnifiedBlockEntry,
} from "./types";

function indexByName<T extends { name: string }>(
  items: T[],
): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (map.has(item.name)) {
      throw new Error(
        `Duplicate block name "${item.name}" in block playground registry.`,
      );
    }
    map.set(item.name, item);
  }
  return map;
}

function buildLookupMaps(options: BlockPlaygroundOptions): {
  clientByName: Map<string, ClientBlockDefinition>;
  serverByName: Map<string, ServerBlockMetadata>;
} {
  const clientByName = indexByName(options.clientBlocks);
  const serverBlocks = options.serverBlocks ?? [];
  const serverByName = indexByName(serverBlocks);
  for (const name of clientByName.keys()) {
    if (serverByName.has(name)) {
      throw new Error(
        `Block "${name}" appears in both clientBlocks and serverBlocks.`,
      );
    }
  }
  return { clientByName, serverByName };
}

function defaultBuildServerPreviewUrl(
  serverPreviewBasePath: string,
): (args: { block: string; props: Record<string, unknown> }) => string | null {
  const path = serverPreviewBasePath.startsWith("/")
    ? serverPreviewBasePath
    : `/${serverPreviewBasePath}`;
  return ({ block, props }) => {
    const qs = serializeBlockPreviewSearchParams({ block, props });
    return `${path}?${qs}`;
  };
}

export function normalizeBlockPlaygroundOptions(
  options: BlockPlaygroundOptions,
): ResolvedBlockPlaygroundOptions {
  const { clientByName, serverByName } = buildLookupMaps(options);

  const blocks: UnifiedBlockEntry[] = [
    ...options.clientBlocks.map(
      (b): UnifiedBlockEntry => ({
        name: b.name,
        label: b.label,
        category: b.category,
        hasSchema: b.hasSchema,
        render: "client",
      }),
    ),
    ...(options.serverBlocks ?? []).map(
      (b): UnifiedBlockEntry => ({
        name: b.name,
        label: b.label,
        category: b.category,
        hasSchema: b.hasSchema,
        render: "server",
      }),
    ),
  ];

  function getBlockData(name: string):
    | ClientBlockDefinition
    | ServerBlockMetadata
    | undefined {
    return clientByName.get(name) ?? serverByName.get(name);
  }

  const getDefaultProps = (blockName: string): Record<string, unknown> => {
    const data = getBlockData(blockName);
    const raw = data?.defaultProps;
    if (!raw) return {};
    return { ...raw };
  };

  const getStories = (blockName: string): BlockStory[] => {
    const data = getBlockData(blockName);
    return data?.stories ? [...data.stories] : [];
  };

  const getFieldDefinitions = (blockName: string): BlockFieldDefinition[] => {
    const data = getBlockData(blockName);
    return data?.fields ? [...data.fields] : [];
  };

  const resolveComponent = (blockName: string): ClientPreviewComponent | null => {
    const client = clientByName.get(blockName);
    return client?.component ?? null;
  };

  let buildServerPreviewUrl:
    | ResolvedBlockPlaygroundOptions["buildServerPreviewUrl"]
    | undefined;

  if (options.buildServerPreviewUrl) {
    buildServerPreviewUrl = options.buildServerPreviewUrl;
  } else if (options.serverPreviewBasePath) {
    buildServerPreviewUrl = defaultBuildServerPreviewUrl(
      options.serverPreviewBasePath,
    );
  }

  return {
    title: options.title,
    blocks,
    categoryOrder: options.categoryOrder,
    namedSchemaTypes: options.namedSchemaTypes,
    getDefaultProps,
    getStories,
    getFieldDefinitions,
    resolveComponent,
    buildServerPreviewUrl,
  };
}
