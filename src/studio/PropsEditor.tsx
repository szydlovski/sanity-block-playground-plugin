import { useMemo, useState } from "react";
import { Stack, Text, TextArea } from "@sanity/ui";

interface PropsEditorProps {
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}

export function PropsEditor({ value, onChange }: PropsEditorProps) {
  const serialized = useMemo(
    () => JSON.stringify(value, null, 2),
    [value],
  );

  const [state, setState] = useState(() => ({
    raw: serialized,
    prevSerialized: serialized,
    error: null as string | null,
  }));

  if (serialized !== state.prevSerialized) {
    setState((s) => ({
      ...s,
      raw: serialized,
      prevSerialized: serialized,
      error: null,
    }));
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      onChange(parsed);
      setState((s) => ({ ...s, raw: text, error: null }));
    } catch {
      setState((s) => ({
        ...s,
        raw: text,
        error: "Invalid JSON",
      }));
    }
  }

  return (
    <Stack space={2}>
      <TextArea
        value={state.raw}
        onChange={handleChange}
        rows={22}
        fontSize={1}
        style={{
          width: "100%",
          fontFamily: "monospace",
          fontSize: 12,
          borderColor: state.error ? "red" : undefined,
        }}
      />
      {state.error ? (
        <Text size={1} style={{ color: "red" }}>
          {state.error}
        </Text>
      ) : null}
    </Stack>
  );
}
