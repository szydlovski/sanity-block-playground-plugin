# sanity-plugin-block-playground

Source for this package lives in the [`sanity-block-playground-plugin`](https://github.com/pipeville/sanity-block-playground-plugin) repository (not a monorepo). Releases are published to npm from Git tags via GitHub Actions.

A Sanity Studio tool for previewing and editing section/block props in one place.

## Install

```bash
pnpm add sanity-plugin-block-playground
```

Peer dependencies are required in your Studio app:

- `sanity`
- `react`
- `react-dom`
- `@sanity/ui`
- `@sanity/icons`

## Basic setup

Register the plugin in `sanity.config.ts` and pass your host registry/resolvers.

```ts
import { defineConfig } from "sanity";
import { blockPlaygroundPlugin } from "sanity-plugin-block-playground";

import { link } from "@/cms/schemas/objects/link";
import { portableText } from "@/cms/schemas/objects/portableText";
import { resolveBlockSectionComponent } from "@/sections/block-playground-resolve";
import {
  getBlocks,
  getDefaultPropsForBlock,
  getFieldDefinitions,
  getStoriesForBlock,
} from "@/sections/registry";

export default defineConfig({
  // ... your existing config
  plugins: [
    blockPlaygroundPlugin({
      title: "Sections",
      getBlocks,
      getDefaultProps: getDefaultPropsForBlock,
      getStories: getStoriesForBlock,
      getFieldDefinitions,
      resolveComponent: resolveBlockSectionComponent,
      buildServerPreviewUrl: ({ block, props }) => {
        const params = new URLSearchParams({
          block,
          props: encodeURIComponent(JSON.stringify(props)),
        });
        return `/block-preview?${params.toString()}`;
      },
      namedSchemaTypes: {
        link,
        portableText,
      },
    }),
  ],
});
```

## Registry shape

The plugin expects host-provided functions:

- `getBlocks()` returns block metadata (`name`, `label`, optional `category`, `preview.mode`).
- `getStories(blockName)` returns named props presets for fast switching.
- `getDefaultProps(blockName)` provides fallback props when no stories are available.
- `getFieldDefinitions(blockName)` provides schema-backed editable fields for the form tab.

`preview.mode` controls rendering:

- `"client"`: component comes from `resolveComponent(blockName)`.
- `"server"`: iframe URL comes from `buildServerPreviewUrl({ block, props })`.

## Portable text and custom named types

If your schema references named types (for example `link`, `portableText`), pass them through `namedSchemaTypes` so the playground form can resolve nested editors correctly.

## Story helper

Use the helper to keep section story presets type-safe:

```ts
import { defineSectionStories } from "sanity-plugin-block-playground/define-section-stories";
```

## Optional `/block-preview` route

For server-rendered sections, add a route that:

1. Reads `block` and `props` query params.
2. Resolves the section from your server registry.
3. Merges parsed props with defaults.
4. Renders the section component.

This route stays host-specific and is intentionally not part of the package.
