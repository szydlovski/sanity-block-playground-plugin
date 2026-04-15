"use client";

import {
  EditorProvider,
  PortableTextEditable,
  PortableTextEditor,
  useEditor,
  useEditorSelector,
  usePortableTextEditor,
} from "@portabletext/editor";
import type { PortableTextBlock } from "@portabletext/schema";
import { type ReactNode, useEffect, useLayoutEffect, useRef } from "react";
import { Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";
import { getAtPath, setAtPath } from "../paths";
import type { BlockFieldDefinition } from "../types";
import { playgroundPortableTextSchemaDefinition } from "./playground-pte-schema";

function toBlocks(v: unknown): PortableTextBlock[] {
  if (!Array.isArray(v)) return [];
  return v as PortableTextBlock[];
}

function renderStyleNode(style: unknown, children: ReactNode) {
  if (style === "h2") return <h2 style={{ fontSize: 24, fontWeight: 700 }}>{children}</h2>;
  if (style === "h3") return <h3 style={{ fontSize: 20, fontWeight: 700 }}>{children}</h3>;
  if (style === "h4") return <h4 style={{ fontSize: 18, fontWeight: 700 }}>{children}</h4>;
  if (style === "blockquote") {
    return (
      <blockquote
        style={{
          borderLeft: "3px solid var(--card-border-color)",
          margin: "8px 0",
          paddingLeft: 10,
          color: "var(--card-muted-fg-color)",
        }}
      >
        {children}
      </blockquote>
    );
  }
  return <p style={{ margin: "8px 0" }}>{children}</p>;
}

function renderDecoratorNode(mark: unknown, children: ReactNode) {
  if (mark === "strong") return <strong>{children}</strong>;
  if (mark === "em") return <em>{children}</em>;
  if (mark === "underline") return <u>{children}</u>;
  if (mark === "code") {
    return (
      <code
        style={{
          fontFamily: "var(--font-family-code)",
          background: "var(--card-code-bg-color)",
          borderRadius: 3,
          padding: "0 3px",
        }}
      >
        {children}
      </code>
    );
  }
  if (mark === "strike-through") return <s>{children}</s>;
  return <>{children}</>;
}

function getSchemaTypeNameFromProps(props: unknown): string | undefined {
  const p = props as { schemaType?: { name?: string; value?: string }; value?: string };
  return p.schemaType?.name ?? p.schemaType?.value ?? p.value;
}

function PlaygroundPteToolbar() {
  const pte = usePortableTextEditor();

  return (
    <Flex gap={1} wrap="wrap">
      <Button
        text="B"
        mode="ghost"
        fontSize={1}
        onClick={() => PortableTextEditor.toggleMark(pte, "strong")}
      />
      <Button
        text="I"
        mode="ghost"
        fontSize={1}
        onClick={() => PortableTextEditor.toggleMark(pte, "em")}
      />
      <Button
        text="H2"
        mode="ghost"
        fontSize={1}
        onClick={() => PortableTextEditor.toggleBlockStyle(pte, "h2")}
      />
      <Button
        text="•"
        mode="ghost"
        fontSize={1}
        onClick={() => PortableTextEditor.toggleList(pte, "bullet")}
      />
      <Button
        text="1."
        mode="ghost"
        fontSize={1}
        onClick={() => PortableTextEditor.toggleList(pte, "number")}
      />
      <Button
        text="↶"
        mode="ghost"
        fontSize={1}
        onClick={() => PortableTextEditor.undo(pte)}
      />
      <Button
        text="↷"
        mode="ghost"
        fontSize={1}
        onClick={() => PortableTextEditor.redo(pte)}
      />
    </Flex>
  );
}

function PlaygroundPortableTextSync({
  def,
  value,
  onChange,
}: {
  def: BlockFieldDefinition;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const editor = useEditor();
  const snapshotValue = useEditorSelector(editor, (s) => s.context.value);
  const valueRef = useRef(value);
  useLayoutEffect(() => {
    valueRef.current = value;
  }, [value]);

  const lastEmitted = useRef(
    JSON.stringify(getAtPath(value, def.path) ?? []),
  );

  useEffect(() => {
    const external = JSON.stringify(getAtPath(valueRef.current, def.path) ?? []);
    if (external === lastEmitted.current) return;
    lastEmitted.current = external;
    try {
      const parsed = JSON.parse(external) as PortableTextBlock[] | undefined;
      editor.send({ type: "update value", value: parsed });
    } catch {
      editor.send({ type: "update value", value: [] });
    }
  }, [editor, value, def.path]);

  useEffect(() => {
    const serialized = JSON.stringify(snapshotValue ?? []);
    if (serialized === lastEmitted.current) return;
    const t = setTimeout(() => {
      lastEmitted.current = serialized;
      onChange(setAtPath(valueRef.current, def.path, snapshotValue));
    }, 200);
    return () => clearTimeout(t);
  }, [snapshotValue, def.path, onChange]);

  return (
    <Stack space={0}>
      <Card tone="transparent" padding={1} border radius={2}>
        <PlaygroundPteToolbar />
      </Card>
      <Box
        padding={2}
        style={{
          minHeight: 180,
          maxHeight: 360,
          overflow: "auto",
          border: "1px solid var(--card-border-color)",
          borderRadius: 4,
          background: "var(--card-bg-color)",
          marginTop: 0,
        }}
      >
        <PortableTextEditable
          style={{
            outline: "none",
            minHeight: 160,
            fontFamily: "var(--font-family-sans-serif)",
            fontSize: 14,
            lineHeight: 1.5,
          }}
          renderStyle={(props: unknown) => {
            const p = props as { children?: ReactNode };
            return renderStyleNode(getSchemaTypeNameFromProps(props), p.children ?? null);
          }}
          renderDecorator={(props: unknown) => {
            const p = props as { children?: ReactNode };
            return renderDecoratorNode(getSchemaTypeNameFromProps(props), p.children ?? null);
          }}
          renderListItem={(props: unknown) => {
            const p = props as { children?: ReactNode };
            return <li>{p.children ?? null}</li>;
          }}
        />
      </Box>
    </Stack>
  );
}

export function PlaygroundPortableTextField({
  blockKey,
  def,
  value,
  onChange,
  hideLabel = false,
}: {
  blockKey: string | null;
  def: BlockFieldDefinition;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  hideLabel?: boolean;
}) {
  const initial = toBlocks(getAtPath(value, def.path));

  return (
    <Box marginBottom={3}>
      {!hideLabel ? (
        <Stack space={2} marginBottom={2}>
          <Text size={1} weight="semibold" style={{ textTransform: "none" }}>
            {def.label}
          </Text>
          {def.description ? (
            <Text muted size={0}>
              {def.description}
            </Text>
          ) : null}
        </Stack>
      ) : null}
      <Box>
        <EditorProvider
          key={`${blockKey ?? "none"}::${def.path}`}
          initialConfig={{
            schemaDefinition: playgroundPortableTextSchemaDefinition,
            initialValue: initial,
          }}
        >
          <PlaygroundPortableTextSync def={def} value={value} onChange={onChange} />
        </EditorProvider>
      </Box>
    </Box>
  );
}
