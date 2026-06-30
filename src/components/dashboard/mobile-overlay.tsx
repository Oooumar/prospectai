"use client";

import { useSidebar } from "./sidebar-context";

export function MobileOverlay() {
  const { open, close } = useSidebar();
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 z-30 md:hidden"
      onClick={close}
    />
  );
}
