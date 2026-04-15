import type { BlockStory } from "./types";

type StoryInput<P> = {
  id: string;
  label: string;
  props: P;
};

/**
 * Type-safe story presets for the block playground: props are checked against `P`
 * (typically `Omit<ComponentProps<typeof Section>, layout-only keys>`).
 */
export function defineSectionStories<P>(
  stories: readonly StoryInput<P>[],
): BlockStory[] {
  return stories.map((s) => ({
    id: s.id,
    label: s.label,
    props: s.props as Record<string, unknown>,
  }));
}
