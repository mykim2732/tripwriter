"use client";

import { ArrowDownRight, Badge, Circle, Sparkles, Sticker, StickyNote, Type } from "lucide-react";
import { useMemo, useState } from "react";
import type { ImageDecorator } from "@/types/editor";

const stickerLabels = ["BEST", "추천", "HOT", "NEW", "오늘특가", "무료배송", "한정", "꿀팁", "저장각", "감성컷"];
const commerceLabels = ["BEST", "무료배송", "오늘특가", "한정수량", "리뷰좋음", "HOT", "NEW", "추천"];
const handDrawnShapes: { shape: NonNullable<ImageDecorator["shape"]>; label: string }[] = [
  { shape: "arrow", label: "손화살" },
  { shape: "circle", label: "손동그라미" },
  { shape: "heart", label: "하트" },
  { shape: "star", label: "별" },
  { shape: "check", label: "체크" },
  { shape: "cloud", label: "구름" },
  { shape: "smile", label: "웃음" },
  { shape: "underline", label: "밑줄" },
];
const positions: { value: NonNullable<ImageDecorator["position"]>; label: string }[] = [
  { value: "top-left", label: "좌상" },
  { value: "top-right", label: "우상" },
  { value: "bottom-left", label: "좌하" },
  { value: "bottom-right", label: "우하" },
  { value: "center", label: "중앙" },
];
const colors = ["#2563eb", "#0ea5e9", "#111827", "#ef4444", "#f97316", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#facc15"];

type Props = {
  photoUrls: string[];
  photoCaptions: string[];
  imageDecorators?: ImageDecorator[];
  onChangeDecorators: (decorators: ImageDecorator[]) => void;
  onChangeCaptions: (captions: string[]) => void;
  mode?: "blog" | "detail";
};

export function ImageDecoratorEditor({ photoUrls, photoCaptions, imageDecorators = [], onChangeDecorators, onChangeCaptions, mode = "blog" }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedUrl = photoUrls[selectedIndex] || "";
  const normalizedDecorators = useMemo(() => normalizeDecorators(imageDecorators, photoUrls), [imageDecorators, photoUrls]);
  const selectedDecorators = normalizedDecorators.filter((decorator) => matchesImage(decorator, selectedIndex, selectedUrl));
  const labels = mode === "detail" ? commerceLabels : stickerLabels;

  function commit(nextDecorators: ImageDecorator[]) {
    onChangeDecorators(normalizeDecorators(nextDecorators, photoUrls));
  }

  function upsertDecorator(type: ImageDecorator["type"], defaults: Partial<ImageDecorator>) {
    const existing = selectedDecorators.find((decorator) => decorator.type === type && (type !== "sticker" || decorator.text === defaults.text));
    if (existing) {
      commit(normalizedDecorators.map((decorator) => sameDecorator(decorator, existing) ? { ...decorator, enabled: !(decorator.enabled ?? true) } : decorator));
      return;
    }

    commit([
      ...normalizedDecorators,
      {
        id: createId(),
        imageIndex: selectedIndex,
        imageUrl: selectedUrl,
        type,
        text: defaults.text,
        color: defaults.color || "#2563eb",
        position: defaults.position || "top-left",
        enabled: true,
      },
    ]);
  }

  function updateSelectedDecorator(target: ImageDecorator, patch: Partial<ImageDecorator>) {
    commit(normalizedDecorators.map((decorator) => sameDecorator(decorator, target) ? { ...decorator, ...patch } : decorator));
  }

  function updateCaption(value: string) {
    const next = [...photoCaptions];
    next[selectedIndex] = value;
    onChangeCaptions(next);
  }

  if (photoUrls.length === 0) {
    return <div className="rounded-3xl bg-slate-50 px-4 py-5 text-center text-sm font-bold text-slate-400">꾸밀 사진을 먼저 추가해주세요.</div>;
  }

  return (
    <section className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {photoUrls.map((url, index) => (
          <button key={`${url}-${index}`} type="button" onClick={() => setSelectedIndex(index)} className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl ring-2 ${selectedIndex === index ? "ring-blue-500" : "ring-transparent"}`}>
            <img src={url} alt={`사진 ${index + 1}`} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-slate-100 shadow-inner">
        <img src={selectedUrl} alt={`선택 사진 ${selectedIndex + 1}`} className="max-h-80 w-full object-contain" />
        <DecoratorOverlay decorators={selectedDecorators} />
      </div>

      <label className="block rounded-2xl bg-slate-50 p-3">
        <span className="text-xs font-black text-slate-500">사진 설명</span>
        <input value={photoCaptions[selectedIndex] || ""} onChange={(event) => updateCaption(event.target.value)} placeholder="사진 설명 추가" className="mt-2 h-10 w-full rounded-xl bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-400" />
      </label>

      <div className="grid grid-cols-5 gap-2">
        <QuickTool icon={<StickyNote size={19} />} label="테이프" active={selectedDecorators.some((item) => item.type === "maskingTape" && (item.enabled ?? true))} onClick={() => upsertDecorator("maskingTape", { color: "#fde68a", position: "top-left" })} />
        <QuickTool icon={<ArrowDownRight size={19} />} label="화살표" active={selectedDecorators.some((item) => item.type === "arrow" && (item.enabled ?? true))} onClick={() => upsertDecorator("arrow", { text: "↘", color: "#ef4444", position: "center" })} />
        <QuickTool icon={<Circle size={19} />} label="강조" active={selectedDecorators.some((item) => item.type === "circle" && (item.enabled ?? true))} onClick={() => upsertDecorator("circle", { color: "#ef4444", position: "center" })} />
        <QuickTool icon={<Sparkles size={19} />} label="반짝" active={selectedDecorators.some((item) => item.type === "sparkle" && (item.enabled ?? true))} onClick={() => upsertDecorator("sparkle", { text: "✨", color: "#f59e0b", position: "top-right" })} />
        <QuickTool icon={<Badge size={19} />} label="배지" active={selectedDecorators.some((item) => item.type === "badge" && (item.enabled ?? true))} onClick={() => upsertDecorator("badge", { text: mode === "detail" ? "BEST" : "추천", color: "#2563eb", position: "top-left" })} />
      </div>

      <div className="space-y-2">
        <p className="px-1 text-xs font-black text-slate-500">흰색 손그림</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {handDrawnShapes.map((item) => {
            const active = selectedDecorators.some((decorator) => decorator.type === "handDrawn" && decorator.shape === item.shape && (decorator.enabled ?? true));
            return <button key={item.shape} type="button" onClick={() => upsertDecorator("handDrawn", { shape: item.shape, color: "#ffffff", position: item.shape === "underline" ? "bottom-left" : "center" })} className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ${active ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-600"}`}>{item.label}</button>;
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => upsertDecorator("memo", { text: "여기 또 오고 싶다", color: "#fff7ed", position: "bottom-right" })} className="rounded-2xl bg-orange-50 px-3 py-3 text-left text-xs font-black text-orange-700">손글씨 메모</button>
        <button type="button" onClick={() => upsertDecorator("polaroid", { color: "#ffffff", position: "center" })} className="rounded-2xl bg-slate-50 px-3 py-3 text-left text-xs font-black text-slate-700">폴라로이드 프레임</button>
      </div>

      <div className="space-y-2">
        <p className="px-1 text-xs font-black text-slate-500">스티커</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {labels.map((label) => {
            const active = selectedDecorators.some((item) => item.type === "sticker" && item.text === label && (item.enabled ?? true));
            return <button key={label} type="button" onClick={() => upsertDecorator("sticker", { text: label, color: mode === "detail" ? "#ef4444" : "#2563eb", position: "top-left" })} className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ${active ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600"}`}>{label}</button>;
          })}
        </div>
      </div>

      {selectedDecorators.length > 0 && (
        <div className="space-y-2">
          <p className="px-1 text-xs font-black text-slate-500">선택 사진 꾸미기</p>
          {selectedDecorators.map((decorator) => (
            <div key={decorator.id || `${decorator.type}-${decorator.text}`} className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-slate-700">{decoratorLabel(decorator)}</span>
                <button type="button" onClick={() => updateSelectedDecorator(decorator, { enabled: !(decorator.enabled ?? true) })} className={`rounded-full px-3 py-1 text-xs font-black ${(decorator.enabled ?? true) ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"}`}>{(decorator.enabled ?? true) ? "ON" : "OFF"}</button>
              </div>
              {(decorator.type === "sticker" || decorator.type === "badge") && (
                <div className="mt-2 flex items-center gap-2">
                  <Type size={15} className="text-slate-400" />
                  <input value={decorator.text || ""} onChange={(event) => updateSelectedDecorator(decorator, { text: event.target.value })} className="h-9 flex-1 rounded-xl bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-400" placeholder="배지 문구" />
                </div>
              )}
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {positions.map((position) => <button key={position.value} type="button" onClick={() => updateSelectedDecorator(decorator, { position: position.value })} className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black ${decorator.position === position.value ? "bg-slate-900 text-white" : "bg-white text-slate-500"}`}>{position.label}</button>)}
              </div>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {colors.map((color) => <button key={color} type="button" onClick={() => updateSelectedDecorator(decorator, { color })} className={`h-8 w-8 shrink-0 rounded-full ring-2 ${decorator.color === color ? "ring-slate-950" : "ring-white"}`} style={{ backgroundColor: color }} aria-label="색상 선택" />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function DecoratorOverlay({ decorators }: { decorators: ImageDecorator[] }) {
  return <>{decorators.filter((decorator) => decorator.enabled ?? true).map((decorator, index) => <DecoratorView key={decorator.id || `${decorator.type}-${decorator.text}-${index}`} decorator={decorator} />)}</>;
}

export function normalizeDecorators(decorators: ImageDecorator[], photoUrls: string[]) {
  return decorators.map((decorator, index) => ({
    id: decorator.id || `decorator-${decorator.imageIndex ?? index}-${decorator.type}-${index}`,
    imageIndex: typeof decorator.imageIndex === "number" ? decorator.imageIndex : Math.max(0, photoUrls.indexOf(decorator.imageUrl || "")),
    imageUrl: decorator.imageUrl || photoUrls[typeof decorator.imageIndex === "number" ? decorator.imageIndex : Math.max(0, photoUrls.indexOf(decorator.imageUrl || ""))],
    type: decorator.type === "highlight" ? "circle" : decorator.type,
    shape: decorator.shape,
    text: decorator.text,
    position: decorator.position || "top-left",
    color: decorator.color || defaultColor(decorator.type),
    enabled: decorator.enabled ?? true,
  } satisfies ImageDecorator));
}

export function renderDecoratorHtml(decorators: ImageDecorator[]) {
  return decorators.filter((decorator) => decorator.enabled ?? true).map((decorator) => {
    const position = inlinePosition(decorator.position || "top-left");
    const color = escapeAttribute(decorator.color || defaultColor(decorator.type));
    if (decorator.type === "maskingTape") return `<span style="${position};z-index:3;width:96px;height:24px;background:rgba(254,240,138,0.76);border-radius:5px;box-shadow:0 3px 8px rgba(15,23,42,0.12);transform:rotate(-4deg);"></span>`;
    if (decorator.type === "handDrawn") return renderHandDrawnHtml(decorator);
    if (decorator.type === "memo") return `<span style="${position};z-index:5;max-width:140px;display:inline-block;padding:10px 12px;border-radius:14px;background:${color};color:#92400e;font-size:13px;font-weight:800;line-height:1.35;box-shadow:0 10px 22px rgba(15,23,42,0.14);transform:rotate(-2deg);font-family:'Nanum Pen Script','Comic Sans MS',cursive;">${escapeHtml(decorator.text || "여기 또 오고 싶다")}</span>`;
    if (decorator.type === "polaroid") return `<span style="position:absolute;left:-10px;right:-10px;top:-10px;bottom:-24px;z-index:1;border:12px solid #fff;border-bottom-width:34px;border-radius:3px;box-shadow:0 14px 28px rgba(15,23,42,0.16);pointer-events:none;"></span>`;
    if (decorator.type === "paper") return `<span style="position:absolute;left:8px;right:8px;top:8px;bottom:8px;z-index:1;border-radius:18px;background:rgba(255,255,255,0.16);box-shadow:inset 0 0 0 1px rgba(255,255,255,0.35);pointer-events:none;"></span>`;
    if (decorator.type === "arrow") return `<span style="${position};z-index:4;color:${color};font-size:34px;font-weight:900;text-shadow:0 2px 8px rgba(255,255,255,0.9);">${escapeHtml(decorator.text || "↘")}</span>`;
    if (decorator.type === "circle" || decorator.type === "highlight") return `<span style="${position};z-index:3;width:92px;height:64px;border:4px solid ${color};border-radius:999px;background:rgba(255,255,255,0.04);"></span>`;
    if (decorator.type === "sparkle") return `<span style="${position};z-index:4;font-size:30px;text-shadow:0 2px 8px rgba(255,255,255,0.9);">${escapeHtml(decorator.text || "✨")}</span>`;
    return `<span style="${position};z-index:4;display:inline-flex;align-items:center;border-radius:999px;background:${color};color:white;padding:7px 11px;font-size:12px;font-weight:900;box-shadow:0 8px 18px rgba(15,23,42,0.18);">${escapeHtml(decorator.text || "추천")}</span>`;
  }).join("");
}

function DecoratorView({ decorator }: { decorator: ImageDecorator }) {
  const style = decoratorStyle(decorator.position || "top-left");
  const color = decorator.color || defaultColor(decorator.type);
  if (decorator.type === "maskingTape") return <span className="absolute z-20 h-6 w-24 rotate-[-4deg] rounded bg-yellow-200/75 shadow-sm" style={style} />;
  if (decorator.type === "handDrawn") return <HandDrawnOverlay decorator={decorator} />;
  if (decorator.type === "memo") return <span className="absolute z-20 max-w-36 rotate-[-2deg] rounded-2xl bg-orange-50/95 px-3 py-2 text-sm font-black leading-snug text-orange-800 shadow-lg" style={{ ...style, fontFamily: "'Nanum Pen Script','Comic Sans MS',cursive" }}>{decorator.text || "여기 또 오고 싶다"}</span>;
  if (decorator.type === "polaroid") return <span className="pointer-events-none absolute -bottom-6 -left-3 -right-3 -top-3 z-10 rounded border-[12px] border-b-[34px] border-white shadow-xl" />;
  if (decorator.type === "paper") return <span className="pointer-events-none absolute inset-2 z-10 rounded-2xl bg-white/15 ring-1 ring-white/30" />;
  if (decorator.type === "arrow") return <span className="absolute z-20 text-4xl font-black drop-shadow" style={{ ...style, color }}>{decorator.text || "↘"}</span>;
  if (decorator.type === "circle" || decorator.type === "highlight") return <span className="absolute z-20 h-16 w-24 rounded-full border-4 bg-white/5" style={{ ...style, borderColor: color }} />;
  if (decorator.type === "sparkle") return <span className="absolute z-20 text-3xl drop-shadow" style={style}>{decorator.text || "✨"}</span>;
  return <span className="absolute z-20 rounded-full px-3 py-1.5 text-xs font-black text-white shadow-lg" style={{ ...style, backgroundColor: color }}>{decorator.text || "추천"}</span>;
}

function QuickTool({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex min-h-14 flex-col items-center justify-center rounded-2xl text-[11px] font-black ${active ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600"}`}>{icon}<span className="mt-1">{label}</span></button>;
}

function matchesImage(decorator: ImageDecorator, imageIndex: number, imageUrl: string) {
  return decorator.imageIndex === imageIndex || decorator.imageUrl === imageUrl;
}

function sameDecorator(a: ImageDecorator, b: ImageDecorator) {
  if (a.id && b.id) return a.id === b.id;
  return a.imageIndex === b.imageIndex && a.type === b.type && a.text === b.text;
}

function decoratorLabel(decorator: ImageDecorator) {
  if (decorator.type === "handDrawn") return `손그림 ${decorator.shape || ""}`;
  if (decorator.type === "memo") return "손글씨 메모";
  if (decorator.type === "polaroid") return "폴라로이드";
  if (decorator.type === "paper") return "반투명 종이";
  if (decorator.type === "maskingTape") return "마스킹테이프";
  if (decorator.type === "arrow") return "화살표";
  if (decorator.type === "circle" || decorator.type === "highlight") return "강조 원";
  if (decorator.type === "sparkle") return "반짝이";
  if (decorator.type === "badge") return "배지";
  return `스티커 ${decorator.text || ""}`;
}

function defaultColor(type: ImageDecorator["type"]) {
  if (type === "handDrawn") return "#ffffff";
  if (type === "memo") return "#fff7ed";
  if (type === "paper" || type === "polaroid") return "#ffffff";
  if (type === "arrow" || type === "circle" || type === "highlight") return "#ef4444";
  if (type === "maskingTape") return "#fde68a";
  if (type === "sparkle") return "#f59e0b";
  return "#2563eb";
}

function HandDrawnOverlay({ decorator }: { decorator: ImageDecorator }) {
  const style = decoratorStyle(decorator.position || "center");
  return (
    <span className="absolute z-30 block h-24 w-32 opacity-95 drop-shadow" style={style}>
      <HandDrawnSvg shape={decorator.shape || "circle"} />
    </span>
  );
}

function HandDrawnSvg({ shape }: { shape: NonNullable<ImageDecorator["shape"]> }) {
  const common = { fill: "none", stroke: "white", strokeWidth: 4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (shape === "arrow") return <svg viewBox="0 0 120 80" className="h-full w-full"><path {...common} d="M18 24 C44 20, 67 32, 93 53" /><path {...common} d="M88 36 L101 57 L76 56" /></svg>;
  if (shape === "heart") return <svg viewBox="0 0 120 80" className="h-full w-full"><path {...common} d="M60 64 C22 42, 24 14, 48 22 C55 24, 58 32, 60 35 C63 29, 70 19, 82 22 C106 29, 96 53, 60 64" /></svg>;
  if (shape === "star") return <svg viewBox="0 0 120 80" className="h-full w-full"><path {...common} d="M60 12 L70 36 L96 34 L75 50 L83 72 L60 58 L37 72 L45 50 L24 34 L50 36 Z" /></svg>;
  if (shape === "check") return <svg viewBox="0 0 120 80" className="h-full w-full"><path {...common} d="M24 42 L48 62 L95 18" /></svg>;
  if (shape === "cloud") return <svg viewBox="0 0 120 80" className="h-full w-full"><path {...common} d="M28 55 C12 52, 15 31, 34 34 C38 16, 66 16, 72 34 C93 26, 108 50, 86 58 C68 62, 45 59, 28 55" /></svg>;
  if (shape === "smile") return <svg viewBox="0 0 120 80" className="h-full w-full"><path {...common} d="M36 28 L37 29" /><path {...common} d="M82 28 L83 29" /><path {...common} d="M35 48 C48 66, 77 65, 91 48" /><path {...common} d="M20 40 C22 10, 98 8, 101 40 C103 72, 20 72, 20 40" /></svg>;
  if (shape === "underline" || shape === "memoLine") return <svg viewBox="0 0 120 80" className="h-full w-full"><path {...common} d="M16 54 C42 49, 74 60, 104 50" /></svg>;
  if (shape === "smallCircle" || shape === "circle" || shape === "outline") return <svg viewBox="0 0 120 80" className="h-full w-full"><path {...common} d="M24 42 C20 18, 55 10, 82 19 C108 28, 104 62, 70 68 C35 74, 16 58, 24 42" /></svg>;
  if (shape === "sun") return <svg viewBox="0 0 120 80" className="h-full w-full"><circle {...common} cx="60" cy="40" r="16" /><path {...common} d="M60 8 V20 M60 60 V72 M28 40 H40 M80 40 H92 M36 16 L44 25 M84 16 L76 25 M36 64 L44 55 M84 64 L76 55" /></svg>;
  if (shape === "flower") return <svg viewBox="0 0 120 80" className="h-full w-full"><circle {...common} cx="60" cy="40" r="6" /><path {...common} d="M60 22 C50 28, 50 36, 60 40 C70 35, 70 28, 60 22 M60 58 C50 52, 50 44, 60 40 C70 45, 70 52, 60 58 M42 40 C48 30, 56 30, 60 40 C55 50, 48 50, 42 40 M78 40 C72 30, 64 30, 60 40 C65 50, 72 50, 78 40" /></svg>;
  if (shape === "house") return <svg viewBox="0 0 120 80" className="h-full w-full"><path {...common} d="M28 44 L60 18 L92 44" /><path {...common} d="M36 42 V68 H84 V42" /><path {...common} d="M54 68 V50 H68 V68" /></svg>;
  if (shape === "rainbow") return <svg viewBox="0 0 120 80" className="h-full w-full"><path {...common} d="M20 62 C24 22, 96 22, 100 62" /><path {...common} d="M34 62 C38 40, 82 40, 86 62" /></svg>;
  return <svg viewBox="0 0 120 80" className="h-full w-full"><path {...common} d="M60 12 L70 36 L96 34 L75 50 L83 72 L60 58 L37 72 L45 50 L24 34 L50 36 Z" /></svg>;
}

function renderHandDrawnHtml(decorator: ImageDecorator) {
  const position = inlinePosition(decorator.position || "center");
  const svg = encodeURIComponent(handDrawnSvgString(decorator.shape || "circle"));
  return `<span style="${position};z-index:5;width:128px;height:96px;background-image:url('data:image/svg+xml,${svg}');background-repeat:no-repeat;background-size:contain;filter:drop-shadow(0 2px 5px rgba(0,0,0,0.18));opacity:.96;"></span>`;
}

function handDrawnSvgString(shape: NonNullable<ImageDecorator["shape"]>) {
  const path = {
    arrow: `<path d="M18 24 C44 20,67 32,93 53"/><path d="M88 36 L101 57 L76 56"/>`,
    heart: `<path d="M60 64 C22 42,24 14,48 22 C55 24,58 32,60 35 C63 29,70 19,82 22 C106 29,96 53,60 64"/>`,
    star: `<path d="M60 12 L70 36 L96 34 L75 50 L83 72 L60 58 L37 72 L45 50 L24 34 L50 36 Z"/>`,
    check: `<path d="M24 42 L48 62 L95 18"/>`,
    cloud: `<path d="M28 55 C12 52,15 31,34 34 C38 16,66 16,72 34 C93 26,108 50,86 58 C68 62,45 59,28 55"/>`,
    smile: `<path d="M36 28 L37 29"/><path d="M82 28 L83 29"/><path d="M35 48 C48 66,77 65,91 48"/><path d="M20 40 C22 10,98 8,101 40 C103 72,20 72,20 40"/>`,
    underline: `<path d="M16 54 C42 49,74 60,104 50"/>`,
    memoLine: `<path d="M16 54 C42 49,74 60,104 50"/>`,
    circle: `<path d="M24 42 C20 18,55 10,82 19 C108 28,104 62,70 68 C35 74,16 58,24 42"/>`,
    outline: `<path d="M24 42 C20 18,55 10,82 19 C108 28,104 62,70 68 C35 74,16 58,24 42"/>`,
    smallCircle: `<path d="M24 42 C20 18,55 10,82 19 C108 28,104 62,70 68 C35 74,16 58,24 42"/>`,
    sun: `<circle cx="60" cy="40" r="16"/><path d="M60 8 V20 M60 60 V72 M28 40 H40 M80 40 H92 M36 16 L44 25 M84 16 L76 25 M36 64 L44 55 M84 64 L76 55"/>`,
    flower: `<circle cx="60" cy="40" r="6"/><path d="M60 22 C50 28,50 36,60 40 C70 35,70 28,60 22 M60 58 C50 52,50 44,60 40 C70 45,70 52,60 58 M42 40 C48 30,56 30,60 40 C55 50,48 50,42 40 M78 40 C72 30,64 30,60 40 C65 50,72 50,78 40"/>`,
    house: `<path d="M28 44 L60 18 L92 44"/><path d="M36 42 V68 H84 V42"/><path d="M54 68 V50 H68 V68"/>`,
    rainbow: `<path d="M20 62 C24 22,96 22,100 62"/><path d="M34 62 C38 40,82 40,86 62"/>`,
    dotted: `<path stroke-dasharray="3 8" d="M20 40 C40 20,80 20,100 42"/>`,
    sparkle: `<path d="M60 14 L66 34 L88 40 L66 46 L60 68 L54 46 L32 40 L54 34 Z"/>`,
  }[shape] || `<path d="M24 42 C20 18,55 10,82 19 C108 28,104 62,70 68 C35 74,16 58,24 42"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><g fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${path}</g></svg>`;
}

function decoratorStyle(position: NonNullable<ImageDecorator["position"]>): React.CSSProperties {
  if (position === "top-right") return { right: 12, top: 12 };
  if (position === "bottom-left") return { left: 12, bottom: 12 };
  if (position === "bottom-right") return { right: 12, bottom: 12 };
  if (position === "center") return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
  return { left: 12, top: 12 };
}

function inlinePosition(position: NonNullable<ImageDecorator["position"]>) {
  if (position === "top-right") return "position:absolute;right:12px;top:12px";
  if (position === "bottom-left") return "position:absolute;left:12px;bottom:12px";
  if (position === "bottom-right") return "position:absolute;right:12px;bottom:12px";
  if (position === "center") return "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)";
  return "position:absolute;left:12px;top:12px";
}

function createId() {
  return `decorator-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}


