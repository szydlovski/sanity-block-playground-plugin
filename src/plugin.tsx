import { BlockContentIcon } from "@sanity/icons";
import { Box } from "@sanity/ui";
import type { ReactNode } from "react";
import { definePlugin } from "sanity";
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
    return {
      name: "sanity-plugin-block-playground",
      tools: [
        {
          name: "block-playground",
          title: options.title || "Blocks",
          icon: BlockContentIcon,
          component: () => (
            <BlockPlaygroundProvider options={options}>
              <ToolShell>
                <BlockPlaygroundTool options={options} />
              </ToolShell>
            </BlockPlaygroundProvider>
          ),
        },
      ],
    };
  },
);
