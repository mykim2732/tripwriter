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
import { normalizeDecorators, renderDecoratorHtml } from "@/components/ImageDecoratorEditor";
import { createEditorPhoto, defaultCaption, PhotoManager, photosFromUrls } from "@/components/PhotoManager";
import type { BlogEditorState, DesignTheme, DetailSection, EditorPhoto, ImageDecorator } from "@/types/editor";

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
const designThemes: { theme: DesignTheme; hint: string }[] = [
  { theme: "판매 상세페이지", hint: "히어로, 장점 카드, 구매 CTA" },
  { theme: "전문 리뷰", hint: "스펙, 비교, 신뢰 포인트" },
  { theme: "정보 정리", hint: "체크리스트와 FAQ 중심" },
  { theme: "감성 다이어리", hint: "메모지와 부드러운 사진 설명" },
  { theme: "아이 낙서", hint: "키즈 상품과 육아 콘텐츠용 낙서 포인트" },
  { theme: "카페 감성", hint: "감성 이미지와 부드러운 섹션" },
  { theme: "맛집 후기", hint: "맛 포인트와 추천 배지" },
  { theme: "여행 기록", hint: "사진 흐름과 장소감" },
  { theme: "육아 일상", hint: "공감형 설명과 따뜻한 톤" },
];

type Props = {
  state: BlogEditorState;
  onChange: (next: BlogEditorState) => void;
  onSave?: () => void | Promise<void>;
  onPolish?: (theme?: DesignTheme) => void | Promise<void>;
  onPublishReview?: () => void | Promise<void>;
  saving?: boolean;
  polishing?: boolean;
};

type Panel = "none" | "image" | "section" | "sticker" | "design" | "color" | "more";

export function DetailEditor({ state, onChange, onSave, onPolish, onPublishReview, saving = false, polishing = false }: Props) {
  const [activePanel, setActivePanel] = useState<Panel>("none");
  const managedPhotos = getManagedPhotos(state);
  const photos = managedPhotos.map((photo) => photo.url);
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


  function updatePhotoDecorators(decorators: ImageDecorator[]) {
    const normalized = normalizeDecorators(decorators, photos);
    patch({ photoDecorators: normalized, editorOptions: { ...state.editorOptions, imageDecorators: normalized } });
  }

  function updatePhotoCaptions(captions: string[]) {
    patch({ photoCaptions: captions, editorOptions: { ...state.editorOptions, photoCaptions: captions } });
  }

  function applyPhotos(nextPhotos: EditorPhoto[], captions: string[], decorators: ImageDecorator[]) {
    const urls = nextPhotos.map((photo) => photo.url);
    const publicUrls = nextPhotos.filter((photo) => !photo.isLocal).map((photo) => photo.url);
    const normalized = normalizeDecorators(decorators, urls);
    patch({
      editorPhotos: nextPhotos,
      photoUrls: publicUrls,
      localPhotoPreviews: urls,
      photoCaptions: captions,
      photoDecorators: normalized,
      editorOptions: { ...state.editorOptions, photoCaptions: captions, imageDecorators: normalized },
    });
  }

  function addPhotos(files: File[]) {
    const nextPhotos = [...managedPhotos, ...files.map(createEditorPhoto)];
    const nextCaptions = [
      ...state.photoCaptions.slice(0, managedPhotos.length),
      ...files.map((_, index) => defaultCaption(managedPhotos.length + index)),
    ];
    applyPhotos(nextPhotos, nextCaptions, state.photoDecorators || []);
  }

  function removePhoto(index: number) {
    const removedUrl = photos[index];
    const nextPhotos = managedPhotos.filter((_, photoIndex) => photoIndex !== index);
    const nextCaptions = state.photoCaptions.filter((_, captionIndex) => captionIndex !== index);
    const nextDecorators = (state.photoDecorators || [])
      .filter((decorator) => decorator.imageIndex !== index)
      .map((decorator) => typeof decorator.imageIndex === "number" && decorator.imageIndex > index ? { ...decorator, imageIndex: decorator.imageIndex - 1 } : decorator);
    const nextSections = sections.map((section) => section.imageUrl === removedUrl ? { ...section, imageUrl: undefined } : section);
    const urls = nextPhotos.map((photo) => photo.url);
    const publicUrls = nextPhotos.filter((photo) => !photo.isLocal).map((photo) => photo.url);
    const normalized = normalizeDecorators(nextDecorators, urls);
    patch({
      editorPhotos: nextPhotos,
      photoUrls: publicUrls,
      localPhotoPreviews: urls,
      photoCaptions: nextCaptions,
      photoDecorators: normalized,
      detailPage: { productName: state.detailPage?.productName || state.selectedTitle, keyBenefits: state.detailPage?.keyBenefits || [], ...state.detailPage, sections: nextSections },
      editorOptions: { ...state.editorOptions, photoCaptions: nextCaptions, imageDecorators: normalized },
    });
  }

  function movePhoto(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= managedPhotos.length) return;
    const beforeUrl = photos[fromIndex];
    const nextPhotos = moveItem(managedPhotos, fromIndex, toIndex);
    const nextCaptions = moveItem(state.photoCaptions, fromIndex, toIndex);
    const nextDecorators = remapDecoratorsAfterMove(state.photoDecorators || [], fromIndex, toIndex);
    const nextUrl = nextPhotos[toIndex]?.url;
    const nextSections = sections.map((section) => section.imageUrl === beforeUrl ? { ...section, imageUrl: nextUrl } : section);
    const urls = nextPhotos.map((photo) => photo.url);
    const publicUrls = nextPhotos.filter((photo) => !photo.isLocal).map((photo) => photo.url);
    const normalized = normalizeDecorators(nextDecorators, urls);
    patch({
      editorPhotos: nextPhotos,
      photoUrls: publicUrls,
      localPhotoPreviews: urls,
      photoCaptions: nextCaptions,
      photoDecorators: normalized,
      detailPage: { productName: state.detailPage?.productName || state.selectedTitle, keyBenefits: state.detailPage?.keyBenefits || [], ...state.detailPage, sections: nextSections },
      editorOptions: { ...state.editorOptions, photoCaptions: nextCaptions, imageDecorators: normalized },
    });
  }

  function changeCaption(index: number, caption: string) {
    const nextCaptions = [...state.photoCaptions];
    nextCaptions[index] = caption;
    updatePhotoCaptions(nextCaptions);
  }

  function applyPhotoAnalysis(result: {
    photos: { url: string; caption: string; shortMemo?: string; recommendedUse?: string; decoratorSuggestions?: ImageDecorator[] }[];
    coverPhotoUrl: string;
    coverReason: string;
    photoOrder: string[];
    summary: string;
  }) {
    const urls = managedPhotos.map((photo) => photo.url);
    const nextCaptions = managedPhotos.map((photo, index) => result.photos.find((item) => item.url === photo.url)?.caption || state.photoCaptions[index] || defaultCaption(index));
    const suggestedDecorators = result.photos.flatMap((photo) => {
      const imageIndex = urls.indexOf(photo.url);
      return (photo.decoratorSuggestions || []).slice(0, 2).map((decorator, decoratorIndex) => ({
        ...decorator,
        id: `analysis-${imageIndex}-${decoratorIndex}-${Date.now()}`,
        imageIndex,
        imageUrl: photo.url,
        type: normalizeDecoratorType(decorator.type),
        enabled: true,
      }));
    });
    const nextDecorators = normalizeDecorators([...(state.photoDecorators || []), ...suggestedDecorators], urls);
    const nextSections = sections.map((section, index) => index === 0 && result.coverPhotoUrl ? { ...section, imageUrl: result.coverPhotoUrl } : section);
    patch({
      photoCaptions: nextCaptions,
      photoDecorators: nextDecorators,
      photoAnalysis: result.photos,
      coverPhotoUrl: result.coverPhotoUrl,
      coverReason: result.coverReason,
      photoSummary: result.summary,
      detailPage: { productName: state.detailPage?.productName || state.selectedTitle, keyBenefits: state.detailPage?.keyBenefits || [], ...state.detailPage, sections: nextSections },
      editorOptions: {
        ...state.editorOptions,
        photoCaptions: nextCaptions,
        imageDecorators: nextDecorators,
        photoAnalysis: result.photos,
        coverPhotoUrl: result.coverPhotoUrl,
        coverReason: result.coverReason,
        photoSummary: result.summary,
        photoOrder: result.photoOrder,
      },
    });
  }

  function setCoverPhoto(url: string, reason = "사용자가 직접 대표사진으로 지정했어요.") {
    const nextSections = sections.map((section, index) => index === 0 ? { ...section, imageUrl: url } : section);
    patch({
      coverPhotoUrl: url,
      coverReason: reason,
      detailPage: { productName: state.detailPage?.productName || state.selectedTitle, keyBenefits: state.detailPage?.keyBenefits || [], ...state.detailPage, sections: nextSections },
      editorOptions: { ...state.editorOptions, coverPhotoUrl: url, coverReason: reason },
    });
  }
  function setAccentColor(color: string) {
    patch({ editorOptions: { ...state.editorOptions, detailAccentColor: color } });
  }

  function runDesign(theme: DesignTheme) {
    patch({ editorOptions: { ...state.editorOptions, designTheme: theme } });
    void onPolish?.(theme);
    setActivePanel("none");
  }

  function saveNow() {
    patch({ html });
    void onSave?.();
  }

  const recommendedTheme = getRecommendedTheme(state);

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
            {activePanel === "sticker" && (
              <PhotoManager
                photos={managedPhotos}
                photoCaptions={state.photoCaptions}
                imageDecorators={state.photoDecorators || []}
                onAddPhotos={addPhotos}
                onRemovePhoto={removePhoto}
                onMovePhoto={movePhoto}
                onChangeCaption={changeCaption}
                onChangeDecorators={updatePhotoDecorators}
                onApplyAnalysis={applyPhotoAnalysis}
                onSetCoverPhoto={setCoverPhoto}
                coverPhotoUrl={state.coverPhotoUrl}
                coverReason={state.coverReason}
                photoAnalysis={state.photoAnalysis}
                photoSummary={state.photoSummary}
                mode="detail"
                platform={state.platform}
                contentType={state.contentType}
                context={{ title: state.selectedTitle, place: state.detailPage?.brandName, keywords: String(state.editorOptions.keywords || ""), style: String(state.editorOptions.style || "") }}
              />
            )}
            {activePanel === "design" && <DesignPanel recommendedTheme={recommendedTheme} polishing={polishing} onSelect={runDesign} />}
            {activePanel === "color" && <ColorPanel current={String(state.editorOptions.detailAccentColor || "#2563eb")} onSelect={setAccentColor} />}
            {activePanel === "image" && <p className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">사진 도구에서 상품 이미지를 추가하고 순서를 바꿀 수 있어요.</p>}
            {activePanel === "more" && <MorePanel onPolish={onPolish} polishing={polishing} onPublishReview={onPublishReview} />}
          </div>
        )}
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] items-center gap-1 px-3 py-2">
          <ToolButton icon={<ImageIcon size={23} />} label="사진" active={activePanel === "sticker"} onClick={() => setActivePanel(activePanel === "sticker" ? "none" : "sticker")} />
          <ToolButton icon={<Layers3 size={23} />} label="섹션" active={activePanel === "section"} onClick={() => setActivePanel(activePanel === "section" ? "none" : "section")} />
          <ToolButton icon={<Sparkles size={23} />} label="디자인" active={activePanel === "design"} onClick={() => setActivePanel(activePanel === "design" ? "none" : "design")} />
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
function DesignPanel({ recommendedTheme, polishing, onSelect }: { recommendedTheme: DesignTheme; polishing: boolean; onSelect: (theme: DesignTheme) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-sm font-black text-slate-950">AI 디자인 테마</p>
          <p className="mt-0.5 text-[11px] font-bold text-slate-400">섹션, 사진 스티커, CTA를 상세페이지답게 정리해요.</p>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-700">추천 {recommendedTheme}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {designThemes.map((item) => (
          <button
            key={item.theme}
            type="button"
            onClick={() => onSelect(item.theme)}
            disabled={polishing}
            className={`min-h-16 rounded-2xl px-3 py-3 text-left disabled:opacity-60 ${item.theme === recommendedTheme ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-700"}`}
          >
            <span className="block text-sm font-black">{item.theme}</span>
            <span className={`mt-1 block text-[11px] font-bold ${item.theme === recommendedTheme ? "text-blue-100" : "text-slate-400"}`}>{item.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
function MorePanel({ onPolish, polishing, onPublishReview }: { onPolish?: (theme?: DesignTheme) => void | Promise<void>; polishing: boolean; onPublishReview?: () => void | Promise<void> }) { return <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => onPolish?.("판매 상세페이지")} disabled={polishing} className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-3 text-sm font-black text-blue-700 disabled:opacity-60">{polishing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}AI 디자인</button><button type="button" onClick={onPublishReview} className="min-h-11 rounded-2xl bg-slate-950 px-3 text-sm font-black text-white">복사/검수</button></div>; }
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
    { id: createId(), type: "hero", title: state.selectedTitle || detail?.productName || "상품 헤드라인", body: paragraphs[0] || "상품의 첫인상을 소개하세요.", imageUrl: getPhotoUrls(state)[0] },
    { id: createId(), type: "benefit", title: "핵심 장점", body: "구매자가 바로 이해할 수 있는 장점을 정리해요.", items: detail?.keyBenefits?.length ? detail.keyBenefits : paragraphs.slice(1, 5) },
    { id: createId(), type: "imageText", title: "사용 장면", body: paragraphs[1] || "실제 사용 상황을 보여주세요.", imageUrl: getPhotoUrls(state)[1] },
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
  const photos = getPhotoUrls(state);
  const imageIndex = Math.max(0, photos.indexOf(url));
  const decorators = renderDecoratorHtml(normalizeDecorators(state.photoDecorators || [], photos).filter((decorator) => decorator.imageIndex === imageIndex || decorator.imageUrl === url));
  return `<figure style="margin:0 0 14px;text-align:center;"><div style="position:relative;display:inline-block;max-width:100%;">${decorators}<img src="${escapeAttribute(url)}" alt="상품 이미지" style="max-width:100%;height:auto;border-radius:18px;box-shadow:0 12px 28px rgba(15,23,42,0.10);" /></div></figure>`;
}

function sectionLabel(type: DetailSection["type"]) { return sectionTypes.find((item) => item.type === type)?.label || "섹션"; }
function sectionIcon(type: DetailSection["type"]) { return { hero: "🛒", benefit: "⭐", imageText: "📷", checklist: "✅", spec: "📦", faq: "❓", cta: "🔥", notice: "📌" }[type]; }
function createId() { return `section-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function decoratorPositionStyle(position: string) { if (position === "top-right") return "right:10px;top:10px"; if (position === "bottom-left") return "left:10px;bottom:10px"; if (position === "bottom-right") return "right:10px;bottom:10px"; return "left:10px;top:10px"; }
function escapeHtml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;"); }
function escapeAttribute(value: string) { return escapeHtml(value).replace(/`/g, "&#096;"); }

function getManagedPhotos(state: BlogEditorState): EditorPhoto[] {
  if (state.editorPhotos?.length) return state.editorPhotos;
  return photosFromUrls(getPhotoUrls(state));
}

function getPhotoUrls(state: BlogEditorState) {
  if (state.editorPhotos?.length) return state.editorPhotos.map((photo) => photo.url);
  return state.localPhotoPreviews?.length ? state.localPhotoPreviews : state.photoUrls;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  if (item === undefined) return items;
  next.splice(toIndex, 0, item);
  return next;
}

function remapDecoratorsAfterMove(decorators: ImageDecorator[], fromIndex: number, toIndex: number) {
  return decorators.map((decorator) => {
    if (typeof decorator.imageIndex !== "number") return decorator;
    if (decorator.imageIndex === fromIndex) return { ...decorator, imageIndex: toIndex };
    if (fromIndex < toIndex && decorator.imageIndex > fromIndex && decorator.imageIndex <= toIndex) return { ...decorator, imageIndex: decorator.imageIndex - 1 };
    if (fromIndex > toIndex && decorator.imageIndex >= toIndex && decorator.imageIndex < fromIndex) return { ...decorator, imageIndex: decorator.imageIndex + 1 };
    return decorator;
  });
}

function normalizeDecoratorType(type: unknown): ImageDecorator["type"] {
  const value = String(type || "sparkle");
  if (value === "heart" || value === "star") return "handDrawn";
  if (value === "circle") return "circle";
  if (value === "arrow") return "arrow";
  if (value === "memo") return "memo";
  if (value === "polaroid") return "polaroid";
  if (value === "maskingTape") return "maskingTape";
  if (value === "sparkle") return "sparkle";
  return "sticker";
}

function getRecommendedTheme(state: BlogEditorState): DesignTheme {
  const stored = state.editorOptions.designTheme;
  if (typeof stored === "string" && designThemes.some((item) => item.theme === stored)) return stored as DesignTheme;
  const text = `${state.selectedTitle} ${state.content} ${state.detailPage?.category || ""}`.toLowerCase();
  if (/키즈|아이|육아|아기|어린이/.test(text)) return "아이 낙서";
  if (/스펙|비교|리뷰|전문/.test(text)) return "전문 리뷰";
  if (/정보|체크|faq|구성/.test(text)) return "정보 정리";
  if (/카페|디저트|감성/.test(text)) return "카페 감성";
  if (/맛집|메뉴|음식/.test(text)) return "맛집 후기";
  if (/여행|캠핑|숙소/.test(text)) return "여행 기록";
  if (/육아|아이|아기/.test(text)) return "육아 일상";
  return "판매 상세페이지";
}







