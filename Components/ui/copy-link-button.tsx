"use client";

import { useState } from "react";
import { buttonClass } from "@/Components/ui/styles";

export function CopyLinkButton({ path, label = "Copy link" }: { path: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button type="button" onClick={copy} className={buttonClass("outline", "sm")}>
      {state === "copied" ? "Link copied" : state === "failed" ? "Copy failed" : label}
    </button>
  );
}