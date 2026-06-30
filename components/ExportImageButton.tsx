"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

type ExportOverlay = {
  badgeText?: string;
  headline?: string;
  subText?: string;
  memoText?: string;
  accentColor?: string;
  overlayColor?: string;
  watermarkUrl?: string;
  style?: "minimal" | "diary" | "review" | "detail";
};

type Props = {
  imageUrl: string;
  fileName?: string;
  overlay?: ExportOverlay;
  label?: string;
  className?: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

export function ExportImageButton({
  imageUrl,
  fileName = "posty-ai-image.png",
  overlay,
  label = "다운로드",
  className = "",
  onSuccess,
  onError,
}: Props) {
  const [exporting, setExporting] = useState(false);

  async function exportImage() {
    if (!imageUrl) {
      onError?.("다운로드할 이미지가 없어요.");
      return;
    }

    setExporting(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 900;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("브라우저에서 이미지 캔버스를 만들지 못했어요.");

      const source = await loadImage(imageUrl);
      drawCoverImage(context, source, canvas.width, canvas.height);
      drawGradient(context, canvas.width, canvas.height, overlay?.style);
      drawDecorations(context, canvas.width, canvas.height, overlay);

      if (overlay?.watermarkUrl) {
        try {
          const watermark = await loadImage(overlay.watermarkUrl);
          context.globalAlpha = 0.72;
          context.drawImage(watermark, canvas.width - 260, 48, 190, 70);
          context.globalAlpha = 1;
        } catch {
          // Watermark export should not block the main thumbnail download.
        }
      }

      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      onSuccess?.();
    } catch (error) {
      onError?.(
        error instanceof Error
          ? `${error.message} 이미지 서버의 CORS 정책 때문에 합성 다운로드가 제한될 수 있어요.`
          : "이미지 합성 다운로드에 실패했어요.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <button type="button" onClick={exportImage} disabled={exporting} className={className}>
      {exporting ? <Loader2 className="animate-spin" size={14} aria-hidden="true" /> : <Download size={14} aria-hidden="true" />}
      {exporting ? "생성 중" : label}
    </button>
  );
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("이미지를 불러오지 못했어요."));
    image.src = src;
  });
}

function drawCoverImage(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawGradient(context: CanvasRenderingContext2D, width: number, height: number, style?: ExportOverlay["style"]) {
  const gradient = context.createLinearGradient(0, height, 0, 0);
  const start = style === "detail" ? "rgba(30,64,175,.82)" : style === "diary" ? "rgba(136,19,55,.72)" : "rgba(0,0,0,.72)";
  gradient.addColorStop(0, start);
  gradient.addColorStop(0.58, "rgba(0,0,0,.14)");
  gradient.addColorStop(1, "rgba(255,255,255,.06)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function drawDecorations(context: CanvasRenderingContext2D, width: number, height: number, overlay?: ExportOverlay) {
  const accent = overlay?.accentColor || "#2563eb";
  const overlayColor = overlay?.overlayColor || "#ffffff";

  roundedRect(context, 64, 56, 190, 48, 24, accent);
  context.fillStyle = overlayColor;
  context.font = "900 24px Arial";
  context.fillText(overlay?.badgeText || "POSTY", 88, 88);

  roundedRect(context, 70, height - 260, 360, 62, 22, overlay?.style === "review" ? "#fef3c7" : "#ffffff");
  context.save();
  context.translate(78, height - 220);
  context.rotate((-2 * Math.PI) / 180);
  context.fillStyle = "#0f172a";
  context.font = "900 24px Arial";
  context.fillText(overlay?.memoText || "이 장면이 포인트", 0, 0);
  context.restore();

  context.fillStyle = "#ffffff";
  context.font = "900 62px Arial";
  wrapText(context, overlay?.headline || "Posty AI", 70, height - 120, width - 140, 70);
  context.font = "700 30px Arial";
  context.fillStyle = "rgba(255,255,255,.86)";
  wrapText(context, overlay?.subText || "사진 중심 콘텐츠 썸네일", 72, height - 48, width - 144, 38);

  context.strokeStyle = "rgba(255,255,255,.92)";
  context.lineWidth = 8;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(90, 180);
  context.bezierCurveTo(170, 120, 310, 128, 410, 170);
  context.stroke();
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, color: string) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = color;
  context.fill();
}

function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/);
  let line = "";
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) context.fillText(line, x, y);
}
