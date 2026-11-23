"use client";

import { useState } from "react";

const buttonClass =
  "rounded-lg border border-white/25 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white/10";

export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const currentUrl = () => window.location.href.split("#")[0];

  async function copy() {
    try {
      await navigator.clipboard.writeText(currentUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: nothing else to do.
    }
  }

  function shareOnWhatsApp() {
    const message = encodeURIComponent(`${title} ${currentUrl()}`);
    window.open(`https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={copy} className={buttonClass}>
        {copied ? "Link copied" : "Copy link"}
      </button>
      <button type="button" onClick={shareOnWhatsApp} className={buttonClass}>
        Share on WhatsApp
      </button>
    </div>
  );
}