import { BlockContentIcon } from "@sanity/icons";
import { Box } from "@sanity/ui";
import type { ReactNode } from "react";
import { definePlugin } from "sanity";
import { normalizeBlockPlaygroundOptions } from "./normalize-options";
import { BlockPlaygroundProvider } from "./studio/BlockPlaygroundContext";
import { BlockPlaygroundTool } from "./studio/BlockPlaygroundTool";
import type { BlockPlaygroundOptions } from "./types";

function ToolShell({ children }: { children: ReactNode }) {
  return (
    <Box
      style={{
        alignSelf: "stretch",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {children}
    </Box>
  );
}

export const blockPlaygroundPlugin = definePlugin<BlockPlaygroundOptions>(
  (options) => {
    const resolved = normalizeBlockPlaygroundOptions(options);
    return {
      name: "sanity-plugin-block-playground",
      tools: [
        {
          name: "block-playground",
          title: resolved.title || "Blocks",
          icon: BlockContentIcon,
          component: () => (
            <BlockPlaygroundProvider options={resolved}>
              <ToolShell>
                <BlockPlaygroundTool options={resolved} />
              </ToolShell>
            </BlockPlaygroundProvider>
          ),
        },
      ],
    };
  },
);
