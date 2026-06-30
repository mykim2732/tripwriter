"use client";

import { Camera, Crop, Image as ImageIcon, Palette, Star, Wand2 } from "lucide-react";
import type { ReactNode } from "react";
import type { EditorPhoto, WatermarkProfile } from "@/types/editor";

type Props = {
  photo: EditorPhoto;
  index: number;
  caption: string;
  isCover: boolean;
  watermark?: WatermarkProfile | null;
  onChangeCaption: (caption: string) => void;
  onReplacePhoto: (file: File) => void;
  onSetCover: () => void;
  onToggleWatermarkScope: (scope: WatermarkProfile["scope"]) => void;
  onOpenDecorators: () => void;
};

export function PhotoEditPanel({
  photo,
  index,
  caption,
  isCover,
  watermark,
  onChangeCaption,
  onReplacePhoto,
  onSetCover,
  onToggleWatermarkScope,
  onOpenDecorators,
}: Props) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-blue-100">
      <div className="flex items-start gap-3">
        <img src={photo.url} alt={photo.name || `사진 ${index + 1}`} className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-950">사진 수정</p>
          <p className="mt-1 truncate text-xs font-bold text-slate-400">{photo.name || `사진 ${index + 1}`}</p>
          {isCover && <span className="mt-2 inline-flex rounded-full bg-slate-950 px-2.5 py-1 text-[11px] font-black text-white">대표사진</span>}
        </div>
      </div>

      <label className="mt-3 block">
        <span className="text-xs font-black text-slate-400">사진 설명</span>
        <input value={caption} onChange={(event) => onChangeCaption(event.target.value)} className="mt-2 h-11 w-full rounded-2xl bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100" />
      </label>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-50 px-3 text-xs font-black text-blue-700">
          <Camera size={15} /> 사진 교체
          <input type="file" accept="image/*" className="hidden" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onReplacePhoto(file);
            event.target.value = "";
          }} />
        </label>
        <button type="button" onClick={onSetCover} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-3 text-xs font-black text-white">
          <Star size={15} /> 대표사진
        </button>
        <button type="button" onClick={onOpenDecorators} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-slate-50 px-3 text-xs font-black text-slate-700">
          <Palette size={15} /> AI 꾸미기
        </button>
        <button type="button" onClick={() => onToggleWatermarkScope(watermark?.scope === "all" ? "cover" : "all")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-slate-50 px-3 text-xs font-black text-slate-700">
          <ImageIcon size={15} /> 워터마크 {watermark?.scope === "all" ? "대표만" : "전체"}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MockTool label="밝게 보기" />
        <MockTool label="감성 색감" />
        <MockTool label="선명하게" />
        <MockTool label="자르기 준비중" icon={<Crop size={14} />} />
      </div>
    </section>
  );
}

function MockTool({ label, icon = <Wand2 size={14} /> }: { label: string; icon?: ReactNode }) {
  return (
    <button type="button" className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-2xl bg-white px-3 text-[11px] font-black text-slate-400 ring-1 ring-slate-100">
      {icon}
      {label}
    </button>
  );
}
