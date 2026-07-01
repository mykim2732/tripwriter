"use client";

import type { WatermarkProfile } from "@/types/editor";

type Props = {
  imageUrl: string;
  alt: string;
  watermark?: WatermarkProfile | null;
  enabled?: boolean;
  compact?: boolean;
  className?: string;
};

const positionClass: Record<WatermarkProfile["position"], string> = {
  "top-left": "left-2 top-2",
  "top-right": "right-2 top-2",
  center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-2 right-2",
};

const sizeClass: Record<WatermarkProfile["size"], string> = {
  small: "h-6 max-w-14",
  medium: "h-9 max-w-20",
  large: "h-12 max-w-28",
};

export function WatermarkOverlay({ imageUrl, alt, watermark, enabled = true, compact = false, className = "" }: Props) {
  const showWatermark = enabled && Boolean(watermark?.imageUrl);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      <img src={imageUrl} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      {showWatermark && watermark && (
        <img
          src={watermark.imageUrl}
          alt={watermark.name || "워터마크"}
          loading="lazy"
          decoding="async"
          className={`pointer-events-none absolute object-contain drop-shadow-sm ${positionClass[watermark.position]} ${compact ? "h-5 max-w-12" : sizeClass[watermark.size]}`}
          style={{ opacity: watermark.opacity / 100 }}
        />
      )}
    </div>
  );
}

export function loadStoredWatermark(): WatermarkProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("posty-watermark-profile");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WatermarkProfile;
    return parsed.imageUrl ? parsed : null;
  } catch {
    return null;
  }
}

export function buildWatermarkPublishNote(watermark?: WatermarkProfile | null) {
  if (!watermark?.imageUrl) return "";
  return `워터마크: ${watermark.name || "내 워터마크"} (${watermark.position}, ${watermark.opacity}%, ${watermark.size})`;
}
