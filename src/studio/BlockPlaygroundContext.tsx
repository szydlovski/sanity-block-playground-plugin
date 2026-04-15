"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { BlockPlaygroundOptions } from "../types";

const BlockPlaygroundContext = createContext<BlockPlaygroundOptions | null>(null);

export function BlockPlaygroundProvider({
  options,
  children,
}: {
  options: BlockPlaygroundOptions;
  children: ReactNode;
}) {
  return (
    <BlockPlaygroundContext.Provider value={options}>
      {children}
    </BlockPlaygroundContext.Provider>
  );
}

export function useBlockPlaygroundOptions(): BlockPlaygroundOptions {
  const context = useContext(BlockPlaygroundContext);
  if (!context) {
    throw new Error("useBlockPlaygroundOptions must be used within BlockPlaygroundProvider");
  }
  return context;
}
