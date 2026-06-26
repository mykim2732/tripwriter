"use client";

import { Loader2, RefreshCw, Save, Send, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EmojiPicker } from "@/components/EmojiPicker";
import type { BlogEditorState } from "@/types/editor";

const fontOptions = ["기본", "Pretendard", "Noto Sans KR", "나눔고딕", "나눔명조", "감성 손글씨", "귀여운 손글씨", "담백한 손글씨", "카페 감성", "문서형"];
const sizeOptions = ["작게", "기본", "크게", "아주 크게"];
const pointIcons = ["✅", "⭐", "🔥", "📌", "💡", "✨", "📝", "👍", "❤️", "🌿"];

const fontMap: Record<string, string> = {
  기본: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Pretendard: "Pretendard, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  "Noto Sans KR": "'Noto Sans KR', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  나눔고딕: "'Nanum Gothic', 'Malgun Gothic', system-ui, sans-serif",
  나눔명조: "'Nanum Myeongjo', Georgia, serif",
  "감성 손글씨": "'Nanum Pen Script', 'Comic Sans MS', cursive",
  "귀여운 손글씨": "'Gaegu', 'Comic Sans MS', cursive",
  "담백한 손글씨": "'Nanum Brush Script', 'Segoe Print', cursive",
  "카페 감성": "'Cafe24 Oneprettynight', Georgia, serif",
  문서형: "Arial, 'Malgun Gothic', system-ui, sans-serif",
};

const sizeMap: Record<string, string> = {
  작게: "14px",
  기본: "16px",
  크게: "18px",
  "아주 크게": "20px",
};

type Props = {
  state: BlogEditorState;
  onChange: (next: BlogEditorState) => void;
  onSave?: () => void | Promise<void>;
  onPolish?: () => void | Promise<void>;
  onPublishReview?: () => void | Promise<void>;
  onRegenerateLayout?: () => void;
  onRecommendTitles?: () => void | Promise<void>;
  saving?: boolean;
  polishing?: boolean;
  titleLoading?: boolean;
};

export function BlogEditor({
  state,
  onChange,
  onSave,
  onPolish,
  onPublishReview,
  onRegenerateLayout,
  onRecommendTitles,
  saving = false,
  polishing = false,
  titleLoading = false,
}: Props) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLTextAreaElement | null>(null);
  const [showBodyEmoji, setShowBodyEmoji] = useState(false);
  const [showTitleEmoji, setShowTitleEmoji] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const html = state.html || buildEditorHtml(state);
  const photos = state.localPhotoPreviews?.length ? state.localPhotoPreviews : state.photoUrls;

  useEffect(() => {
    if (previewRef.current && previewRef.current.innerHTML !== html) {
      previewRef.current.innerHTML = html;
    }
  }, [html]);

  function patch(patchState: Partial<BlogEditorState>) {
    const next = { ...state, ...patchState };
    onChange({ ...next, html: patchState.html ?? buildEditorHtml(next) });
  }

  function syncHtml() {
    onChange({ ...state, html: sanitizeHtml(previewRef.current?.innerHTML || "") });
  }

  function hasSelection() {
    const selection = window.getSelection();
    return Boolean(selection && !selection.isCollapsed && previewRef.current && selection.anchorNode && previewRef.current.contains(selection.anchorNode));
  }

  function command(name: string, value?: string, message = "꾸밀 문장을 먼저 선택해주세요") {
    if (!hasSelection()) {
      window.alert(message);
      return;
    }
    document.execCommand(name, false, value);
    syncHtml();
  }

  function insertTitleEmoji(emoji: string) {
    const start = titleRef.current?.selectionStart ?? 0;
    const end = titleRef.current?.selectionEnd ?? 0;
    const selectedTitle = `${state.selectedTitle.slice(0, start)}${emoji}${state.selectedTitle.slice(end)}`;
    patch({ selectedTitle });
    window.requestAnimationFrame(() => {
      titleRef.current?.focus();
      titleRef.current?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  function insertBodyEmoji(emoji: string) {
    if (document.activeElement === previewRef.current) {
      document.execCommand("insertText", false, emoji);
      syncHtml();
      return;
    }
    patch({ content: `${state.content}${emoji}` });
  }

  function updateCaption(index: number, caption: string) {
    const photoCaptions = [...state.photoCaptions];
    photoCaptions[index] = caption;
    patch({ photoCaptions, showCaptions: true, editorOptions: { ...state.editorOptions, photoCaptions } });
  }

  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <p className="rounded-2xl bg-blue-50 px-4 py-3 text-xs font-bold leading-5 text-blue-700">
        문장을 선택하고 누르면 선택한 부분에만 적용돼요. 사진 설명도 바로 수정할 수 있어요.
      </p>

      <div className="mt-4 flex gap-2">
        <textarea
          ref={titleRef}
          value={state.selectedTitle}
          onChange={(event) => patch({ selectedTitle: event.target.value })}
          className="min-h-20 flex-1 resize-y rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xl font-black leading-7 text-slate-950 outline-none focus:border-blue-400 focus:bg-white"
        />
        <button type="button" onClick={() => setShowTitleEmoji((value) => !value)} className="h-12 w-12 rounded-2xl bg-blue-50 text-lg" aria-label="제목 이모지">
          😊
        </button>
      </div>

      {showTitleEmoji && <div className="mt-2"><EmojiPicker onSelect={insertTitleEmoji} /></div>}

      {state.titleCandidates.length > 0 && (
        <div className="mt-3 grid gap-2">
          {state.titleCandidates.map((title) => (
            <button key={title} type="button" onClick={() => patch({ selectedTitle: title })} className={`rounded-2xl px-4 py-3 text-left text-sm font-bold ${state.selectedTitle === title ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-700"}`}>
              {title}
            </button>
          ))}
        </div>
      )}

      {onRecommendTitles && (
        <button type="button" onClick={onRecommendTitles} disabled={titleLoading} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-50 px-3 text-sm font-bold text-blue-700 disabled:opacity-60">
          {titleLoading ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <RefreshCw size={16} aria-hidden="true" />}
          다시 추천
        </button>
      )}

      <div className="mt-4 rounded-3xl border border-slate-100 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-6 gap-1.5">
          <ToolButton label="B" title="굵게" className="font-black" onClick={() => command("bold")} />
          <ToolButton label="I" title="기울임" className="italic" onClick={() => command("italic")} />
          <ToolButton label="U" title="밑줄" className="underline" onClick={() => command("underline")} />
          <ToolButton label="●" title="글자색" className="text-blue-600" onClick={() => command("foreColor", "#2563eb")} />
          <ToolButton label="▬" title="형광펜" className="bg-yellow-100 text-yellow-700" onClick={() => command("hiliteColor", "#fef08a")} />
          <ToolButton label="😊" title="이모지" onClick={() => setShowBodyEmoji((value) => !value)} />
        </div>
        <button type="button" onClick={() => setShowMoreTools((value) => !value)} className="mt-2 min-h-10 w-full rounded-2xl bg-slate-100 text-xs font-black text-slate-700">
          {showMoreTools ? "더 꾸미기 닫기" : "더 꾸미기"}
        </button>

        {showMoreTools && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-4 gap-1.5">
              <ToolButton label="S" title="취소선" className="line-through" onClick={() => command("strikeThrough")} />
              <ToolButton label="소제목" title="소제목" onClick={() => command("formatBlock", "h2", "소제목으로 만들 문장을 선택해주세요")} />
              <ToolButton label="문단" title="문단" onClick={() => command("formatBlock", "p", "일반 문단으로 되돌릴 문장을 선택해주세요")} />
              <ToolButton label="빨강" title="빨강" className="text-red-600" onClick={() => command("foreColor", "#ef4444")} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select label="글꼴" value={state.fontFamily} options={fontOptions} onChange={(fontFamily) => patch({ fontFamily })} />
              <Select label="전체 글자 크기" value={state.fontSize} options={sizeOptions} onChange={(fontSize) => patch({ fontSize })} />
              <Select label="정렬" value={state.textAlign} options={["left", "center", "right"]} onChange={(textAlign) => patch({ textAlign: textAlign as BlogEditorState["textAlign"] })} />
              <Select label="선택 글자 크기" value="기본" options={sizeOptions} onChange={(value) => command("fontSize", String(sizeOptions.indexOf(value) + 2))} />
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {pointIcons.map((icon) => <button key={icon} type="button" onClick={() => patch({ pointIcon: icon })} className={`min-h-9 rounded-xl text-lg ${state.pointIcon === icon ? "bg-blue-600" : "bg-slate-100"}`}>{icon}</button>)}
            </div>
          </div>
        )}
      </div>

      {showBodyEmoji && <div className="mt-3"><EmojiPicker onSelect={insertBodyEmoji} /></div>}

      <div
        ref={previewRef}
        contentEditable
        suppressContentEditableWarning
        onBlur={syncHtml}
        className="mt-3 min-h-96 rounded-3xl bg-white p-4 text-sm leading-7 text-slate-800 outline-none ring-1 ring-slate-100 focus:ring-blue-400"
        style={{ fontFamily: fontMap[state.fontFamily] || fontMap.기본, fontSize: sizeMap[state.fontSize] || sizeMap.기본, textAlign: state.textAlign }}
      />

      {photos.length > 0 && (
        <div className="mt-3 rounded-3xl bg-slate-50 p-3">
          <p className="text-sm font-black text-slate-800">사진 설명</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">다음 Sprint에서 GPT Vision 이미지 분석으로 자동 설명 생성을 연결할 예정이에요.</p>
          <div className="mt-3 grid gap-2">
            {photos.map((url, index) => (
              <label key={`${url}-${index}`} className="grid grid-cols-[56px_1fr] gap-3 rounded-2xl bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`사진 ${index + 1}`} className="h-14 w-14 rounded-xl object-cover" />
                <span>
                  <span className="block text-[11px] font-bold text-slate-400">사진 {index + 1}</span>
                  <input value={state.photoCaptions[index] || "사진 설명 추가"} onChange={(event) => updateCaption(index, event.target.value)} className="mt-1 h-9 w-full rounded-xl bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-400" />
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <details className="mt-3 rounded-2xl bg-slate-50 p-3">
        <summary className="cursor-pointer text-sm font-bold text-slate-700">고급 편집</summary>
        <div className="mt-3 space-y-3">
          <LinkEditor state={state} onPatch={patch} />
          <div className="rounded-2xl bg-white p-3">
            <p className="text-sm font-black text-slate-800">광고/제휴 링크</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5 text-xs font-bold">
              {["광고 없음", "링크형 광고", "제휴 링크"].map((item) => <span key={item} className="rounded-xl bg-slate-100 px-2 py-2 text-center text-slate-600">{item}</span>)}
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">광고와 제휴 링크 삽입은 추후 Pro 기능으로 연결할 예정이에요.</p>
          </div>
        </div>
      </details>

      <div className="mt-4 grid gap-2">
        <button type="button" onClick={onSave} disabled={saving} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white disabled:opacity-60">
          {saving ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Save size={17} aria-hidden="true" />}
          임시저장
        </button>
        <button type="button" onClick={onPolish} disabled={polishing} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 text-sm font-bold text-blue-700 disabled:opacity-60">
          {polishing ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Wand2 size={17} aria-hidden="true" />}
          AI가 보기 좋게 꾸미기
        </button>
        <button type="button" onClick={onRegenerateLayout} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white">
          <Sparkles size={17} aria-hidden="true" />
          본문 배치 재생성
        </button>
        <button type="button" onClick={onPublishReview} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-700">
          <Send size={17} aria-hidden="true" />
          발행 전 검수
        </button>
      </div>
    </section>
  );
}

function ToolButton({ label, title, className = "", onClick }: { label: string; title: string; className?: string; onClick: () => void }) {
  return <button type="button" title={title} onClick={onClick} className={`min-h-10 rounded-2xl bg-slate-100 text-xs font-black text-slate-700 ${className}`}>{label}</button>;
}

function LinkEditor({ state, onPatch }: { state: BlogEditorState; onPatch: (patch: Partial<BlogEditorState>) => void }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  function addLink() {
    if (!label.trim() || !url.trim()) return;
    onPatch({ links: [...(state.links || []), { label, url }] });
    setLabel("");
    setUrl("");
  }

  return (
    <div className="rounded-2xl bg-white p-3">
      <p className="text-sm font-black text-slate-800">링크</p>
      <div className="mt-2 grid gap-2">
        <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="링크 제목" className="h-10 rounded-xl bg-slate-50 px-3 text-sm outline-none focus:ring-1 focus:ring-blue-400" />
        <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="URL" className="h-10 rounded-xl bg-slate-50 px-3 text-sm outline-none focus:ring-1 focus:ring-blue-400" />
        <button type="button" onClick={addLink} className="min-h-10 rounded-xl bg-blue-600 text-sm font-bold text-white">링크 추가</button>
      </div>
      {(state.links || []).length > 0 && <ul className="mt-2 space-y-1 text-xs font-semibold text-slate-500">{state.links?.map((link) => <li key={`${link.label}-${link.url}`} className="truncate rounded-lg bg-slate-50 px-2 py-1">{link.label} · {link.url}</li>)}</ul>}
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block rounded-2xl bg-slate-100 px-3 py-2">
      <span className="block text-[10px] font-black text-slate-400">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full bg-transparent text-xs font-black text-slate-700 outline-none">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export function buildEditorHtml(state: BlogEditorState) {
  const photoUrls = state.localPhotoPreviews?.length ? state.localPhotoPreviews : state.photoUrls;
  const paragraphs = state.content.split(/\n{2,}/).filter((part) => part.trim().length > 0);
  const placements = placePhotos(paragraphs.length, photoUrls);
  const blocks: string[] = [];

  paragraphs.forEach((paragraph, index) => {
    const clean = sanitizeText(paragraph);
    const isHeading = /^#{1,3}\s+/.test(paragraph.trim());
    blocks.push(isHeading ? `<h2>${clean.replace(/^#{1,3}\s+/, "")}</h2>` : `<p>${clean}</p>`);
    (placements.get(index) || []).forEach((url) => {
      const photoIndex = photoUrls.indexOf(url);
      const caption = state.photoCaptions[photoIndex] || makeDefaultCaption(photoIndex);
      blocks.push(`<figure><img src="${escapeAttribute(url)}" alt="${escapeAttribute(caption)}" style="max-width:100%;height:auto;border-radius:14px;" /><figcaption style="margin-top:8px;color:#94a3b8;font-size:0.86em;text-align:center;">${escapeHtml(caption)}</figcaption></figure>`);
    });
  });

  return `<div style="line-height:${state.paragraphSpacing ? "2" : "1.85"};color:#1f2937;">${blocks.join("")}</div>`;
}

function makeDefaultCaption(index: number) {
  if (index === 0) return "대표 이미지";
  return "본문 참고 이미지";
}

function placePhotos(paragraphCount: number, urls: string[]) {
  const map = new Map<number, string[]>();
  if (paragraphCount === 0) return map;
  urls.forEach((url, index) => {
    const target = urls.length > paragraphCount && index >= paragraphCount ? paragraphCount - 1 : Math.min(paragraphCount - 1, Math.floor(((index + 1) * paragraphCount) / (urls.length + 1)));
    const current = map.get(target) || [];
    current.push(url);
    map.set(target, current);
  });
  return map;
}

function sanitizeHtml(html: string) {
  return html.replace(/```/g, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|>|\n)##\s*([^<\n]+)/g, "$1<h2>$2</h2>");
}

function sanitizeText(text: string) {
  return escapeHtml(text).replace(/```/g, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
