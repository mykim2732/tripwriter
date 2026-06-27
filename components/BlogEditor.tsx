"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  AtSign,
  Bold,
  Camera,
  CheckCircle2,
  FilePlus2,
  Highlighter,
  Italic,
  Link2,
  Loader2,
  MapPin,
  MessageSquareQuote,
  MoreHorizontal,
  Palette,
  Pilcrow,
  RefreshCw,
  Save,
  Send,
  SeparatorHorizontal,
  Smile,
  Sparkles,
  SpellCheck,
  Sticker,
  Strikethrough,
  Type,
  Underline,
  Wand2,
  PlayCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EmojiPicker } from "@/components/EmojiPicker";
import type { BlogEditorState } from "@/types/editor";

const fontOptions = ["기본", "Pretendard", "Noto Sans KR", "나눔고딕", "나눔명조", "감성 손글씨", "귀여운 손글씨", "담백한 손글씨", "카페 감성", "문서형"];
const sizeOptions = ["작게", "기본", "크게", "아주 크게"];
const pointIcons = ["✅", "⭐", "🔥", "📌", "💡", "✨", "📝", "👍", "❤️", "🌿"];
const textColors = ["#111827", "#374151", "#6b7280", "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#2563eb", "#4f46e5", "#7c3aed", "#9333ea", "#c026d3", "#db2777", "#e11d48", "#7f1d1d", "#78350f", "#365314", "#064e3b", "#164e63", "#1e3a8a", "#312e81", "#581c87", "#831843", "#000000"];
const highlightColors = ["#fef08a", "#fde68a", "#fed7aa", "#fecdd3", "#fbcfe8", "#ddd6fe", "#c7d2fe", "#bfdbfe", "#bae6fd", "#a7f3d0", "#bbf7d0", "#d9f99d"];

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

const selectionSizeMap: Record<string, string> = {
  작게: "0.9em",
  기본: "1em",
  크게: "1.16em",
  "아주 크게": "1.32em",
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

type Panel = "none" | "text" | "align" | "emoji" | "more";

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
  const titleRef = useRef<HTMLInputElement | null>(null);
  const [activePanel, setActivePanel] = useState<Panel>("none");
  const [showTitleEmoji, setShowTitleEmoji] = useState(false);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkKind, setLinkKind] = useState<"link" | "map" | "youtube">("link");
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const html = state.html || buildEditorHtml(state);

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

  function applySelectionSize(size: string) {
    if (!hasSelection()) {
      window.alert("크기를 바꿀 문장을 먼저 선택해주세요");
      return;
    }
    document.execCommand("fontSize", false, "4");
    previewRef.current?.querySelectorAll("font[size='4']").forEach((node) => {
      const span = document.createElement("span");
      span.style.fontSize = selectionSizeMap[size] || "1em";
      span.innerHTML = node.innerHTML;
      node.replaceWith(span);
    });
    syncHtml();
  }

  function setBlock(block: "h2" | "p") {
    command("formatBlock", block, block === "h2" ? "소제목으로 만들 문장을 선택해주세요" : "일반 문단으로 바꿀 문장을 선택해주세요");
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
    previewRef.current?.focus();
    document.execCommand("insertText", false, emoji);
    syncHtml();
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
    const badge = linkKind === "map" ? "지도" : linkKind === "youtube" ? "YouTube" : "링크";
    previewRef.current?.focus();

    if (hasSelection()) {
      document.execCommand("createLink", false, normalizedUrl);
    } else {
      document.execCommand(
        "insertHTML",
        false,
        `<p style="margin:18px 0;"><a href="${safeUrl}" target="_blank" rel="noreferrer" style="display:block;padding:14px 16px;border:1px solid #dbeafe;border-radius:14px;background:#eff6ff;color:#1d4ed8;text-decoration:none;font-weight:700;"><span style="display:block;font-size:12px;color:#60a5fa;margin-bottom:4px;">${badge}</span>${safeLabel}</a></p>`,
      );
    }

    const links = [...(state.links || []), { label, url: normalizedUrl, type: linkKind }].slice(0, 5);
    setLinkLabel("");
    setLinkUrl("");
    onChange({ ...state, links, editorOptions: { ...state.editorOptions, links }, html: sanitizeHtml(previewRef.current?.innerHTML || "") });
  }

  function rememberColor(color: string) {
    setRecentColors((current) => [color, ...current.filter((item) => item !== color)].slice(0, 8));
  }

  function removeLink(index: number) {
    const links = (state.links || []).filter((_, linkIndex) => linkIndex !== index);
    patch({ links, editorOptions: { ...state.editorOptions, links } });
  }

  function updateLink(index: number, field: "label" | "url", value: string) {
    const links = [...(state.links || [])];
    const current = links[index];
    if (!current) return;
    links[index] = { ...current, [field]: value };
    patch({ links, editorOptions: { ...state.editorOptions, links } });
  }

  function updatePointIcon(icon: string) {
    patch({ pointIcon: icon, editorOptions: { ...state.editorOptions, pointIcon: icon } });
  }

  function saveNow() {
    syncHtml();
    void onSave?.();
  }

  const platformTitle = state.platform === "threads" ? "스레드" : state.platform === "tistory" ? "티스토리" : "네이버 블로그";

  return (
    <section className="min-h-[calc(100vh-24px)] overflow-hidden bg-white shadow-sm ring-1 ring-slate-100 sm:rounded-[28px]">
      <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between border-b border-slate-100 bg-white/95 px-4 backdrop-blur">
        <button type="button" onClick={() => window.history.back()} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500" aria-label="뒤로가기">
          <ArrowLeft size={21} aria-hidden="true" />
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-black text-slate-950">{platformTitle} · 전체</p>
          <p className="text-[11px] font-bold text-slate-400">AI 콘텐츠 스튜디오</p>
        </div>
        <button type="button" onClick={saveNow} disabled={saving} className="min-w-10 text-sm font-black text-blue-600 disabled:text-slate-300">
          {saving ? "저장중" : "저장"}
        </button>
      </header>

      <div className="px-5 pb-28 pt-6">
        <div className="flex items-start gap-2 border-b border-slate-100 pb-4">
          <input
            ref={titleRef}
            value={state.selectedTitle}
            onChange={(event) => patch({ selectedTitle: event.target.value })}
            placeholder="제목"
            className="min-h-12 flex-1 bg-white text-center text-4xl font-light tracking-normal text-slate-900 outline-none placeholder:text-slate-300"
          />
          <button type="button" onClick={() => setShowTitleEmoji((value) => !value)} className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600" aria-label="제목 이모지">
            <Smile size={19} aria-hidden="true" />
          </button>
        </div>

        {showTitleEmoji && (
          <div className="mt-3 rounded-3xl border border-slate-100 bg-white p-3 shadow-sm">
            <EmojiPicker onSelect={insertTitleEmoji} />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-400">
          <button type="button" onClick={() => { setLinkKind("map"); setActivePanel("more"); }} className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-2">
            <MapPin size={15} aria-hidden="true" /> 위치 추가
          </button>
          <button type="button" onClick={() => { setLinkKind("link"); setActivePanel("more"); }} className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-2">
            <Link2 size={15} aria-hidden="true" /> 링크 추가
          </button>
          {onRecommendTitles && (
            <button type="button" onClick={onRecommendTitles} disabled={titleLoading} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-2 text-blue-700 disabled:opacity-60">
              {titleLoading ? <Loader2 className="animate-spin" size={15} aria-hidden="true" /> : <RefreshCw size={15} aria-hidden="true" />}
              다시 추천
            </button>
          )}
        </div>

        {state.titleCandidates.length > 0 && (
          <details className="mt-3 rounded-2xl bg-slate-50 p-3">
            <summary className="cursor-pointer text-xs font-black text-slate-500">추천 제목</summary>
            <div className="mt-2 grid gap-2">
              {state.titleCandidates.map((title) => (
                <button key={title} type="button" onClick={() => patch({ selectedTitle: title })} className={`rounded-2xl px-4 py-3 text-left text-sm font-bold leading-6 ${state.selectedTitle === title ? "bg-blue-600 text-white" : "bg-white text-slate-700"}`}>
                  {title}
                </button>
              ))}
            </div>
          </details>
        )}

        {state.links && state.links.length > 0 && (
          <div className="mt-5 space-y-2">
            {state.links.map((link, index) => (
              <div key={`${link.url}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-blue-700">{link.type === "map" ? "📍 지도" : link.type === "youtube" ? "▶ 유튜브" : "🔗 링크"}</span>
                  <button type="button" onClick={() => removeLink(index)} className="text-xs font-black text-slate-400">삭제</button>
                </div>
                <input value={link.label} onChange={(event) => updateLink(index, "label", event.target.value)} className="h-9 w-full rounded-xl bg-white px-3 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-blue-400" placeholder="링크 이름" />
                <input value={link.url} onChange={(event) => updateLink(index, "url", event.target.value)} className="mt-2 h-9 w-full rounded-xl bg-white px-3 text-xs text-slate-600 outline-none focus:ring-1 focus:ring-blue-400" placeholder="URL" />
              </div>
            ))}
          </div>
        )}
        <div
          ref={previewRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncHtml}
          onBlur={syncHtml}
          className="publish-preview mt-8 min-h-[58vh] bg-white text-lg leading-9 text-slate-700 outline-none empty:before:text-slate-300 empty:before:content-['지금_블로그는_#모두의회고_프로젝트_중!'] focus:ring-0"
          style={{ fontFamily: fontMap[state.fontFamily] || fontMap.기본, fontSize: sizeMap[state.fontSize] || sizeMap.기본, textAlign: state.textAlign }}
        />
      </div>

      <footer className="sticky bottom-0 z-30 border-t border-slate-100 bg-white/95 backdrop-blur">
        {activePanel !== "none" && (
          <div className="border-b border-slate-100 bg-white px-3 py-3">
            {activePanel === "text" && <TextPanel state={state} patch={patch} command={command} setBlock={setBlock} applySelectionSize={applySelectionSize} updatePointIcon={updatePointIcon} recentColors={recentColors} rememberColor={rememberColor} />}
            {activePanel === "align" && <AlignPanel state={state} patch={patch} />}
            {activePanel === "emoji" && <EmojiPicker onSelect={insertBodyEmoji} />}
            {activePanel === "more" && (
              <MorePanel
                linkKind={linkKind}
                setLinkKind={setLinkKind}
                linkLabel={linkLabel}
                setLinkLabel={setLinkLabel}
                linkUrl={linkUrl}
                setLinkUrl={setLinkUrl}
                insertLink={insertLink}
                insertQuote={insertQuote}
                insertDivider={insertDivider}
                setActivePanel={setActivePanel}
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] items-center gap-1 px-3 py-2">
          <ToolbarButton icon={<Camera size={23} />} label="사진" onClick={onRegenerateLayout} />
          <ToolbarButton icon={<Type size={24} />} label="글자" active={activePanel === "text"} onClick={() => setActivePanel(activePanel === "text" ? "none" : "text")} />
          <ToolbarButton icon={<AlignLeft size={24} />} label="정렬" active={activePanel === "align"} onClick={() => setActivePanel(activePanel === "align" ? "none" : "align")} />
          <ToolbarButton icon={<Smile size={24} />} label="이모지" active={activePanel === "emoji"} onClick={() => setActivePanel(activePanel === "emoji" ? "none" : "emoji")} />
          <ToolbarButton icon={<MoreHorizontal size={27} />} label="더보기" active={activePanel === "more"} onClick={() => setActivePanel(activePanel === "more" ? "none" : "more")} />
          <button type="button" onClick={saveNow} disabled={saving} className="flex h-11 min-w-12 items-center justify-center rounded-xl text-blue-600 disabled:text-slate-300" aria-label="저장">
            {saving ? <Loader2 className="animate-spin" size={22} aria-hidden="true" /> : <Save size={22} aria-hidden="true" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 px-3 py-3">
          <button type="button" onClick={onPolish} disabled={polishing} className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-blue-50 px-3 text-sm font-black text-blue-700 disabled:opacity-60">
            {polishing ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Wand2 size={17} aria-hidden="true" />}
            AI 디자이너
          </button>
          <button type="button" onClick={onPublishReview} className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-3 text-sm font-black text-white">
            <Send size={17} aria-hidden="true" />
            발행 검수
          </button>
        </div>
      </footer>
    </section>
  );
}

function TextPanel({
  state,
  patch,
  command,
  setBlock,
  applySelectionSize,
  updatePointIcon,
  recentColors,
  rememberColor,
}: {
  state: BlogEditorState;
  patch: (patchState: Partial<BlogEditorState>) => void;
  command: (name: string, value?: string, message?: string) => void;
  setBlock: (block: "h2" | "p") => void;
  applySelectionSize: (size: string) => void;
  updatePointIcon: (icon: string) => void;
  recentColors: string[];
  rememberColor: (color: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="px-1 text-[11px] font-bold text-slate-400">문장을 선택하고 누르면 선택한 부분에만 적용돼요.</p>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <ChipButton onClick={() => setBlock("p")} icon={<Pilcrow size={17} />} label="본문" />
        <ChipButton onClick={() => setBlock("h2")} icon={<Type size={18} />} label="제목" />
        <select value={state.fontFamily} onChange={(event) => patch({ fontFamily: event.target.value })} className="h-10 rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none">
          {fontOptions.map((font) => <option key={font} value={font}>{font}</option>)}
        </select>
        <select value={state.fontSize} onChange={(event) => patch({ fontSize: event.target.value })} className="h-10 rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none">
          {sizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <SquareButton onClick={() => command("bold")} ariaLabel="굵게"><Bold size={20} /></SquareButton>
        <SquareButton onClick={() => command("italic")} ariaLabel="기울임"><Italic size={20} /></SquareButton>
        <SquareButton onClick={() => command("underline")} ariaLabel="밑줄"><Underline size={20} /></SquareButton>
        <SquareButton onClick={() => command("strikeThrough")} ariaLabel="취소선"><Strikethrough size={20} /></SquareButton>
        {recentColors.length > 0 && recentColors.map((color) => <ColorDot key={`recent-${color}`} color={color} onClick={() => { rememberColor(color); command("foreColor", color); }} recent />)}
        {textColors.map((color) => <ColorDot key={color} color={color} onClick={() => { rememberColor(color); command("foreColor", color); }} />)}
        {highlightColors.map((color) => <HighlightDot key={color} color={color} onClick={() => { rememberColor(color); command("hiliteColor", color); }} />)}
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {sizeOptions.map((size) => <ChipButton key={size} onClick={() => applySelectionSize(size)} icon={<Type size={15} />} label={size} />)}
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {pointIcons.map((icon) => <button key={icon} type="button" onClick={() => updatePointIcon(icon)} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ${state.pointIcon === icon ? "bg-blue-600 text-white" : "bg-slate-50"}`}>{icon}</button>)}
      </div>
    </div>
  );
}

function AlignPanel({ state, patch }: { state: BlogEditorState; patch: (patchState: Partial<BlogEditorState>) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <PanelChoice active={state.textAlign === "left"} icon={<AlignLeft size={22} />} label="왼쪽" onClick={() => patch({ textAlign: "left" })} />
      <PanelChoice active={state.textAlign === "center"} icon={<AlignCenter size={22} />} label="가운데" onClick={() => patch({ textAlign: "center" })} />
      <PanelChoice active={state.textAlign === "right"} icon={<AlignRight size={22} />} label="오른쪽" onClick={() => patch({ textAlign: "right" })} />
    </div>
  );
}

function MorePanel({
  linkKind,
  setLinkKind,
  linkLabel,
  setLinkLabel,
  linkUrl,
  setLinkUrl,
  insertLink,
  insertQuote,
  insertDivider,
  setActivePanel,
}: {
  linkKind: "link" | "map" | "youtube";
  setLinkKind: (kind: "link" | "map" | "youtube") => void;
  linkLabel: string;
  setLinkLabel: (value: string) => void;
  linkUrl: string;
  setLinkUrl: (value: string) => void;
  insertLink: () => void;
  insertQuote: () => void;
  insertDivider: () => void;
  setActivePanel: (panel: Panel) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3 text-center text-xs font-bold text-slate-600">
        <MenuTool icon={<MapPin size={25} />} label="장소" onClick={() => setLinkKind("map")} active={linkKind === "map"} />
        <MenuTool icon={<Sticker size={25} />} label="스티커" onClick={() => setActivePanel("emoji")} />
        <MenuTool icon={<Link2 size={25} />} label="링크" onClick={() => setLinkKind("link")} active={linkKind === "link"} />
        <MenuTool icon={<PlayCircle size={25} />} label="유튜브" onClick={() => setLinkKind("youtube")} active={linkKind === "youtube"} />
        <MenuTool icon={<MessageSquareQuote size={25} />} label="인용구" onClick={insertQuote} />
        <MenuTool icon={<SeparatorHorizontal size={25} />} label="구분선" onClick={insertDivider} />
        <MenuTool icon={<SpellCheck size={25} />} label="맞춤법" disabled />
        <MenuTool icon={<FilePlus2 size={25} />} label="템플릿" disabled />
        <MenuTool icon={<AtSign size={25} />} label="첨부파일" disabled />
        <MenuTool icon={<Sparkles size={25} />} label="광고/제휴" disabled />
        <MenuTool icon={<Palette size={25} />} label="사진 꾸미기" disabled />
        <MenuTool icon={<CheckCircle2 size={25} />} label="AI 준비" disabled />
      </div>
      <div className="rounded-2xl bg-slate-50 p-3">
        <p className="text-xs font-black text-slate-500">{linkKind === "map" ? "지도 URL" : linkKind === "youtube" ? "유튜브 URL" : "링크 URL"}</p>
        <input value={linkLabel} onChange={(event) => setLinkLabel(event.target.value)} placeholder="표시할 문구" className="mt-2 h-10 w-full rounded-xl bg-white px-3 text-sm outline-none focus:ring-1 focus:ring-blue-400" />
        <input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https:// 또는 지도/유튜브 URL" className="mt-2 h-10 w-full rounded-xl bg-white px-3 text-sm outline-none focus:ring-1 focus:ring-blue-400" />
        <button type="button" onClick={insertLink} className="mt-2 min-h-10 w-full rounded-xl bg-blue-600 text-sm font-black text-white">본문에 추가</button>
      </div>
    </div>
  );
}

function ToolbarButton({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return <button type="button" title={label} onClick={onClick} className={`flex min-h-11 items-center justify-center rounded-xl ${active ? "bg-blue-50 text-blue-600" : "text-slate-950"}`}>{icon}</button>;
}

function ChipButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex h-10 shrink-0 items-center gap-1 rounded-xl bg-slate-50 px-3 text-xs font-black text-slate-700">{icon}{label}</button>;
}

function SquareButton({ children, ariaLabel, onClick }: { children: React.ReactNode; ariaLabel: string; onClick: () => void }) {
  return <button type="button" aria-label={ariaLabel} onClick={onClick} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-900">{children}</button>;
}

function ColorDot({ color, onClick, recent = false }: { color: string; onClick: () => void; recent?: boolean }) {
  return <button type="button" aria-label="글자색" onClick={onClick} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${recent ? "bg-blue-50" : "bg-slate-50"}`}><span className="h-5 w-5 rounded-full" style={{ backgroundColor: color }} /></button>;
}

function HighlightDot({ color, onClick }: { color: string; onClick: () => void }) {
  return <button type="button" aria-label="형광펜" onClick={onClick} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50"><span className="h-3 w-7 rounded-full" style={{ backgroundColor: color }} /></button>;
}

function PanelChoice({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex min-h-14 flex-col items-center justify-center rounded-2xl text-xs font-black ${active ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600"}`}>{icon}<span className="mt-1">{label}</span></button>;
}

function MenuTool({ icon, label, onClick, active = false, disabled = false }: { icon: React.ReactNode; label: string; onClick?: () => void; active?: boolean; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`relative rounded-2xl px-2 py-3 ${disabled ? "bg-slate-100 text-slate-300" : active ? "bg-blue-50 text-blue-700" : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-100"}`}>
      <span className="flex justify-center">{icon}</span>
      <span className="mt-2 block">{label}</span>
      {disabled && <span className="mt-1 inline-flex rounded-full bg-white px-1.5 py-0.5 text-[9px] font-black text-slate-300">준비중</span>}
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
    const headingText = clean.replace(/^#{1,3}\s+/, "");
    blocks.push(isHeading ? `<h2>${state.emojiHeadings ? `${state.pointIcon || "✨"} ` : ""}${headingText}</h2>` : `<p>${clean}</p>`);
    (placements.get(index) || []).forEach((url) => {
      const photoIndex = photoUrls.indexOf(url);
      const caption = state.photoCaptions[photoIndex] || makeDefaultCaption(photoIndex);
      const decorators = renderPhotoDecorators(state, index);
      blocks.push(`<figure style="margin:24px 0;text-align:center;position:relative;"><div style="position:relative;display:inline-block;max-width:100%;">${decorators}<img src="${escapeAttribute(url)}" alt="${escapeAttribute(caption)}" style="max-width:100%;height:auto;border-radius:14px;box-shadow:0 10px 24px rgba(15,23,42,0.08);" /></div><figcaption contenteditable="true" style="margin-top:8px;color:#94a3b8;font-size:0.86em;text-align:center;outline:none;">${escapeHtml(caption)}</figcaption></figure>`);
    });
  });

  if (paragraphs.length === 0 && photoUrls.length > 0) {
    photoUrls.forEach((url, index) => {
      const caption = state.photoCaptions[index] || makeDefaultCaption(index);
      const decorators = renderPhotoDecorators(state, index);
      blocks.push(`<figure style="margin:24px 0;text-align:center;position:relative;"><div style="position:relative;display:inline-block;max-width:100%;">${decorators}<img src="${escapeAttribute(url)}" alt="${escapeAttribute(caption)}" style="max-width:100%;height:auto;border-radius:14px;box-shadow:0 10px 24px rgba(15,23,42,0.08);" /></div><figcaption contenteditable="true" style="margin-top:8px;color:#94a3b8;font-size:0.86em;text-align:center;outline:none;">${escapeHtml(caption)}</figcaption></figure>`);
    });
  }

  return `<div style="line-height:${state.paragraphSpacing ? "2.05" : "1.85"};color:#1f2937;">${blocks.join("")}</div>`;
}

function makeDefaultCaption(index: number) {
  if (index === 0) return "사진 설명 추가";
  return "사진 설명 추가";
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
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}





function renderPhotoDecorators(state: BlogEditorState, imageIndex: number) {
  const decorators = (state.photoDecorators || []).filter((decorator) => decorator.imageIndex === imageIndex || decorator.imageUrl === state.photoUrls[imageIndex] || decorator.imageUrl === state.localPhotoPreviews?.[imageIndex]);
  return decorators.map((decorator) => {
    if (decorator.type === "maskingTape") {
      return '<span style="position:absolute;left:50%;top:-10px;z-index:2;width:92px;height:22px;transform:translateX(-50%) rotate(-2deg);background:rgba(254,240,138,0.78);border-radius:4px;box-shadow:0 2px 8px rgba(15,23,42,0.08);"></span>';
    }
    const position = decorator.position || "top-left";
    const style = decoratorPositionStyle(position);
    const text = escapeHtml(decorator.text || (decorator.type === "badge" ? "BEST" : "추천"));
    const color = escapeAttribute(decorator.color || "#2563eb");
    return `<span style="${style};z-index:3;display:inline-flex;align-items:center;border-radius:999px;background:${color};color:white;padding:6px 10px;font-size:12px;font-weight:800;box-shadow:0 8px 18px rgba(15,23,42,0.16);">${text}</span>`;
  }).join("");
}

function decoratorPositionStyle(position: string) {
  if (position === "top-right") return "position:absolute;right:10px;top:10px";
  if (position === "bottom-left") return "position:absolute;left:10px;bottom:10px";
  if (position === "bottom-right") return "position:absolute;right:10px;bottom:10px";
  if (position === "center") return "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)";
  return "position:absolute;left:10px;top:10px";
}




function buildDetailEditorHtml(state: BlogEditorState) {
  const photoUrls = state.localPhotoPreviews?.length ? state.localPhotoPreviews : state.photoUrls;
  const detail = state.detailPage;
  const paragraphs = state.content.split(/\n{2,}/).filter((part) => part.trim().length > 0);
  const heroImage = photoUrls[0];
  const benefits = detail?.keyBenefits?.length ? detail.keyBenefits : paragraphs.slice(1, 5).map((item) => stripHeadingText(item)).filter(Boolean).slice(0, 4);
  const cta = detail?.ctaText || "구매하러 가기";
  const heroTitle = escapeHtml(state.selectedTitle || detail?.productName || "상세페이지 초안");
  const subCopy = escapeHtml(paragraphs[0] || detail?.targetCustomer || "상품의 장점과 사용 장면을 한눈에 확인해보세요.");
  const imageSections = photoUrls.slice(1).map((url, index) => {
    const imageIndex = index + 1;
    const caption = state.photoCaptions[imageIndex] || "상품 이미지 설명";
    const decorators = renderPhotoDecorators(state, imageIndex);
    return `<section style="margin:18px 0;padding:18px;border-radius:22px;background:#fff;border:1px solid #e5e7eb;"><figure style="margin:0;text-align:center;"><div style="position:relative;display:inline-block;max-width:100%;">${decorators}<img src="${escapeAttribute(url)}" alt="${escapeAttribute(caption)}" style="max-width:100%;height:auto;border-radius:18px;box-shadow:0 12px 28px rgba(15,23,42,0.10);" /></div><figcaption contenteditable="true" style="margin-top:10px;color:#64748b;font-size:13px;outline:none;">${escapeHtml(caption)}</figcaption></figure></section>`;
  }).join("");
  const benefitCards = benefits.length > 0 ? benefits.map((benefit, index) => `<li style="list-style:none;margin:0;padding:14px;border-radius:16px;background:#eff6ff;color:#1e3a8a;font-weight:800;">${index + 1}. ${escapeHtml(benefit)}</li>`).join("") : "";
  const faqBlocks = detail?.faq?.length ? detail.faq.map((item) => `<details style="margin-top:10px;padding:14px;border-radius:16px;background:#f8fafc;"><summary style="font-weight:800;color:#0f172a;">${escapeHtml(item.question)}</summary><p style="margin:10px 0 0;color:#475569;">${escapeHtml(item.answer)}</p></details>`).join("") : "";
  const hero = `<section style="padding:24px 18px;border-radius:28px;background:linear-gradient(180deg,#eff6ff,#ffffff);text-align:center;">${heroImage ? `<img src="${escapeAttribute(heroImage)}" alt="${heroTitle}" style="width:100%;border-radius:22px;box-shadow:0 16px 34px rgba(37,99,235,0.16);margin-bottom:18px;" />` : ""}<p style="margin:0 0 8px;color:#2563eb;font-size:13px;font-weight:900;">${escapeHtml(detail?.brandName || "AI 상세페이지")}</p><h1 style="margin:0;color:#0f172a;font-size:28px;line-height:1.25;font-weight:900;">${heroTitle}</h1><p style="margin:14px 0 0;color:#475569;line-height:1.75;">${subCopy}</p><div style="display:inline-flex;margin-top:18px;padding:12px 18px;border-radius:999px;background:#2563eb;color:white;font-weight:900;">${escapeHtml(cta)}</div></section>`;
  const problem = `<section style="margin-top:18px;padding:20px;border-radius:24px;background:#f8fafc;"><h2 style="margin:0 0 10px;color:#0f172a;font-size:20px;">💡 이런 분께 추천해요</h2><p style="margin:0;color:#475569;line-height:1.8;white-space:pre-wrap;">${escapeHtml(detail?.targetCustomer || detail?.category || "상품이 필요한 상황을 정리해보세요.")}</p></section>`;
  const benefit = `<section style="margin-top:18px;padding:20px;border-radius:24px;background:#ffffff;border:1px solid #e5e7eb;"><h2 style="margin:0 0 14px;color:#0f172a;font-size:20px;">⭐ 핵심 장점</h2><ul style="display:grid;gap:10px;margin:0;padding:0;">${benefitCards}</ul></section>`;
  const spec = `<section style="margin-top:18px;padding:20px;border-radius:24px;background:#fffbeb;border:1px solid #fde68a;"><h2 style="margin:0 0 10px;color:#92400e;font-size:20px;">📦 구성/배송/주의사항</h2><p style="margin:0;color:#78350f;line-height:1.8;white-space:pre-wrap;">${escapeHtml(detail?.components || detail?.cautions || "구성품, 배송, 주의사항을 입력해 주세요.")}</p></section>`;
  const faq = `<section style="margin-top:18px;padding:20px;border-radius:24px;background:#ffffff;border:1px solid #e5e7eb;"><h2 style="margin:0 0 10px;color:#0f172a;font-size:20px;">FAQ</h2>${faqBlocks || `<p style="margin:0;color:#64748b;line-height:1.8;">자주 묻는 질문은 AI 디자이너가 다음 단계에서 더 정리할 수 있어요.</p>`}</section>`;
  const bottomCta = `<section style="margin-top:18px;padding:22px;border-radius:26px;background:#0f172a;color:white;text-align:center;"><h2 style="margin:0;font-size:22px;">지금 확인해보세요</h2><p style="margin:10px 0 0;color:#cbd5e1;">${escapeHtml(detail?.priceInfo || "혜택과 가격 정보는 입력한 내용 기준으로만 표시됩니다.")}</p><div style="display:inline-flex;margin-top:16px;padding:12px 20px;border-radius:999px;background:#facc15;color:#0f172a;font-weight:900;">${escapeHtml(cta)}</div></section>`;
  return `<div style="font-family:${escapeAttribute(fontMap[state.fontFamily] || fontMap.기본)};font-size:${escapeAttribute(sizeMap[state.fontSize] || sizeMap.기본)};line-height:1.75;color:#1f2937;">${hero}${problem}${benefit}${imageSections}${spec}${faq}${bottomCta}</div>`;
}

function stripHeadingText(value: string) {
  return value.replace(/^#{1,3}\s+/, "").replace(/^[-*]\s+/, "").trim();
}
