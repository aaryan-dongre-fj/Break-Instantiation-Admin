"use client";

import { createContext, useContext } from "react";

import type { Look } from "@/lib/look";

const LookContext = createContext<Look | null>(null);

export function LookProvider({
  look,
  children,
}: {
  look: Look;
  children: React.ReactNode;
}) {
  return <LookContext.Provider value={look}>{children}</LookContext.Provider>;
}

export function useLook() {
  const look = useContext(LookContext);
  if (!look) {
    throw new Error("LookProvider is missing.");
  }
  return look;
}
