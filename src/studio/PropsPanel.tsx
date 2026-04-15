"use client";

import { useState } from "react";
import { Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";
import type { BlockFieldDefinition } from "../types";
import { PropsEditor } from "./PropsEditor";
import { PropsFormEditor } from "./PropsFormEditor";

interface PropsPanelProps {
  blockKey: string | null;
  fieldDefinitions: BlockFieldDefinition[];
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}

type PanelTab = "fields" | "json";

export function PropsPanel({
  blockKey,
  fieldDefinitions,
  value,
  onChange,
}: PropsPanelProps) {
  const hasForm = fieldDefinitions.length > 0;
  const [tab, setTab] = useState<PanelTab>(hasForm ? "fields" : "json");

  return (
    <Box
      style={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Flex
        direction="column"
        gap={2}
        padding={3}
        style={{
          flex: "0 0 auto",
          borderBottom: "1px solid var(--card-border-color)",
        }}
      >
        <Flex gap={1}>
          <Button
            text="Fields"
            mode={tab === "fields" ? "default" : "ghost"}
            fontSize={1}
            padding={2}
            disabled={!hasForm}
            onClick={() => setTab("fields")}
          />
          <Button
            text="Full JSON"
            mode={tab === "json" ? "default" : "ghost"}
            fontSize={1}
            padding={2}
            onClick={() => setTab("json")}
          />
        </Flex>
      </Flex>

      <Box
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          padding: 12,
        }}
      >
        {tab === "fields" ? (
          hasForm ? (
            <PropsFormEditor
              key={blockKey ?? "none"}
              blockKey={blockKey}
              definitions={fieldDefinitions}
              value={value}
              onChange={onChange}
            />
          ) : (
            <Text muted size={1}>
              No schema is registered for this section. Use the Full JSON tab to
              edit props.
            </Text>
          )
        ) : (
          <Stack space={3}>
            <Text muted size={1}>
              Edit the full props object as JSON (including nested Portable
              Text and links).
            </Text>
            <Card padding={3} radius={2} border>
              <PropsEditor
                key={`full-${blockKey ?? "none"}`}
                value={value}
                onChange={onChange}
              />
            </Card>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
