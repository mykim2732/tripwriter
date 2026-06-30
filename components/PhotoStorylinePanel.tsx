"use client";

import { BookOpenText } from "lucide-react";
import type { EditorPhoto, PhotoStorylineItem } from "@/types/editor";

type Props = {
  photos: EditorPhoto[];
  captions: string[];
  storyline?: PhotoStorylineItem[];
  onChange: (next: PhotoStorylineItem[]) => void;
};

export function PhotoStorylinePanel({ photos, captions, storyline = [], onChange }: Props) {
  const items = normalizeStoryline(photos, captions, storyline);

  function update(index: number, patch: Partial<PhotoStorylineItem>) {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  if (photos.length === 0) return null;

  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <BookOpenText size={20} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-950">사진 스토리라인</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">사진별 소제목, 문단 포인트, 캡션을 정리하면 사진 기반 다시 쓰기에 반영돼요.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <article key={`${item.photoUrl}-${index}`} className="rounded-2xl bg-slate-50 p-3">
            <div className="flex gap-3">
              <img src={item.photoUrl} alt={`스토리라인 사진 ${index + 1}`} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-blue-700">사진 {index + 1}</p>
                <input
                  value={item.heading}
                  onChange={(event) => update(index, { heading: event.target.value })}
                  placeholder="소제목"
                  className="mt-1 h-9 w-full rounded-xl bg-white px-3 text-xs font-black text-slate-800 outline-none focus:ring-1 focus:ring-blue-300"
                />
              </div>
            </div>
            <textarea
              value={item.paragraphPoint}
              onChange={(event) => update(index, { paragraphPoint: event.target.value })}
              placeholder="이 사진으로 말하고 싶은 문단 포인트"
              className="mt-2 min-h-16 w-full rounded-xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-700 outline-none focus:ring-1 focus:ring-blue-300"
            />
            <input
              value={item.caption}
              onChange={(event) => update(index, { caption: event.target.value })}
              placeholder="캡션"
              className="mt-2 h-9 w-full rounded-xl bg-white px-3 text-xs font-bold text-slate-600 outline-none focus:ring-1 focus:ring-blue-300"
            />
          </article>
        ))}
      </div>
    </section>
  );
}

export function normalizeStoryline(photos: EditorPhoto[], captions: string[], storyline: PhotoStorylineItem[] = []) {
  return photos.map((photo, index) => {
    const current = storyline.find((item) => item.photoUrl === photo.url) || storyline[index];
    return {
      photoUrl: photo.url,
      heading: current?.heading || (index === 0 ? "첫인상" : index === photos.length - 1 ? "마무리 장면" : `디테일 ${index}`),
      paragraphPoint: current?.paragraphPoint || "",
      caption: current?.caption || captions[index] || "사진 설명 추가",
    };
  });
}
