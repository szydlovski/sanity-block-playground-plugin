"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { ResolvedBlockPlaygroundOptions } from "../types";

const BlockPlaygroundContext = createContext<ResolvedBlockPlaygroundOptions | null>(
  null,
);

export function BlockPlaygroundProvider({
  options,
  children,
}: {
  options: ResolvedBlockPlaygroundOptions;
  children: ReactNode;
}) {
  return (
    <BlockPlaygroundContext.Provider value={options}>
      {children}
    </BlockPlaygroundContext.Provider>
  );
}

export function useBlockPlaygroundOptions(): ResolvedBlockPlaygroundOptions {
  const context = useContext(BlockPlaygroundContext);
  if (!context) {
    throw new Error("useBlockPlaygroundOptions must be used within BlockPlaygroundProvider");
  }
  return context;
}
