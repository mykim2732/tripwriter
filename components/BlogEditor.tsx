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
  const [activePanel, setActivePanel] = useState<"none" | "format" | "insert" | "emoji">("none");
  const [showTitleEmoji, setShowTitleEmoji] = useState(false);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkKind, setLinkKind] = useState<"link" | "map" | "youtube">("link");
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

  function insertDivider() {
    previewRef.current?.focus();
    document.execCommand("insertHTML", false, '<hr style="border:0;border-top:1px solid #e5e7eb;margin:28px 0;" />');
    syncHtml();
  }

  function insertQuote() {
    previewRef.current?.focus();
    document.execCommand("insertHTML", false, '<blockquote style="margin:20px 0;padding:14px 16px;border-left:4px solid #3b82f6;background:#eff6ff;color:#334155;border-radius:12px;">인용구를 입력하세요</blockquote>');
    syncHtml();
  }

  function insertLink() {
    const normalizedUrl = linkUrl.trim();
    if (!normalizedUrl) {
      window.alert("추가할 URL을 입력해주세요");
      return;
    }

    const label = linkLabel.trim() || (linkKind === "map" ? "지도 보기" : linkKind === "youtube" ? "유튜브 영상 보기" : normalizedUrl);
    const safeUrl = escapeAttribute(normalizedUrl);
    const safeLabel = escapeHtml(label);
    previewRef.current?.focus();

    if (hasSelection()) {
      document.execCommand("createLink", false, normalizedUrl);
    } else {
      const badge = linkKind === "map" ? "지도" : linkKind === "youtube" ? "YouTube" : "링크";
      document.execCommand(
        "insertHTML",
        false,
        `<p style="margin:18px 0;"><a href="${safeUrl}" target="_blank" rel="noreferrer" style="display:block;padding:14px 16px;border:1px solid #dbeafe;border-radius:14px;background:#eff6ff;color:#1d4ed8;text-decoration:none;font-weight:700;"><span style="display:block;font-size:12px;color:#60a5fa;margin-bottom:4px;">${badge}</span>${safeLabel}</a></p>`,
      );
    }

    const links = [...(state.links || []), { label, url: normalizedUrl }];
    setLinkLabel("");
    setLinkUrl("");
    onChange({ ...state, links, editorOptions: { ...state.editorOptions, links }, html: sanitizeHtml(previewRef.current?.innerHTML || "") });
  }

  function updateCaption(index: number, caption: string) {
    const photoCaptions = [...state.photoCaptions];
    photoCaptions[index] = caption;
    patch({ photoCaptions, showCaptions: true, editorOptions: { ...state.editorOptions, photoCaptions } });
  }

  return (
    <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-100">
      <div className="flex min-h-14 items-center justify-between border-b border-slate-100 px-4">
        <span className="text-sm font-bold text-slate-400">취소</span>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-black text-slate-950">{state.platform === "tistory" ? "티스토리" : "네이버 블로그"} 글쓰기</p>
          <p className="text-[11px] font-bold text-slate-400">전체 공개</p>
        </div>
        <button type="button" onClick={onSave} disabled={saving} className="text-sm font-black text-blue-600 disabled:opacity-50">
          {saving ? "저장 중" : "저장"}
        </button>
      </div>

      <div className="px-4 py-5">
        <div className="flex gap-2">
          <textarea
            ref={titleRef}
            value={state.selectedTitle}
            onChange={(event) => patch({ selectedTitle: event.target.value })}
            placeholder="제목"
            className="min-h-20 flex-1 resize-none border-b border-slate-100 bg-white py-3 text-center text-3xl font-light leading-tight text-slate-900 outline-none placeholder:text-slate-300 focus:border-blue-300"
          />
          <button type="button" onClick={() => setShowTitleEmoji((value) => !value)} className="mt-3 h-10 w-10 shrink-0 rounded-full bg-blue-50 text-lg" aria-label="제목 이모지">
            😊
          </button>
        </div>

        {showTitleEmoji && <div className="mt-2"><EmojiPicker onSelect={insertTitleEmoji} /></div>}

        {state.titleCandidates.length > 0 && (
          <details className="mt-3 rounded-2xl bg-slate-50 p-3">
            <summary className="cursor-pointer text-xs font-black text-slate-500">추천 제목 보기</summary>
            <div className="mt-2 grid gap-2">
              {state.titleCandidates.map((title) => (
                <button key={title} type="button" onClick={() => patch({ selectedTitle: title })} className={`rounded-2xl px-4 py-3 text-left text-sm font-bold ${state.selectedTitle === title ? "bg-blue-600 text-white" : "bg-white text-slate-700"}`}>
                  {title}
                </button>
              ))}
            </div>
          </details>
        )}

        {onRecommendTitles && (
          <button type="button" onClick={onRecommendTitles} disabled={titleLoading} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl bg-blue-50 px-3 text-xs font-bold text-blue-700 disabled:opacity-60">
            {titleLoading ? <Loader2 className="animate-spin" size={15} aria-hidden="true" /> : <RefreshCw size={15} aria-hidden="true" />}
            제목 다시 추천
          </button>
        )}

        <button type="button" onClick={() => setActivePanel("insert")} className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-400">
          <span className="text-lg">⌖</span>
          위치/링크 추가
        </button>

        <div
          ref={previewRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={syncHtml}
          className="mt-4 min-h-[440px] bg-white text-lg leading-9 text-slate-700 outline-none empty:before:text-slate-300 empty:before:content-['본문을_입력하거나_AI_초안을_다듬어보세요'] focus:ring-0"
          style={{ fontFamily: fontMap[state.fontFamily] || fontMap.기본, fontSize: sizeMap[state.fontSize] || sizeMap.기본, textAlign: state.textAlign }}
        />
      </div>

      {photos.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xs font-black text-slate-500">사진 설명</p>
          <div className="mt-2 grid gap-2">
            {photos.map((url, index) => (
              <label key={`${url}-${index}`} className="grid grid-cols-[52px_1fr] gap-3 rounded-2xl bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`사진 ${index + 1}`} className="h-13 w-13 rounded-xl object-cover" />
                <span>
                  <span className="block text-[11px] font-bold text-slate-400">{index === 0 ? "대표 이미지" : `사진 ${index + 1}`}</span>
                  <input value={state.photoCaptions[index] || "사진 설명 추가"} onChange={(event) => updateCaption(index, event.target.value)} className="mt-1 h-9 w-full rounded-xl bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-400" />
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 bg-white">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] items-center gap-1 px-3 py-2">
          <IconTool label="📷" title="사진" onClick={onRegenerateLayout} />
          <IconTool label="T" title="글자" active={activePanel === "format"} onClick={() => setActivePanel(activePanel === "format" ? "none" : "format")} />
          <IconTool label="☰" title="정렬" onClick={() => command("justifyLeft")} />
          <IconTool label="😊" title="이모지" active={activePanel === "emoji"} onClick={() => setActivePanel(activePanel === "emoji" ? "none" : "emoji")} />
          <IconTool label="•••" title="추가" active={activePanel === "insert"} onClick={() => setActivePanel(activePanel === "insert" ? "none" : "insert")} />
          <button type="button" onClick={onSave} disabled={saving} className="px-3 text-sm font-black text-blue-600 disabled:opacity-50">저장</button>
        </div>

        {activePanel === "format" && (
          <div className="border-t border-slate-100 px-3 py-3">
            <div className="flex items-center gap-3 overflow-x-auto pb-1 text-sm font-bold text-slate-600">
              <select value={state.fontFamily} onChange={(event) => patch({ fontFamily: event.target.value })} className="h-10 rounded-xl bg-slate-50 px-3 outline-none">
                {fontOptions.map((font) => <option key={font} value={font}>{font}</option>)}
              </select>
              <select value={state.fontSize} onChange={(event) => patch({ fontSize: event.target.value })} className="h-10 rounded-xl bg-slate-50 px-3 outline-none">
                {sizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              <button type="button" onClick={() => command("bold")} className="h-10 min-w-10 rounded-xl bg-slate-50 text-xl font-black">B</button>
              <button type="button" onClick={() => command("underline")} className="h-10 min-w-10 rounded-xl bg-slate-50 text-xl font-black underline">U</button>
              <button type="button" onClick={() => command("foreColor", "#2563eb")} className="h-10 min-w-10 rounded-xl bg-blue-50 text-blue-600">●</button>
              <button type="button" onClick={() => command("hiliteColor", "#fef08a")} className="h-10 min-w-10 rounded-xl bg-yellow-100 text-yellow-700">▬</button>
              <button type="button" onClick={() => command("formatBlock", "h2", "소제목으로 만들 문장을 선택해주세요")} className="h-10 min-w-16 rounded-xl bg-slate-50 text-xs font-black">소제목</button>
            </div>
          </div>
        )}

        {activePanel === "emoji" && <div className="border-t border-slate-100 px-3 py-3"><EmojiPicker onSelect={insertBodyEmoji} /></div>}

        {activePanel === "insert" && (
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
            <div className="grid grid-cols-4 gap-3 text-center text-xs font-bold text-slate-600">
              <InsertTool icon="⌖" label="장소" onClick={() => setLinkKind("map")} active={linkKind === "map"} />
              <InsertTool icon="😊" label="스티커" onClick={() => setActivePanel("emoji")} />
              <InsertTool icon="🔗" label="링크" onClick={() => setLinkKind("link")} active={linkKind === "link"} />
              <InsertTool icon="▶" label="유튜브" onClick={() => setLinkKind("youtube")} active={linkKind === "youtube"} />
              <InsertTool icon="❝" label="인용구" onClick={insertQuote} />
              <InsertTool icon="—" label="구분선" onClick={insertDivider} />
              <InsertTool icon="Aa" label="맞춤법" onClick={() => window.alert("맞춤법 검사는 다음 Sprint에서 연결할 예정이에요.")} />
              <InsertTool icon="▤" label="템플릿" onClick={() => window.alert("템플릿은 다음 Sprint에서 연결할 예정이에요.")} />
            </div>
            <div className="mt-4 rounded-2xl bg-white p-3">
              <p className="text-xs font-black text-slate-500">{linkKind === "map" ? "지도 URL" : linkKind === "youtube" ? "유튜브 URL" : "링크 URL"}</p>
              <input value={linkLabel} onChange={(event) => setLinkLabel(event.target.value)} placeholder="표시할 문구" className="mt-2 h-10 w-full rounded-xl bg-slate-50 px-3 text-sm outline-none focus:ring-1 focus:ring-blue-400" />
              <input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https:// 또는 지도/유튜브 URL" className="mt-2 h-10 w-full rounded-xl bg-slate-50 px-3 text-sm outline-none focus:ring-1 focus:ring-blue-400" />
              <button type="button" onClick={insertLink} className="mt-2 min-h-10 w-full rounded-xl bg-blue-600 text-sm font-black text-white">본문에 추가</button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-2 border-t border-slate-100 bg-white p-4">
        <button type="button" onClick={onPolish} disabled={polishing} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-4 text-sm font-bold text-blue-700 disabled:opacity-60">
          {polishing ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Wand2 size={17} aria-hidden="true" />}
          AI가 보기 좋게 꾸미기
        </button>
        <button type="button" onClick={onPublishReview} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white">
          <Send size={17} aria-hidden="true" />
          발행 전 검수
        </button>
      </div>
    </section>
  );
}

function IconTool({ label, title, active = false, onClick }: { label: string; title: string; active?: boolean; onClick?: () => void }) {
  return <button type="button" title={title} onClick={onClick} className={`flex min-h-11 items-center justify-center rounded-xl text-xl font-black ${active ? "bg-blue-50 text-blue-600" : "text-slate-900"}`}>{label}</button>;
}

function InsertTool({ icon, label, active = false, onClick }: { icon: string; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl px-2 py-3 ${active ? "bg-blue-50 text-blue-700" : "bg-white text-slate-600"}`}>
      <span className="block text-2xl leading-none">{icon}</span>
      <span className="mt-2 block">{label}</span>
    </button>
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
