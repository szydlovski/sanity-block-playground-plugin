import { defineSchema } from "@portabletext/schema";

/**
 * Mirrors `src/cms/schemas/objects/portableText.ts` for the playground editor.
 */
export const playgroundPortableTextSchemaDefinition = defineSchema({
  block: { name: "block" },
  styles: [
    { name: "normal", title: "Normal" },
    { name: "h2", title: "Heading 2" },
    { name: "h3", title: "Heading 3" },
    { name: "h4", title: "Heading 4" },
    { name: "blockquote", title: "Quote" },
  ],
  lists: [
    { name: "bullet", title: "Bullet" },
    { name: "number", title: "Number" },
  ],
  decorators: [
    { name: "strong", title: "Strong" },
    { name: "em", title: "Emphasis" },
    { name: "underline", title: "Underline" },
    { name: "code", title: "Code" },
    { name: "strike-through", title: "Strikethrough" },
  ],
  annotations: [
    {
      name: "internalLink",
      title: "Internal link",
      fields: [{ name: "reference", type: "object", title: "Reference" }],
    },
    {
      name: "externalLink",
      title: "External link",
      fields: [
        { name: "href", type: "string", title: "URL" },
        { name: "openInNewTab", type: "boolean", title: "New tab" },
      ],
    },
  ],
  blockObjects: [
    {
      name: "image",
      title: "Image",
      fields: [
        { name: "asset", type: "object", title: "Asset" },
        { name: "alt", type: "string", title: "Alt" },
      ],
    },
    {
      name: "code",
      title: "Code",
      fields: [
        { name: "language", type: "string", title: "Language" },
        { name: "code", type: "string", title: "Code" },
      ],
    },
  ],
  inlineObjects: [],
});
