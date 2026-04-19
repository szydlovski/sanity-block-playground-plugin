import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "define-section-stories": "src/define-section-stories.ts",
    preview: "src/preview/index.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "sanity",
    "@sanity/ui",
    "@sanity/icons",
    "@sanity/image-url",
    "@portabletext/editor",
    "@portabletext/schema",
  ],
});
