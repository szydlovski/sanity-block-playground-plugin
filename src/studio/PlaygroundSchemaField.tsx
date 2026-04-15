"use client";

import {
  Box,
  Button,
  Card,
  Flex,
  Stack,
  Switch,
  Text,
  TextArea,
  TextInput,
} from "@sanity/ui";
import type { BlockFieldDefinition } from "../types";
import { useBlockPlaygroundOptions } from "./BlockPlaygroundContext";
import { PlaygroundImageInput } from "./PlaygroundImageInput";
import { PlaygroundPortableTextField } from "./PlaygroundPortableTextField";
import { PlaygroundReferenceInput } from "./PlaygroundReferenceInput";

type SchemaNode = {
  name?: string;
  title?: string;
  description?: string;
  type?: string | SchemaNode;
  initialValue?: unknown;
  /** Sanity `hidden` — boolean or callback `{ parent, value }` (Studio subset). */
  hidden?: unknown;
  weak?: boolean;
  to?: unknown[];
  options?: { list?: unknown[]; weak?: boolean };
  fields?: unknown[];
  of?: unknown[];
};

type SchemaFieldLike = SchemaNode & { name: string };

function getNamedSchemaType(
  namedSchemaTypes: Record<string, unknown> | undefined,
  typeName: string,
): SchemaNode | undefined {
  const candidate = namedSchemaTypes?.[typeName];
  return isSchemaNode(candidate) ? candidate : undefined;
}

function isSchemaNode(v: unknown): v is SchemaNode {
  return Boolean(v && typeof v === "object");
}

function getTypeName(schema: SchemaNode | undefined): string | undefined {
  if (!schema) return undefined;
  if (typeof schema.type === "string") return schema.type;
  if (isSchemaNode(schema.type)) return schema.type.name ?? getTypeName(schema.type);
  return undefined;
}

function resolveSchemaNode(
  schema: SchemaNode | undefined,
  namedSchemaTypes?: Record<string, unknown>,
): SchemaNode | undefined {
  if (!schema) return undefined;

  // Some Sanity field definitions embed a full type object in `type`.
  if (isSchemaNode(schema.type)) {
    const merged: SchemaNode = {
      ...schema.type,
      // Prefer the registered type name (e.g. `portableText`) over the field name (`body`)
      // so `getSchemaKind` recognizes named types; the field's `name` is still on the outer
      // `schema` when we iterate `fields` for paths.
      name: schema.type.name ?? schema.name,
      title: schema.title ?? schema.type.title,
      description: schema.description ?? schema.type.description,
      initialValue:
        schema.initialValue !== undefined ? schema.initialValue : schema.type.initialValue,
    };
    return resolveSchemaNode(merged, namedSchemaTypes);
  }

  if (
    (schema.type === "object" || schema.type === "array") &&
    (Array.isArray(schema.fields) || Array.isArray(schema.of))
  ) {
    return schema;
  }
  const typeName = getTypeName(schema);
  if (typeName) {
    const registered = getNamedSchemaType(namedSchemaTypes, typeName);
    if (!registered) return schema;
    return {
      ...registered,
      // Keep the registered type name (`portableText`, `link`) so `getSchemaKind` matches,
      // not the field name (`body`, `cta`).
      name: registered.name ?? schema.name,
      title: schema.title ?? registered.title,
      description: schema.description ?? registered.description,
      initialValue:
        schema.initialValue !== undefined ? schema.initialValue : registered.initialValue,
    };
  }
  return schema;
}

function getReferenceTargetTypes(resolvedSchema: SchemaNode | undefined): string[] {
  if (!resolvedSchema?.to || !Array.isArray(resolvedSchema.to)) return [];
  const out: string[] = [];
  for (const item of resolvedSchema.to) {
    if (!isSchemaNode(item)) continue;
    if (typeof item.type === "string") {
      out.push(item.type);
    } else if (isSchemaNode(item.type) && typeof item.type.name === "string") {
      out.push(item.type.name);
    }
  }
  return out;
}

function isWeakReferenceField(resolvedSchema: SchemaNode | undefined): boolean {
  if (!resolvedSchema) return false;
  if (resolvedSchema.weak === true) return true;
  const w = resolvedSchema.options?.weak;
  return w === true;
}

/** Match Studio behaviour for `hidden` on object fields (e.g. link internal vs external). */
function evalFieldHidden(
  field: SchemaFieldLike,
  parentValue: Record<string, unknown>,
): boolean {
  const h = field.hidden;
  if (h === undefined || h === false) return false;
  if (h === true) return true;
  if (typeof h === "function") {
    try {
      const value = parentValue[field.name];
      const ctx = { parent: parentValue, value };
      return Boolean((h as (args: typeof ctx) => boolean)(ctx));
    } catch {
      return false;
    }
  }
  return Boolean(h);
}

function toHumanLabel(path: string): string {
  return path
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (ch) => ch.toUpperCase())
    .trim();
}

function getChoices(list: unknown[] | undefined) {
  if (!list?.length) return undefined;
  const choices = list
    .map((item) => {
      if (typeof item === "string") return { title: item, value: item };
      if (
        item &&
        typeof item === "object" &&
        "value" in item &&
        typeof (item as { value: unknown }).value === "string"
      ) {
        const asObj = item as { title?: unknown; value: string };
        return {
          title:
            typeof asObj.title === "string" && asObj.title.length > 0
              ? asObj.title
              : asObj.value,
          value: asObj.value,
        };
      }
      return null;
    })
    .filter((item): item is { title: string; value: string } => item !== null);
  return choices.length > 0 ? choices : undefined;
}

function getSchemaKind(
  schema: SchemaNode | undefined,
  namedSchemaTypes?: Record<string, unknown>,
):
  | "text"
  | "textarea"
  | "boolean"
  | "number"
  | "select"
  | "image"
  | "object"
  | "array"
  | "portableText"
  | "reference"
  | "unknown" {
  if (!schema) return "unknown";
  if (getTypeName(schema) === "portableText") return "portableText";
  const resolved = resolveSchemaNode(schema, namedSchemaTypes);
  if (!resolved) return "unknown";
  if (resolved.type === "reference") return "reference";
  /** Custom `portableText` type in this repo is `defineType({ name: "portableText", type: "array", ... })`. */
  if (resolved.name === "portableText") return "portableText";
  if (resolved.options?.list?.length) return "select";
  switch (resolved.type) {
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "image":
      return "image";
    case "text":
      return "textarea";
    case "string":
    case "url":
      return "text";
    case "object":
      return "object";
    case "array":
      return "array";
    case "portableText":
      return "portableText";
    default:
      return "unknown";
  }
}

function createDefaultForSchema(
  schema: SchemaNode | undefined,
  namedSchemaTypes?: Record<string, unknown>,
): unknown {
  const resolved = resolveSchemaNode(schema, namedSchemaTypes);
  if (!resolved) return "";
  if (resolved.initialValue !== undefined) return resolved.initialValue;
  const kind = getSchemaKind(resolved, namedSchemaTypes);

  if (kind === "select") {
    const first = getChoices(resolved.options?.list)?.[0];
    return first?.value ?? "";
  }
  if (kind === "boolean") return false;
  if (kind === "number") return 0;
  if (kind === "text" || kind === "textarea") return "";
  if (kind === "portableText") return [];
  if (kind === "array") return [];
  if (kind === "reference") return undefined;
  if (kind === "object") {
    const out: Record<string, unknown> = {};
    const fields = Array.isArray(resolved.fields) ? resolved.fields : [];
    for (const raw of fields) {
      if (!isSchemaNode(raw) || typeof raw.name !== "string") continue;
      const field = raw as SchemaFieldLike;
      if (evalFieldHidden(field, out)) continue;
      const next = createDefaultForSchema(raw, namedSchemaTypes);
      if (next !== undefined) out[field.name] = next;
    }
    return out;
  }
  return "";
}

function createArrayItemDefault(
  member: SchemaNode | undefined,
  namedSchemaTypes?: Record<string, unknown>,
): unknown {
  const resolvedMember = resolveSchemaNode(member, namedSchemaTypes);
  const next = createDefaultForSchema(resolvedMember, namedSchemaTypes);
  if (
    !resolvedMember ||
    resolvedMember.type !== "object" ||
    !next ||
    typeof next !== "object"
  ) {
    return next;
  }

  const asObj = next as Record<string, unknown>;
  const withType =
    typeof resolvedMember.name === "string" && resolvedMember.name.length > 0
      ? { _type: resolvedMember.name, ...asObj }
      : asObj;

  if ("_key" in withType) return withType;
  return {
    ...withType,
    _key:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
        : Math.random().toString(36).slice(2, 14),
  };
}

function FieldLabel({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  return (
    <Stack space={2} marginBottom={2}>
      <Text size={1} weight="semibold" style={{ textTransform: "none" }}>
        {label}
      </Text>
      {description ? (
        <Text muted size={0}>
          {description}
        </Text>
      ) : null}
    </Stack>
  );
}

function SchemaFieldEditor({
  schema,
  value,
  onChange,
  label,
  description,
  blockKey,
}: {
  schema: SchemaNode | undefined;
  value: unknown;
  onChange: (next: unknown) => void;
  label: string;
  description?: string;
  blockKey: string | null;
}) {
  const { namedSchemaTypes } = useBlockPlaygroundOptions();
  const resolvedSchema = resolveSchemaNode(schema, namedSchemaTypes);
  const kind = getSchemaKind(resolvedSchema, namedSchemaTypes);

  if (kind === "boolean") {
    return (
      <Box marginBottom={4}>
        <Flex align="center" gap={3} justify="space-between">
          <Stack space={2}>
            <Text size={1} weight="semibold" style={{ textTransform: "none" }}>
              {label}
            </Text>
            {description ? (
              <Text muted size={0}>
                {description}
              </Text>
            ) : null}
          </Stack>
          <Switch
            checked={Boolean(value)}
            onChange={(e) => onChange(e.currentTarget.checked)}
          />
        </Flex>
      </Box>
    );
  }

  if (kind === "number") {
    const n = typeof value === "number" ? value : Number(value ?? 0);
    return (
      <Box marginBottom={4}>
        <FieldLabel label={label} description={description} />
        <TextInput
          type="number"
          value={String(Number.isFinite(n) ? n : 0)}
          onChange={(e) => {
            const next = Number(e.currentTarget.value);
            onChange(Number.isFinite(next) ? next : 0);
          }}
          fontSize={1}
        />
      </Box>
    );
  }

  if (kind === "select") {
    const choices = getChoices(resolvedSchema?.options?.list) ?? [];
    const current = value == null ? "" : String(value);
    return (
      <Box marginBottom={4}>
        <FieldLabel label={label} description={description} />
        <SelectNative
          value={current}
          onChange={(v) => onChange(v)}
          choices={choices}
        />
      </Box>
    );
  }

  if (kind === "textarea") {
    const current = value == null ? "" : String(value);
    return (
      <Box marginBottom={4}>
        <FieldLabel label={label} description={description} />
        <TextArea
          value={current}
          onChange={(e) => onChange(e.currentTarget.value)}
          rows={4}
          fontSize={1}
        />
      </Box>
    );
  }

  if (kind === "image") {
    return (
      <PlaygroundImageInput
        label={label}
        description={description}
        value={value}
        onChange={onChange}
      />
    );
  }

  if (kind === "reference") {
    return (
      <PlaygroundReferenceInput
        label={label}
        description={description}
        value={value}
        onChange={onChange}
        toTypes={getReferenceTargetTypes(resolvedSchema)}
        weak={isWeakReferenceField(resolvedSchema)}
      />
    );
  }

  if (kind === "portableText") {
    const def: BlockFieldDefinition = {
      path: "value",
      label,
      description,
    };
    const wrapperValue = {
      value: Array.isArray(value) ? value : [],
    };
    return (
      <Box marginBottom={4}>
        <FieldLabel label={label} description={description} />
        <PlaygroundPortableTextField
          blockKey={blockKey}
          def={def}
          value={wrapperValue}
          onChange={(next) => onChange((next as Record<string, unknown>).value)}
          hideLabel
        />
      </Box>
    );
  }

  if (kind === "array") {
    const list = Array.isArray(value) ? value : [];
    const memberSchema = Array.isArray(resolvedSchema?.of)
      ? (resolvedSchema.of.filter(isSchemaNode)[0] ?? undefined)
      : undefined;
    return (
      <Box marginBottom={4}>
        <FieldLabel label={label} description={description} />
        <Stack space={2}>
          {list.map((item, index) => (
            <Card key={`arr-${index}`} padding={2} radius={2} border>
              <Flex justify="space-between" align="center" marginBottom={2}>
                <Text size={1} muted>
                  #{index + 1}
                </Text>
                <Button
                  text="Remove"
                  mode="ghost"
                  tone="critical"
                  fontSize={1}
                  onClick={() => onChange(list.filter((_, i) => i !== index))}
                />
              </Flex>
              {memberSchema ? (
                <SchemaValueEditor
                  blockKey={blockKey}
                  schema={memberSchema}
                  value={item}
                  onChange={(next) => {
                    const copy = [...list];
                    copy[index] = next;
                    onChange(copy);
                  }}
                />
              ) : (
                <Text size={1} muted>
                  Unsupported array schema
                </Text>
              )}
            </Card>
          ))}
          <Button
            text="Add item"
            mode="ghost"
            fontSize={1}
            onClick={() =>
              onChange([...list, createArrayItemDefault(memberSchema, namedSchemaTypes)])
            }
          />
        </Stack>
      </Box>
    );
  }

  if (kind === "object") {
    const fields = Array.isArray(resolvedSchema?.fields)
      ? resolvedSchema.fields.filter(
          (raw): raw is SchemaFieldLike =>
            isSchemaNode(raw) && typeof raw.name === "string" && raw.name.length > 0,
        )
      : [];
    const objectValue =
      value && typeof value === "object" ? (value as Record<string, unknown>) : {};
    const visibleFields = fields.filter((field) => !evalFieldHidden(field, objectValue));

    return (
      <Box marginBottom={4}>
        <FieldLabel label={label} description={description} />
        <Card padding={2} radius={2} border>
          <Stack space={2}>
            {visibleFields.map((field) => (
              <SchemaFieldEditor
                key={field.name}
                blockKey={blockKey}
                schema={field}
                value={objectValue[field.name]}
                onChange={(next) =>
                  onChange({
                    ...objectValue,
                    [field.name]: next,
                  })
                }
                label={field.title || toHumanLabel(field.name)}
                description={field.description}
              />
            ))}
          </Stack>
        </Card>
      </Box>
    );
  }

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return (
      <Box marginBottom={4}>
        <FieldLabel label={label} description={description} />
        <Text muted size={1}>
          This field type is not supported in the playground yet.
        </Text>
      </Box>
    );
  }

  const current = value == null ? "" : String(value);
  return (
    <Box marginBottom={4}>
      <FieldLabel label={label} description={description} />
      <TextInput
        value={current}
        onChange={(e) => onChange(e.currentTarget.value)}
        fontSize={1}
      />
    </Box>
  );
}

function SchemaValueEditor({
  blockKey,
  schema,
  value,
  onChange,
}: {
  blockKey: string | null;
  schema: SchemaNode;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const { namedSchemaTypes } = useBlockPlaygroundOptions();
  const resolvedSchema = resolveSchemaNode(schema, namedSchemaTypes);
  const kind = getSchemaKind(resolvedSchema, namedSchemaTypes);

  if (kind === "object") {
    const fields = Array.isArray(resolvedSchema?.fields)
      ? resolvedSchema.fields.filter(
          (raw): raw is SchemaFieldLike =>
            isSchemaNode(raw) && typeof raw.name === "string" && raw.name.length > 0,
        )
      : [];
    const objectValue =
      value && typeof value === "object" ? (value as Record<string, unknown>) : {};
    const visibleFields = fields.filter((field) => !evalFieldHidden(field, objectValue));

    return (
      <Stack space={2}>
        {visibleFields.map((field) => (
          <SchemaFieldEditor
            key={field.name}
            blockKey={blockKey}
            schema={field}
            value={objectValue[field.name]}
            onChange={(next) =>
              onChange({
                ...objectValue,
                [field.name]: next,
              })
            }
            label={field.title || toHumanLabel(field.name)}
            description={field.description}
          />
        ))}
      </Stack>
    );
  }

  if (kind === "array") {
    const list = Array.isArray(value) ? value : [];
    const memberSchema = Array.isArray(resolvedSchema?.of)
      ? (resolvedSchema.of.filter(isSchemaNode)[0] ?? undefined)
      : undefined;
    return (
      <Stack space={2}>
        {list.map((item, index) => (
          <Card key={`nested-arr-${index}`} padding={2} radius={2} border>
            <Flex justify="space-between" align="center" marginBottom={2}>
              <Text size={1} muted>
                #{index + 1}
              </Text>
              <Button
                text="Remove"
                mode="ghost"
                tone="critical"
                fontSize={1}
                onClick={() => onChange(list.filter((_, i) => i !== index))}
              />
            </Flex>
            {memberSchema ? (
              <SchemaValueEditor
                blockKey={blockKey}
                schema={memberSchema}
                value={item}
                onChange={(next) => {
                  const copy = [...list];
                  copy[index] = next;
                  onChange(copy);
                }}
              />
            ) : null}
          </Card>
        ))}
        <Button
          text="Add item"
          mode="ghost"
          fontSize={1}
          onClick={() =>
            onChange([...list, createArrayItemDefault(memberSchema, namedSchemaTypes)])
          }
        />
      </Stack>
    );
  }

  if (kind === "reference") {
    return (
      <PlaygroundReferenceInput
        label={resolvedSchema?.title || "Reference"}
        description={resolvedSchema?.description}
        value={value}
        onChange={onChange}
        toTypes={getReferenceTargetTypes(resolvedSchema)}
        weak={isWeakReferenceField(resolvedSchema)}
      />
    );
  }

  if (kind === "image") {
    return (
      <PlaygroundImageInput
        label={resolvedSchema?.title || "Image"}
        description={resolvedSchema?.description}
        value={value}
        onChange={onChange}
      />
    );
  }

  if (kind === "portableText") {
    const def: BlockFieldDefinition = {
      path: "value",
      label: resolvedSchema?.title || "Rich text",
      description: resolvedSchema?.description,
    };
    const wrapperValue = {
      value: Array.isArray(value) ? value : [],
    };
    return (
      <PlaygroundPortableTextField
        blockKey={blockKey}
        def={def}
        value={wrapperValue}
        onChange={(next) => onChange((next as Record<string, unknown>).value)}
        hideLabel
      />
    );
  }

  if (kind === "textarea") {
    const current = value == null ? "" : String(value);
    return (
      <TextArea
        value={current}
        onChange={(e) => onChange(e.currentTarget.value)}
        rows={3}
        fontSize={1}
      />
    );
  }

  if (kind === "number") {
    const n = typeof value === "number" ? value : Number(value ?? 0);
    return (
      <TextInput
        type="number"
        value={String(Number.isFinite(n) ? n : 0)}
        onChange={(e) => {
          const next = Number(e.currentTarget.value);
          onChange(Number.isFinite(next) ? next : 0);
        }}
        fontSize={1}
      />
    );
  }

  if (kind === "boolean") {
    return <Switch checked={Boolean(value)} onChange={(e) => onChange(e.currentTarget.checked)} />;
  }

  if (kind === "select") {
    const current = value == null ? "" : String(value);
    return (
      <SelectNative
        value={current}
        onChange={(v) => onChange(v)}
        choices={getChoices(resolvedSchema?.options?.list) ?? []}
      />
    );
  }

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return (
      <Text muted size={1}>
        This field type is not supported in the playground yet.
      </Text>
    );
  }

  const current = value == null ? "" : String(value);
  return <TextInput value={current} onChange={(e) => onChange(e.currentTarget.value)} fontSize={1} />;
}

function SelectNative({
  value,
  onChange,
  choices,
}: {
  value: string;
  onChange: (v: string) => void;
  choices: { title: string; value: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      style={{
        width: "100%",
        fontSize: 13,
        padding: "8px 10px",
        borderRadius: 4,
        border: "1px solid var(--card-border-color)",
        background: "var(--card-bg-color)",
        color: "var(--card-fg-color)",
      }}
    >
      {choices.map((c) => (
        <option key={c.value} value={c.value}>
          {c.title}
        </option>
      ))}
    </select>
  );
}

/** Renders any Sanity field (including nested objects/arrays) using one schema-driven tree. */
export function PlaygroundSchemaField({
  schema,
  value,
  onChange,
  label,
  description,
  blockKey = null,
}: {
  schema: unknown;
  value: unknown;
  onChange: (next: unknown) => void;
  label: string;
  description?: string;
  blockKey?: string | null;
}) {
  if (!isSchemaNode(schema)) {
    return (
      <Box marginBottom={4}>
        <FieldLabel label={label} description={description} />
        <Text size={1} muted>
          Missing schema metadata for this field.
        </Text>
      </Box>
    );
  }

  return (
    <SchemaFieldEditor
      schema={schema}
      value={value}
      onChange={onChange}
      label={label}
      description={description}
      blockKey={blockKey ?? null}
    />
  );
}
