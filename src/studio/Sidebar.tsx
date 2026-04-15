import { Box, Card, Flex, Stack, Text } from "@sanity/ui";
import type { BlockEntry } from "../types";

interface SidebarProps {
  blocks: BlockEntry[];
  selected: string | null;
  onSelect: (name: string) => void;
}

export function Sidebar({ blocks, selected, onSelect }: SidebarProps) {
  const preferredOrder = ["Hero", "Generic", "Concerts", "Artists"];
  const discoveredCategories = Array.from(
    new Set(blocks.map((block) => block.category ?? "Generic")),
  );
  const categoryOrder = [
    ...preferredOrder.filter((category) => discoveredCategories.includes(category)),
    ...discoveredCategories.filter((category) => !preferredOrder.includes(category)),
  ];

  const grouped = categoryOrder.map((category) => ({
    category,
    items: blocks.filter((block) => (block.category ?? "Generic") === category),
  }));

  return (
    <Box padding={2}>
      <Stack space={3}>
        {grouped.map((group) => (
          <Stack key={group.category} space={1}>
            <Text
              size={0}
              muted
              weight="semibold"
              style={{ letterSpacing: "0.08em", textTransform: "uppercase", padding: "16px 8px" }}
            >
              {group.category}
            </Text>
            {group.items.map((block) => {
              const isSelected = selected === block.name;
              return (
                <Card
                  key={block.name}
                  paddingX={3}
                  paddingY={3}
                  radius={2}
                  onClick={() => onSelect(block.name)}
                  style={{
                    width: "100%",
                    cursor: "pointer",
                    borderRadius: 6,
                    background: isSelected ? "#7C9BFF" : "transparent",
                    color: isSelected ? "#0D1326" : "var(--card-fg-color)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Flex align="center" style={{ width: "100%", textAlign: "left" }}>
                    <Text
                      size={1}
                      weight={isSelected ? "semibold" : "medium"}
                      style={{
                        color: "inherit",
                        lineHeight: "normal",
                      }}
                    >
                      {block.label}
                    </Text>
                  </Flex>
                </Card>
              );
            })}
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
