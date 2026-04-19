"use client";

import {
  createElement,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Box, Button, Card, Flex, Text } from "@sanity/ui";
import type { ResolvedBlockPlaygroundOptions } from "../types";
import { PropsPanel } from "./PropsPanel";
import { Sidebar } from "./Sidebar";
import { ViewportSwitcher } from "./ViewportSwitcher";

interface BlockPlaygroundToolProps {
  options: ResolvedBlockPlaygroundOptions;
}

function cloneProps(props: Record<string, unknown>): Record<string, unknown> {
  if (typeof structuredClone === "function") {
    return structuredClone(props);
  }
  return JSON.parse(JSON.stringify(props)) as Record<string, unknown>;
}

export function BlockPlaygroundTool({ options }: BlockPlaygroundToolProps) {
  const blocks = useMemo(() => options.blocks, [options]);

  const getStories = useCallback(
    (name: string | null) => {
      if (!name) return [];
      return options.getStories(name);
    },
    [options],
  );

  const getDefault = useCallback(
    (name: string | null) => {
      if (!name) return {};
      return cloneProps(options.getDefaultProps(name));
    },
    [options],
  );

  const initialName = blocks[0]?.name ?? null;
  const initialStories = getStories(initialName);
  const initialStory = initialStories[0] ?? null;

  const [selectedName, setSelectedName] = useState<string | null>(
    initialName,
  );
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(
    initialStory?.id ?? null,
  );
  const [currentProps, setCurrentProps] = useState<Record<string, unknown>>(
    () => (initialStory ? cloneProps(initialStory.props) : getDefault(initialName)),
  );
  const [previewProps, setPreviewProps] = useState<Record<string, unknown>>(
    () => (initialStory ? cloneProps(initialStory.props) : getDefault(initialName)),
  );
  const [viewportWidth, setViewportWidth] = useState("100%");

  const fieldDefinitions = useMemo(() => {
    if (!selectedName) return [];
    return options.getFieldDefinitions(selectedName);
  }, [selectedName, options]);

  const stories = useMemo(
    () => getStories(selectedName),
    [selectedName, getStories],
  );

  const selectedBlock = useMemo(
    () => blocks.find((block) => block.name === selectedName) ?? null,
    [blocks, selectedName],
  );

  const isServerPreview = selectedBlock?.render === "server";

  const PreviewComponent = useMemo(() => {
    if (!selectedName) return null;
    if (isServerPreview) return null;
    return options.resolveComponent(selectedName);
  }, [selectedName, isServerPreview, options]);

  const serverPreviewSrc = useMemo(() => {
    if (!selectedName || !isServerPreview) return null;
    if (!options.buildServerPreviewUrl) return null;
    return options.buildServerPreviewUrl({
      block: selectedName,
      props: previewProps,
    });
  }, [selectedName, isServerPreview, previewProps, options]);

  const handlePropsChange = useCallback((next: Record<string, unknown>) => {
    setCurrentProps(next);
    setPreviewProps(next);
  }, []);

  function handleSelectBlock(name: string) {
    const storyList = getStories(name);
    const story = storyList[0] ?? null;
    const defaults = story ? cloneProps(story.props) : getDefault(name);
    setSelectedName(name);
    setSelectedStoryId(story?.id ?? null);
    setCurrentProps(defaults);
    // Section switches should be instant and never show stale props.
    setPreviewProps(defaults);
  }

  const handleSelectStory = useCallback(
    (storyId: string) => {
      const story = stories.find((item) => item.id === storyId);
      if (!story) return;
      const next = cloneProps(story.props);
      setSelectedStoryId(storyId);
      setCurrentProps(next);
      setPreviewProps(next);
    },
    [stories],
  );

  if (blocks.length === 0) {
    return (
      <Box
        flex={1}
        padding={5}
        style={{
          width: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        <Text muted size={1} style={{ maxWidth: 360, textAlign: "center" }}>
          No blocks are registered. Add entries to{" "}
          <code>clientBlocks</code> and/or <code>serverBlocks</code> in the
          plugin options.
        </Text>
      </Box>
    );
  }

  return (
    <Box
      style={{
        width: "100%",
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <Flex
        align="stretch"
        flex={1}
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          overflow: "hidden",
          alignItems: "stretch",
        }}
      >
        {/* Left: block list — scrolls independently; height does not drive the iframe row */}
        <Box
          style={{
            flex: "0 0 220px",
            width: 220,
            minHeight: 0,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRight: "1px solid var(--card-border-color)",
          }}
        >
          <Box
            style={{
              flex: 1,
              minHeight: 0,
              height: "100%",
              overflowY: "auto",
              overflowX: "hidden",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
            }}
          >
            <Sidebar
              blocks={blocks}
              categoryOrder={options.categoryOrder}
              selected={selectedName}
              onSelect={handleSelectBlock}
            />
          </Box>
        </Box>

        {/* Main: toolbar + preview row — explicit column flex so Stack does not size to content */}
        <Box
          flex={1}
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box style={{ flex: "0 0 auto" }}>
            <Card borderBottom padding={2}>
              <Flex align="center" gap={3} justify="space-between">
                {stories.length > 0 ? (
                  <Flex gap={1} wrap="wrap">
                    {stories.map((story) => (
                      <Button
                        key={story.id}
                        text={story.label}
                        mode={selectedStoryId === story.id ? "default" : "ghost"}
                        fontSize={1}
                        padding={2}
                        onClick={() => handleSelectStory(story.id)}
                      />
                    ))}
                  </Flex>
                ) : (
                  <Box />
                )}
                <ViewportSwitcher
                  value={viewportWidth}
                  onChange={setViewportWidth}
                />
              </Flex>
            </Card>
          </Box>

          <Flex
            align="stretch"
            flex={1}
            style={{
              flex: 1,
              minHeight: 0,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {/* Preview: always fills remaining height next to the props column */}
            <Box
              style={{
                flex: "1 1 0%",
                minWidth: 0,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                justifyContent: "stretch",
                overflow: "hidden",
                background: "var(--card-muted-bg-color)",
              }}
            >
              <Box
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflow: "auto",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                <Box
                  style={{
                    width: viewportWidth,
                    maxWidth: "100%",
                    marginLeft: "auto",
                    marginRight: "auto",
                    height: "100%",
                    minHeight: "100%",
                    border: "1px solid var(--card-border-color)",
                    background: "var(--card-bg-color)",
                    transition: "width 0.2s ease",
                  }}
                >
                  {isServerPreview && serverPreviewSrc ? (
                    <iframe
                      key={`${selectedName ?? "none"}-${serverPreviewSrc}`}
                      src={serverPreviewSrc}
                      title={`${selectedName} server preview`}
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: "100%",
                        border: "0",
                        display: "block",
                        background: "var(--card-bg-color)",
                      }}
                    />
                  ) : isServerPreview && !serverPreviewSrc ? (
                    <Box padding={4}>
                      <Text muted size={1}>
                        Server preview is not configured. Set{" "}
                        <code>serverPreviewBasePath</code> or{" "}
                        <code>buildServerPreviewUrl</code> in the plugin options.
                      </Text>
                    </Box>
                  ) : PreviewComponent ? (
                    <Suspense
                      fallback={
                        <Box padding={4}>
                          <Text muted size={1}>
                            Loading preview…
                          </Text>
                        </Box>
                      }
                    >
                      <Box className="bg-warm text-charcoal antialiased">
                        {createElement(PreviewComponent, {
                          key: selectedName ?? "none",
                          ...previewProps,
                        })}
                      </Box>
                    </Suspense>
                  ) : (
                    <Box padding={4}>
                      <Text muted size={1}>
                        No preview component is registered for this section.
                      </Text>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Props: own scrollbar; does not shrink the iframe to its content height */}
            <Box
              style={{
                flex: "0 0 auto",
                width: 400,
                minWidth: 300,
                maxWidth: "min(44vw, 480px)",
                minHeight: 0,
                alignSelf: "stretch",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                borderLeft: "1px solid var(--card-border-color)",
                background: "var(--card-bg-color)",
              }}
            >
              <PropsPanel
                key={selectedName ?? "none"}
                blockKey={selectedName}
                fieldDefinitions={fieldDefinitions}
                value={currentProps}
                onChange={handlePropsChange}
              />
            </Box>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
}
