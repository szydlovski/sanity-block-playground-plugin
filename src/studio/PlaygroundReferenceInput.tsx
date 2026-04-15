"use client";

import { LinkIcon, TrashIcon } from "@sanity/icons";
import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Spinner,
  Stack,
  Text,
  TextInput,
} from "@sanity/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useClient } from "sanity";

export type DocListRow = {
  _id: string;
  _type: string;
  label: string | null;
  slug: string | null;
};

export function parseReferenceRefId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const o = value as { _ref?: string };
  return typeof o._ref === "string" ? o._ref : null;
}

function buildReferenceValue(
  doc: DocListRow,
  weak: boolean,
): {
  _type: "reference";
  _ref: string;
  _weak?: boolean;
  _refType?: string;
  _refSlug?: string;
} {
  const base = {
    _type: "reference" as const,
    _ref: doc._id,
    _refType: doc._type,
    _refSlug: doc.slug ?? undefined,
  };
  return weak ? { ...base, _weak: true } : base;
}

function hasReferencePreviewMeta(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const ref = value as { _refType?: unknown; _refSlug?: unknown };
  return typeof ref._refType === "string" || typeof ref._refSlug === "string";
}

const LIST_QUERY = `*[_type in $types] | order(_updatedAt desc) [0...200] {
  _id,
  _type,
  "label": coalesce(title, name, string(_id)),
  "slug": slug.current
}`;

const SINGLE_QUERY = `*[_id == $id][0] {
  _id,
  _type,
  "label": coalesce(title, name, string(_id)),
  "slug": slug.current
}`;

interface PlaygroundReferenceInputProps {
  label: string;
  description?: string;
  value: unknown;
  onChange: (next: unknown) => void;
  /** Document `_type` values allowed by the reference field (`to`). */
  toTypes: string[];
  /** Mirror Sanity `weak` on the reference field. */
  weak?: boolean;
}

export function PlaygroundReferenceInput({
  label,
  description,
  value,
  onChange,
  toTypes,
  weak = false,
}: PlaygroundReferenceInputProps) {
  const client = useClient({ apiVersion: "2024-12-12" });
  const refId = parseReferenceRefId(value);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [rows, setRows] = useState<DocListRow[]>([]);
  const [filter, setFilter] = useState("");
  const [selectedPreview, setSelectedPreview] = useState<DocListRow | null>(null);

  useEffect(() => {
    if (!refId) {
      setSelectedPreview(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const doc = await client.fetch<DocListRow | null>(SINGLE_QUERY, { id: refId });
        if (!cancelled) setSelectedPreview(doc);
        if (!cancelled && doc && !hasReferencePreviewMeta(value)) {
          onChange(buildReferenceValue(doc, weak));
        }
      } catch {
        if (!cancelled) setSelectedPreview(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, onChange, refId, value, weak]);

  const openPicker = useCallback(async () => {
    if (toTypes.length === 0) return;
    setPickerOpen(true);
    setLoadingList(true);
    setFilter("");
    try {
      const list = await client.fetch<DocListRow[]>(LIST_QUERY, { types: toTypes });
      setRows(list);
    } catch {
      setRows([]);
    } finally {
      setLoadingList(false);
    }
  }, [client, toTypes]);

  const pick = useCallback(
    (row: DocListRow) => {
      onChange(buildReferenceValue(row, weak));
      setPickerOpen(false);
    },
    [onChange, weak],
  );

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const labelText = (r.label ?? "").toLowerCase();
      const slugText = (r.slug ?? "").toLowerCase();
      const idText = r._id.toLowerCase();
      const typeText = r._type.toLowerCase();
      return (
        labelText.includes(q) ||
        slugText.includes(q) ||
        idText.includes(q) ||
        typeText.includes(q)
      );
    });
  }, [rows, filter]);

  if (toTypes.length === 0) {
    return (
      <Box marginBottom={3}>
        <Stack space={1} marginBottom={2}>
          <Text size={1} weight="semibold" style={{ textTransform: "none" }}>
            {label}
          </Text>
          {description ? (
            <Text muted size={0}>
              {description}
            </Text>
          ) : null}
        </Stack>
        <Text muted size={1}>
          This reference has no target types configured.
        </Text>
      </Box>
    );
  }

  return (
    <Box marginBottom={3}>
      <Stack space={1} marginBottom={2}>
        <Text size={1} weight="semibold" style={{ textTransform: "none" }}>
          {label}
        </Text>
        {description ? (
          <Text muted size={0}>
            {description}
          </Text>
        ) : null}
      </Stack>

      <Stack space={3}>
        {refId ? (
          <Card padding={3} radius={2} border>
            <Flex align="flex-start" justify="space-between" gap={3}>
              <Stack space={2} style={{ flex: "1 1 auto", minWidth: 0 }}>
                <Text size={1} weight="semibold" style={{ wordBreak: "break-word" }}>
                  {selectedPreview?.label ?? refId}
                </Text>
                <Text muted size={0}>
                  {selectedPreview ? `${selectedPreview._type}` : "document"}
                  {selectedPreview?.slug ? ` · /${selectedPreview.slug}` : ""}
                </Text>
                <Text muted size={0} style={{ fontFamily: "monospace", fontSize: 11 }}>
                  {refId}
                </Text>
              </Stack>
              <Flex gap={2} wrap="wrap" style={{ flexShrink: 0 }}>
                <Button
                  icon={LinkIcon}
                  text="Change"
                  mode="default"
                  fontSize={1}
                  onClick={openPicker}
                />
                <Button
                  icon={TrashIcon}
                  text="Clear"
                  mode="ghost"
                  tone="critical"
                  fontSize={1}
                  onClick={() => onChange(undefined)}
                />
              </Flex>
            </Flex>
          </Card>
        ) : (
          <Button
            icon={LinkIcon}
            text="Choose document"
            mode="default"
            onClick={openPicker}
          />
        )}
      </Stack>

      {pickerOpen ? (
        <Dialog
          header="Choose document"
          id="block-playground-reference-picker"
          onClose={() => setPickerOpen(false)}
          width={2}
          zOffset={8000}
        >
          <Box padding={4}>
            <Stack space={3}>
              <TextInput
                placeholder="Filter by title, slug, type…"
                value={filter}
                onChange={(e) => setFilter(e.currentTarget.value)}
                fontSize={1}
              />
              {loadingList ? (
                <Flex justify="center" padding={4}>
                  <Spinner />
                </Flex>
              ) : (
                <Stack space={2} style={{ maxHeight: 360, overflowY: "auto" }}>
                  {filtered.map((row) => (
                    <Card
                      key={row._id}
                      padding={3}
                      radius={2}
                      border
                      style={{ cursor: "pointer" }}
                      onClick={() => pick(row)}
                    >
                      <Text size={1} weight="semibold">
                        {row.label ?? row._id}
                      </Text>
                      <Text muted size={0}>
                        {row._type}
                        {row.slug ? ` · /${row.slug}` : ""}
                      </Text>
                    </Card>
                  ))}
                </Stack>
              )}
              {!loadingList && filtered.length === 0 ? (
                <Text muted size={1}>
                  {rows.length === 0
                    ? "No documents match these types in the dataset."
                    : "No documents match your filter."}
                </Text>
              ) : null}
            </Stack>
          </Box>
        </Dialog>
      ) : null}
    </Box>
  );
}
