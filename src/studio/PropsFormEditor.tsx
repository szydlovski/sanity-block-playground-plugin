"use client";

import { useEffect, useRef } from "react";
import { Box, Stack, Text } from "@sanity/ui";
import { getAtPath, setAtPath } from "../paths";
import type { BlockFieldDefinition } from "../types";
import { PlaygroundSchemaField } from "./PlaygroundSchemaField";

interface PropsFormEditorProps {
  blockKey: string | null;
  definitions: BlockFieldDefinition[];
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}

export function PropsFormEditor({
  blockKey,
  definitions,
  value,
  onChange,
}: PropsFormEditorProps) {
  /** Chains top-level `setAtPath` updates when React has not re-rendered yet (nested columns + PT debounce, etc.). */
  const valueRef = useRef(value);
  valueRef.current = value;
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  return (
    <Stack space={3}>
      {definitions.map((def) => {
        const cur = getAtPath(value, def.path);
        if (def.schema === undefined) {
          return (
            <Box key={`${blockKey ?? "none"}-${def.path}`} marginBottom={4}>
              <Text size={1} muted>
                {`Missing schema for field "${def.label}".`}
              </Text>
            </Box>
          );
        }
        return (
          <Box key={`${blockKey ?? "none"}-${def.path}`} marginBottom={4}>
            <PlaygroundSchemaField
              schema={def.schema}
              value={cur}
              onChange={(next) => {
                const root = setAtPath(valueRef.current, def.path, next);
                valueRef.current = root;
                onChange(root);
              }}
              label={def.label}
              description={def.description}
              blockKey={blockKey}
            />
          </Box>
        );
      })}
    </Stack>
  );
}
