"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BadgePercent,
  Camera,
  ChevronDown,
  Image as ImageIcon,
  Layers3,
  Loader2,
  MoreHorizontal,
  Palette,
  Plus,
  Save,
  Sparkles,
  Sticker,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { BlogEditorState, DetailSection, ImageDecorator } from "@/types/editor";

const sectionTypes: { type: DetailSection["type"]; label: string }[] = [
  { type: "hero", label: "히어로" },
  { type: "benefit", label: "장점 카드" },
  { type: "imageText", label: "이미지+설명" },
  { type: "checklist", label: "체크리스트" },
  { type: "spec", label: "스펙/구성" },
  { type: "faq", label: "FAQ" },
  { type: "cta", label: "구매 유도" },
  { type: "notice", label: "주의사항" },
];

const stickerLabels = ["BEST", "NEW", "HOT", "추천", "오늘특가", "무료배송", "한정수량", "리뷰좋음"];
const stickerPositions: { value: ImageDecorator["position"]; label: string }[] = [
  { value: "top-left", label: "좌상단" },
  { value: "top-right", label: "우상단" },
  { value: "bottom-left", label: "좌하단" },
  { value: "bottom-right", label: "우하단" },
];

const accentColors = ["#2563eb", "#0ea5e9", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#ec4899", "#111827"];

type Props = {
  state: BlogEditorState;
  onChange: (next: BlogEditorState) => void;
  onSave?: () => void | Promise<void>;
  onPolish?: () => void | Promise<void>;
  onPublishReview?: () => void | Promise<void>;
  saving?: boolean;
  polishing?: boolean;
};

type Panel = "none" | "image" | "section" | "sticker" | "color" | "more";

export function DetailEditor({ state, onChange, onSave, onPolish, onPublishReview, saving = false, polishing = false }: Props) {
  const [activePanel, setActivePanel] = useState<Panel>("none");
  const photos = state.localPhotoPreviews?.length ? state.localPhotoPreviews : state.photoUrls;
  const sections = useMemo(() => ensureSections(state), [state]);
  const html = useMemo(() => buildDetailHtml({ ...state, detailPage: { productName: state.detailPage?.productName || state.selectedTitle, keyBenefits: state.detailPage?.keyBenefits || [], ...state.detailPage, sections } }), [state, sections]);

  function patch(nextState: Partial<BlogEditorState>) {
    const merged = { ...state, ...nextState };
    const next = { ...merged, html: buildDetailHtml(merged) };
    onChange(next);
  }

  function patchDetail(detailPatch: Partial<NonNullable<BlogEditorState["detailPage"]>>) {
    patch({ detailPage: { productName: state.detailPage?.productName || state.selectedTitle, keyBenefits: state.detailPage?.keyBenefits || [], ...state.detailPage, ...detailPatch } });
  }

  function updateSection(index: number, patchSection: Partial<DetailSection>) {
    const nextSections = [...sections];
    nextSections[index] = { ...nextSections[index], ...patchSection };
    patchDetail({ sections: nextSections });
  }

  function addSection(type: DetailSection["type"]) {
    const nextSections = [...sections, createSection(type, photos[0])];
    patchDetail({ sections: nextSections });
  }

  function removeSection(index: number) {
    const nextSections = sections.filter((_, sectionIndex) => sectionIndex !== index);
    patchDetail({ sections: nextSections });
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const nextSections = [...sections];
    [nextSections[index], nextSections[target]] = [nextSections[target], nextSections[index]];
    patchDetail({ sections: nextSections });
  }

  function updateSectionItem(sectionIndex: number, itemIndex: number, value: string) {
    const items = [...(sections[sectionIndex].items || [])];
    items[itemIndex] = value;
    updateSection(sectionIndex, { items });
  }

  function addSectionItem(sectionIndex: number) {
    const items = [...(sections[sectionIndex].items || []), "새 항목"];
    updateSection(sectionIndex, { items });
  }

  function toggleSticker(imageIndex: number, label: string) {
    const current = state.photoDecorators || [];
    const exists = current.some((decorator) => decorator.imageIndex === imageIndex && decorator.text === label && decorator.type === "sticker");
    const nextDecorators = exists
      ? current.filter((decorator) => !(decorator.imageIndex === imageIndex && decorator.text === label && decorator.type === "sticker"))
      : [...current, { imageIndex, type: "sticker" as const, text: label, color: "#2563eb", position: "top-left" as const }];
    patch({ photoDecorators: nextDecorators, editorOptions: { ...state.editorOptions, imageDecorators: nextDecorators } });
  }

  function updateStickerPosition(imageIndex: number, position: ImageDecorator["position"]) {
    const nextDecorators = (state.photoDecorators || []).map((decorator) => decorator.imageIndex === imageIndex ? { ...decorator, position } : decorator);
    patch({ photoDecorators: nextDecorators, editorOptions: { ...state.editorOptions, imageDecorators: nextDecorators } });
  }

  function setAccentColor(color: string) {
    patch({ editorOptions: { ...state.editorOptions, detailAccentColor: color } });
  }

  function saveNow() {
    patch({ html });
    void onSave?.();
  }

  return (
    <section className="min-h-[calc(100vh-24px)] bg-white shadow-sm ring-1 ring-slate-100 sm:rounded-[28px]">
      <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between border-b border-slate-100 bg-white/95 px-4 backdrop-blur">
        <button type="button" onClick={() => window.history.back()} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500" aria-label="뒤로가기"><ArrowLeft size={21} /></button>
        <div className="text-center"><p className="text-sm font-black text-slate-950">상세페이지 편집</p><p className="text-[11px] font-bold text-blue-600">AI 콘텐츠 스튜디오</p></div>
        <button type="button" onClick={saveNow} disabled={saving} className="text-sm font-black text-blue-600 disabled:text-slate-300">{saving ? "저장중" : "저장"}</button>
      </header>

      <div className="px-5 pb-32 pt-5">
        <label className="block">
          <span className="text-xs font-black text-slate-400">대표 상품명 / 헤드라인</span>
          <input value={state.selectedTitle} onChange={(event) => patch({ selectedTitle: event.target.value, detailPage: { ...state.detailPage, productName: event.target.value, keyBenefits: state.detailPage?.keyBenefits || [] } })} placeholder="상품명을 입력하세요" className="mt-2 w-full border-b border-slate-100 bg-white pb-3 text-3xl font-black text-slate-950 outline-none placeholder:text-slate-300" />
        </label>

        {photos.length > 0 && (
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            {photos.map((url, index) => <ImageThumb key={`${url}-${index}`} url={url} index={index} decorators={state.photoDecorators || []} />)}
          </div>
        )}

        <div className="mt-5 space-y-3">
          {sections.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              index={index}
              photos={photos}
              onUpdate={(patchSection) => updateSection(index, patchSection)}
              onItemChange={(itemIndex, value) => updateSectionItem(index, itemIndex, value)}
              onAddItem={() => addSectionItem(index)}
              onRemove={() => removeSection(index)}
              onMoveUp={() => moveSection(index, -1)}
              onMoveDown={() => moveSection(index, 1)}
            />
          ))}
        </div>

        <details className="mt-5 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-black text-slate-950">모바일 상세페이지 미리보기 <ChevronDown size={18} /></summary>
          <div className="mt-4 overflow-hidden rounded-3xl bg-white p-3 shadow-inner" dangerouslySetInnerHTML={{ __html: html }} />
        </details>
      </div>

      <footer className="sticky bottom-0 z-30 border-t border-slate-100 bg-white/95 backdrop-blur">
        {activePanel !== "none" && (
          <div className="border-b border-slate-100 px-3 py-3">
            {activePanel === "section" && <SectionPanel onAdd={addSection} />}
            {activePanel === "sticker" && <StickerPanel photos={photos} decorators={state.photoDecorators || []} onToggle={toggleSticker} onPosition={updateStickerPosition} />}
            {activePanel === "color" && <ColorPanel current={String(state.editorOptions.detailAccentColor || "#2563eb")} onSelect={setAccentColor} />}
            {activePanel === "image" && <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">이미지는 작성 화면에서 업로드한 상품 사진을 사용해요. 다음 Sprint에서 이미지 교체와 정렬을 더 세밀하게 연결할 예정이에요.</p>}
            {activePanel === "more" && <MorePanel onPolish={onPolish} polishing={polishing} onPublishReview={onPublishReview} />}
          </div>
        )}
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] items-center gap-1 px-3 py-2">
          <ToolButton icon={<ImageIcon size={23} />} label="이미지" active={activePanel === "image"} onClick={() => setActivePanel(activePanel === "image" ? "none" : "image")} />
          <ToolButton icon={<Layers3 size={23} />} label="섹션" active={activePanel === "section"} onClick={() => setActivePanel(activePanel === "section" ? "none" : "section")} />
          <ToolButton icon={<Sticker size={23} />} label="스티커" active={activePanel === "sticker"} onClick={() => setActivePanel(activePanel === "sticker" ? "none" : "sticker")} />
          <ToolButton icon={<Palette size={23} />} label="색상" active={activePanel === "color"} onClick={() => setActivePanel(activePanel === "color" ? "none" : "color")} />
          <ToolButton icon={<MoreHorizontal size={25} />} label="더보기" active={activePanel === "more"} onClick={() => setActivePanel(activePanel === "more" ? "none" : "more")} />
          <button type="button" onClick={saveNow} disabled={saving} className="flex h-11 min-w-12 items-center justify-center rounded-xl text-blue-600 disabled:text-slate-300" aria-label="저장">{saving ? <Loader2 className="animate-spin" size={22} /> : <Save size={22} />}</button>
        </div>
      </footer>
    </section>
  );
}

function SectionCard({ section, index, photos, onUpdate, onItemChange, onAddItem, onRemove, onMoveUp, onMoveDown }: { section: DetailSection; index: number; photos: string[]; onUpdate: (patch: Partial<DetailSection>) => void; onItemChange: (index: number, value: string) => void; onAddItem: () => void; onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void }) {
  return (
    <article className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="mb-3 flex items-center justify-between gap-2"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{sectionLabel(section.type)}</span><div className="flex gap-1"><IconButton onClick={onMoveUp} icon={<ArrowUp size={15} />} /><IconButton onClick={onMoveDown} icon={<ArrowDown size={15} />} /><IconButton onClick={onRemove} icon={<Trash2 size={15} />} danger /></div></div>
      <input value={section.title} onChange={(event) => onUpdate({ title: event.target.value })} className="w-full rounded-2xl bg-slate-50 px-3 py-3 text-sm font-black text-slate-950 outline-none focus:ring-1 focus:ring-blue-400" placeholder="섹션 제목" />
      <textarea value={section.body} onChange={(event) => onUpdate({ body: event.target.value })} className="mt-2 min-h-24 w-full rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-700 outline-none focus:ring-1 focus:ring-blue-400" placeholder="섹션 본문" />
      {(section.type === "benefit" || section.type === "checklist" || section.type === "faq") && <div className="mt-2 space-y-2">{(section.items || []).map((item, itemIndex) => <input key={itemIndex} value={item} onChange={(event) => onItemChange(itemIndex, event.target.value)} className="h-10 w-full rounded-xl bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-400" />)}<button type="button" onClick={onAddItem} className="min-h-9 w-full rounded-xl bg-blue-50 text-xs font-black text-blue-700">항목 추가</button></div>}
      {photos.length > 0 && <select value={section.imageUrl || ""} onChange={(event) => onUpdate({ imageUrl: event.target.value || undefined })} className="mt-2 h-10 w-full rounded-xl bg-slate-50 px-3 text-xs font-bold text-slate-600 outline-none"><option value="">이미지 없음</option>{photos.map((url, photoIndex) => <option key={url} value={url}>상품 이미지 {photoIndex + 1}</option>)}</select>}
    </article>
  );
}

function SectionPanel({ onAdd }: { onAdd: (type: DetailSection["type"]) => void }) { return <div className="grid grid-cols-4 gap-2">{sectionTypes.map((item) => <button key={item.type} type="button" onClick={() => onAdd(item.type)} className="min-h-14 rounded-2xl bg-slate-50 px-2 text-xs font-black text-slate-700">{item.label}</button>)}</div>; }
function StickerPanel({ photos, decorators, onToggle, onPosition }: { photos: string[]; decorators: ImageDecorator[]; onToggle: (imageIndex: number, label: string) => void; onPosition: (imageIndex: number, position: ImageDecorator["position"]) => void }) { return <div className="space-y-3">{photos.length === 0 ? <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-400">상품 사진을 먼저 추가해주세요.</p> : photos.map((url, imageIndex) => <div key={url} className="rounded-2xl bg-slate-50 p-3"><div className="mb-2 flex items-center gap-2"><img src={url} alt={`상품 이미지 ${imageIndex + 1}`} className="h-10 w-10 rounded-xl object-cover" /><p className="text-xs font-black text-slate-700">이미지 {imageIndex + 1}</p></div><div className="flex gap-2 overflow-x-auto pb-1">{stickerLabels.map((label) => { const active = decorators.some((decorator) => decorator.imageIndex === imageIndex && decorator.text === label); return <button key={label} type="button" onClick={() => onToggle(imageIndex, label)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ${active ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}>{label}</button>; })}</div><select onChange={(event) => onPosition(imageIndex, event.target.value as ImageDecorator["position"])} className="mt-2 h-9 w-full rounded-xl bg-white px-3 text-xs font-bold text-slate-600"><option value="">스티커 위치</option>{stickerPositions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>)}</div>; }
function ColorPanel({ current, onSelect }: { current: string; onSelect: (color: string) => void }) { return <div className="flex gap-2 overflow-x-auto pb-1">{accentColors.map((color) => <button key={color} type="button" onClick={() => onSelect(color)} className={`h-10 w-10 shrink-0 rounded-full ring-2 ${current === color ? "ring-slate-950" : "ring-white"}`} style={{ backgroundColor: color }} />)}</div>; }
function MorePanel({ onPolish, polishing, onPublishReview }: { onPolish?: () => void | Promise<void>; polishing: boolean; onPublishReview?: () => void | Promise<void> }) { return <div className="grid grid-cols-2 gap-2"><button type="button" onClick={onPolish} disabled={polishing} className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-3 text-sm font-black text-blue-700 disabled:opacity-60">{polishing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}AI 디자이너</button><button type="button" onClick={onPublishReview} className="min-h-11 rounded-2xl bg-slate-950 px-3 text-sm font-black text-white">복사/검수</button></div>; }
function ToolButton({ icon, label, active, onClick }: { icon: ReactNode; label: string; active: boolean; onClick: () => void }) { return <button type="button" title={label} onClick={onClick} className={`flex min-h-11 items-center justify-center rounded-xl ${active ? "bg-blue-50 text-blue-600" : "text-slate-950"}`}>{icon}</button>; }
function IconButton({ icon, onClick, danger = false }: { icon: ReactNode; onClick: () => void; danger?: boolean }) { return <button type="button" onClick={onClick} className={`flex h-8 w-8 items-center justify-center rounded-xl ${danger ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-500"}`}>{icon}</button>; }
function ImageThumb({ url, index, decorators }: { url: string; index: number; decorators: ImageDecorator[] }) { return <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100"><img src={url} alt={`상품 이미지 ${index + 1}`} className="h-full w-full object-cover" />{decorators.filter((decorator) => decorator.imageIndex === index).map((decorator, decoratorIndex) => <span key={decoratorIndex} className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-black text-white">{decorator.text || "추천"}</span>)}</div>; }

function ensureSections(state: BlogEditorState): DetailSection[] {
  const existing = state.detailPage?.sections;
  if (existing && existing.length > 0) return existing;
  return createDefaultSections(state);
}

function createDefaultSections(state: BlogEditorState): DetailSection[] {
  const detail = state.detailPage;
  const paragraphs = state.content.split(/\n{2,}/).filter((part) => part.trim());
  return [
    { id: createId(), type: "hero", title: state.selectedTitle || detail?.productName || "상품 헤드라인", body: paragraphs[0] || "상품의 첫인상을 소개하세요.", imageUrl: state.photoUrls[0] || state.localPhotoPreviews?.[0] },
    { id: createId(), type: "benefit", title: "핵심 장점", body: "구매자가 바로 이해할 수 있는 장점을 정리해요.", items: detail?.keyBenefits?.length ? detail.keyBenefits : paragraphs.slice(1, 5) },
    { id: createId(), type: "imageText", title: "사용 장면", body: paragraphs[1] || "실제 사용 상황을 보여주세요.", imageUrl: state.photoUrls[1] || state.localPhotoPreviews?.[1] },
    { id: createId(), type: "checklist", title: "구매 포인트", body: "구매 전 확인할 포인트입니다.", items: ["핵심 장점 확인", "구성품 확인", "배송/주의사항 확인"] },
    { id: createId(), type: "spec", title: "스펙/구성", body: detail?.components || detail?.cautions || "구성품과 상세 정보를 입력하세요." },
    { id: createId(), type: "faq", title: "FAQ", body: "자주 묻는 질문", items: ["배송은 어떻게 되나요?", "구성품은 무엇인가요?"] },
    { id: createId(), type: "cta", title: detail?.ctaText || "구매하러 가기", body: detail?.priceInfo || "혜택과 가격 정보는 입력한 내용 기준으로만 표시됩니다." },
  ];
}

function createSection(type: DetailSection["type"], imageUrl?: string): DetailSection {
  return { id: createId(), type, title: sectionLabel(type), body: "내용을 입력하세요.", imageUrl, items: type === "benefit" || type === "checklist" || type === "faq" ? ["새 항목"] : undefined };
}

function buildDetailHtml(state: BlogEditorState) {
  const sections = ensureSections(state);
  const accent = String(state.editorOptions.detailAccentColor || "#2563eb");
  return `<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.75;color:#1f2937;">${sections.map((section) => renderSection(section, state, accent)).join("")}</div>`;
}

function renderSection(section: DetailSection, state: BlogEditorState, accent: string) {
  const image = section.imageUrl ? renderImage(section.imageUrl, state) : "";
  if (section.type === "hero") return `<section style="padding:24px 18px;border-radius:28px;background:linear-gradient(180deg,#eff6ff,#fff);text-align:center;">${image}<h1 style="margin:16px 0 0;font-size:28px;line-height:1.25;color:#0f172a;">${escapeHtml(section.title)}</h1><p style="margin:14px 0 0;color:#475569;">${escapeHtml(section.body)}</p><span style="display:inline-flex;margin-top:18px;padding:12px 18px;border-radius:999px;background:${accent};color:#fff;font-weight:900;">구매하러 가기</span></section>`;
  if (section.type === "cta") return `<section style="margin-top:18px;padding:22px;border-radius:26px;background:#0f172a;color:white;text-align:center;"><h2 style="margin:0;font-size:22px;">${escapeHtml(section.title)}</h2><p style="margin:10px 0 0;color:#cbd5e1;">${escapeHtml(section.body)}</p><span style="display:inline-flex;margin-top:16px;padding:12px 20px;border-radius:999px;background:#facc15;color:#0f172a;font-weight:900;">${escapeHtml(section.title)}</span></section>`;
  const list = section.items?.length ? `<ul style="display:grid;gap:10px;margin:12px 0 0;padding:0;">${section.items.map((item) => `<li style="list-style:none;padding:12px 14px;border-radius:14px;background:#eff6ff;color:#1e3a8a;font-weight:800;">${escapeHtml(item)}</li>`).join("")}</ul>` : "";
  return `<section style="margin-top:18px;padding:20px;border-radius:24px;background:#fff;border:1px solid #e5e7eb;">${image}<h2 style="margin:0 0 10px;color:#0f172a;font-size:20px;">${sectionIcon(section.type)} ${escapeHtml(section.title)}</h2><p style="margin:0;color:#475569;white-space:pre-wrap;">${escapeHtml(section.body)}</p>${list}</section>`;
}

function renderImage(url: string, state: BlogEditorState) {
  const photos = state.localPhotoPreviews?.length ? state.localPhotoPreviews : state.photoUrls;
  const imageIndex = Math.max(0, photos.indexOf(url));
  const decorators = (state.photoDecorators || []).filter((decorator) => decorator.imageIndex === imageIndex).map((decorator) => `<span style="${decoratorPositionStyle(decorator.position || "top-left")};z-index:2;border-radius:999px;background:${escapeAttribute(decorator.color || "#2563eb")};color:white;padding:6px 10px;font-size:12px;font-weight:900;position:absolute;">${escapeHtml(decorator.text || "추천")}</span>`).join("");
  return `<figure style="margin:0 0 14px;text-align:center;"><div style="position:relative;display:inline-block;max-width:100%;">${decorators}<img src="${escapeAttribute(url)}" alt="상품 이미지" style="max-width:100%;height:auto;border-radius:18px;box-shadow:0 12px 28px rgba(15,23,42,0.10);" /></div></figure>`;
}

function sectionLabel(type: DetailSection["type"]) { return sectionTypes.find((item) => item.type === type)?.label || "섹션"; }
function sectionIcon(type: DetailSection["type"]) { return { hero: "🛒", benefit: "⭐", imageText: "📷", checklist: "✅", spec: "📦", faq: "❓", cta: "🔥", notice: "📌" }[type]; }
function createId() { return `section-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function decoratorPositionStyle(position: string) { if (position === "top-right") return "right:10px;top:10px"; if (position === "bottom-left") return "left:10px;bottom:10px"; if (position === "bottom-right") return "right:10px;bottom:10px"; return "left:10px;top:10px"; }
function escapeHtml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;"); }
function escapeAttribute(value: string) { return escapeHtml(value).replace(/`/g, "&#096;"); }




