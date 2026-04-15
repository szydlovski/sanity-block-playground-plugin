import { BlockContentIcon, EarthGlobeIcon, ImageIcon, MenuIcon } from "@sanity/icons";
import { Button, Flex } from "@sanity/ui";

const PRESETS = [
  { label: "Mobile", width: "375px", icon: MenuIcon },
  { label: "Tablet", width: "768px", icon: BlockContentIcon },
  { label: "Desktop", width: "1280px", icon: ImageIcon },
  { label: "Fluid", width: "100%", icon: EarthGlobeIcon },
] as const;

interface ViewportSwitcherProps {
  value: string;
  onChange: (width: string) => void;
}

export function ViewportSwitcher({ value, onChange }: ViewportSwitcherProps) {
  return (
    <Flex gap={1}>
      {PRESETS.map((p) => (
        <Button
          key={p.label}
          text={p.label}
          icon={p.icon}
          mode={value === p.width ? "default" : "ghost"}
          fontSize={1}
          padding={2}
          onClick={() => onChange(p.width)}
        />
      ))}
    </Flex>
  );
}
