"use client";

import { ImageIcon, TrashIcon, UploadIcon } from "@sanity/icons";
import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Grid,
  Spinner,
  Stack,
  Text,
} from "@sanity/ui";
import { createImageUrlBuilder } from "@sanity/image-url";
import { useCallback, useEffect, useRef, useState } from "react";
import { useClient } from "sanity";

function sanityImageFromRef(assetId: string) {
  return {
    _type: "image" as const,
    asset: {
      _type: "reference" as const,
      _ref: assetId,
    },
  };
}

function isSanityImageValue(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const o = v as { _type?: string; asset?: { _ref?: string } };
  return o._type === "image" && typeof o.asset?._ref === "string";
}

function parseSanityAssetRefFromCdnUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    if (url.hostname !== "cdn.sanity.io") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 4 || parts[0] !== "images") return null;
    const filename = parts[3] ?? "";
    const m = filename.match(/^([A-Za-z0-9]+)-(\d+x\d+)\.([A-Za-z0-9]+)$/);
    if (!m) return null;
    const [, assetId, dimensions, format] = m;
    return `image-${assetId}-${dimensions}-${format}`;
  } catch {
    return null;
  }
}

function normalizeImageValue(value: unknown): unknown {
  if (isSanityImageValue(value)) return value;
  const ref = parseSanityAssetRefFromCdnUrl(value);
  return ref ? sanityImageFromRef(ref) : value;
}

interface PlaygroundImageInputProps {
  label: string;
  description?: string;
  value: unknown;
  onChange: (next: unknown) => void;
}

const ASSET_QUERY = `*[_type == "sanity.imageAsset"] | order(_updatedAt desc) [0...72] { _id }`;

export function PlaygroundImageInput({
  label,
  description,
  value,
  onChange,
}: PlaygroundImageInputProps) {
  const client = useClient({ apiVersion: "2024-12-12" });
  const cfg = client.config();
  const projectId = cfg.projectId ?? "";
  const dataset = cfg.dataset ?? "";
  const urlFor = createImageUrlBuilder({ projectId, dataset });

  const fileRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingLib, setLoadingLib] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [assetIds, setAssetIds] = useState<string[]>([]);
  const [showImageActions, setShowImageActions] = useState(false);
  const lastNormalizedRef = useRef<string | null>(null);

  useEffect(() => {
    if (isSanityImageValue(value)) return;
    const nextRef = parseSanityAssetRefFromCdnUrl(value);
    if (!nextRef || lastNormalizedRef.current === nextRef) return;
    lastNormalizedRef.current = nextRef;
    onChange(sanityImageFromRef(nextRef));
  }, [value, onChange]);

  const normalizedValue = normalizeImageValue(value);

  const previewUrl = isSanityImageValue(normalizedValue)
    ? urlFor.image(normalizedValue as never).width(640).height(400).fit("max").url()
    : null;

  const openLibrary = useCallback(async () => {
    setPickerOpen(true);
    setLoadingLib(true);
    try {
      const rows = await client.fetch<Array<{ _id: string }>>(ASSET_QUERY);
      setAssetIds(rows.map((r) => r._id));
    } catch {
      setAssetIds([]);
    } finally {
      setLoadingLib(false);
    }
  }, [client]);

  const pickAsset = useCallback(
    (id: string) => {
      onChange(sanityImageFromRef(id));
      setPickerOpen(false);
    },
    [onChange],
  );

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !file.type.startsWith("image/")) return;
      setUploading(true);
      try {
        const asset = await client.assets.upload("image", file, {
          filename: file.name,
        });
        onChange(sanityImageFromRef(asset._id));
      } finally {
        setUploading(false);
      }
    },
    [client, onChange],
  );

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

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={onFile}
      />

      <Stack space={3}>
        {previewUrl ? (
          <Card
            padding={2}
            radius={2}
            border
            style={{ position: "relative", overflow: "hidden" }}
            onMouseEnter={() => setShowImageActions(true)}
            onMouseLeave={() => setShowImageActions(false)}
            onFocus={() => setShowImageActions(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setShowImageActions(false);
              }
            }}
          >
            <Flex align="center" justify="space-between" gap={3}>
              <Box style={{ flex: "1 1 auto", minWidth: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: 88,
                    maxHeight: 140,
                    objectFit: "contain",
                    borderRadius: 4,
                    display: "block",
                  }}
                />
              </Box>

              <Box
                style={{
                  opacity: showImageActions ? 1 : 0,
                  pointerEvents: showImageActions ? "auto" : "none",
                  transition: "opacity 120ms ease",
                  minWidth: 122,
                }}
              >
                <Stack space={2}>
                  <Button
                    icon={UploadIcon}
                    text={uploading ? "Uploading…" : "Upload file"}
                    mode="default"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                  />
                  <Button
                    icon={ImageIcon}
                    text="Media library"
                    mode="default"
                    disabled={uploading}
                    onClick={openLibrary}
                  />
                  <Button
                    icon={TrashIcon}
                    mode="default"
                    tone="critical"
                    text="Remove"
                    onClick={() => onChange(undefined)}
                  />
                </Stack>
              </Box>
            </Flex>
          </Card>
        ) : (
          <Text muted size={1}>
            No image
          </Text>
        )}

        {!previewUrl ? (
          <Flex gap={2} wrap="wrap">
            <Button
              icon={UploadIcon}
              text={uploading ? "Uploading…" : "Upload file"}
              mode="default"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            />
            <Button
              icon={ImageIcon}
              text="Media library"
              mode="ghost"
              onClick={openLibrary}
            />
          </Flex>
        ) : null}
        {uploading ? <Spinner muted /> : null}
      </Stack>

      {pickerOpen ? (
        <Dialog
          header="Choose image from library"
          id="block-playground-asset-picker"
          onClose={() => setPickerOpen(false)}
          width={2}
          zOffset={8000}
        >
          <Box padding={4}>
            {loadingLib ? (
              <Flex justify="center" padding={4}>
                <Spinner />
              </Flex>
            ) : (
              <Grid columns={[2, 3, 4, 5]} gap={2}>
                {assetIds.map((id) => {
                  const thumb = urlFor
                    .image(sanityImageFromRef(id) as never)
                    .width(120)
                    .height(120)
                    .fit("crop")
                    .url();
                  return (
                    <Card
                      key={id}
                      padding={1}
                      radius={2}
                      border
                      style={{ cursor: "pointer", overflow: "hidden" }}
                      onClick={() => pickAsset(id)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumb}
                        alt=""
                        style={{
                          width: "100%",
                          aspectRatio: "1",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </Card>
                  );
                })}
              </Grid>
            )}
            {!loadingLib && assetIds.length === 0 ? (
              <Text muted size={1}>
                No images in the project. Upload a file above.
              </Text>
            ) : null}
          </Box>
        </Dialog>
      ) : null}
    </Box>
  );
}
