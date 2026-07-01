"use client";

import { Camera, ChevronDown, ChevronUp, GripVertical, ImagePlus, Loader2, Palette, Pencil, Sparkles, Star, Trash2 } from "lucide-react";
import type { DragEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ImageDecoratorEditor } from "@/components/ImageDecoratorEditor";
import { CreditEmptyCard, isCreditError } from "@/components/CreditEmptyCard";
import { PhotoEditPanel } from "@/components/PhotoEditPanel";
import { loadStoredWatermark, WatermarkOverlay } from "@/components/WatermarkOverlay";
import { authFetch } from "@/lib/auth-fetch";
import type { ContentPlatform, ContentType, EditorPhoto, ImageDecorator, PhotoAnalysis, WatermarkProfile } from "@/types/editor";

type PhotoAnalysisResult = {
  photos: PhotoAnalysis[];
  coverPhotoUrl: string;
  coverReason: string;
  photoOrder: string[];
  summary: string;
};

type Props = {
  photos: EditorPhoto[];
  photoCaptions: string[];
  imageDecorators: ImageDecorator[];
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (index: number) => void;
  onMovePhoto: (fromIndex: number, toIndex: number) => void;
  onChangeCaption: (index: number, caption: string) => void;
  onChangeDecorators: (decorators: ImageDecorator[]) => void;
  onApplyAnalysis?: (result: PhotoAnalysisResult) => void;
  onSetCoverPhoto?: (url: string, reason?: string) => void;
  coverPhotoUrl?: string;
  coverReason?: string;
  photoAnalysis?: PhotoAnalysis[];
  photoSummary?: string;
  maxPhotos?: number;
  mode?: "blog" | "detail" | "threads";
  platform?: ContentPlatform;
  contentType?: ContentType | string;
  context?: {
    title?: string;
    place?: string;
    keywords?: string;
    style?: string;
  };
};

export function PhotoManager({
  photos,
  photoCaptions,
  imageDecorators,
  onAddPhotos,
  onRemovePhoto,
  onMovePhoto,
  onChangeCaption,
  onChangeDecorators,
  onApplyAnalysis,
  onSetCoverPhoto,
  coverPhotoUrl,
  coverReason,
  photoAnalysis = [],
  photoSummary = "",
  maxPhotos,
  mode = "blog",
  platform,
  contentType,
  context,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDecorators, setShowDecorators] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PhotoAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [showReason, setShowReason] = useState(false);
  const [watermark, setWatermark] = useState<WatermarkProfile | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const urls = useMemo(() => photos.map((photo) => photo.url), [photos]);
  const selectedPhoto = photos[selectedIndex] || photos[0];
  const currentCoverUrl = analysisResult?.coverPhotoUrl || coverPhotoUrl || "";
  const currentCoverReason = analysisResult?.coverReason || coverReason || "";
  const effectiveMaxPhotos = maxPhotos || 30;
  const limitText = `${photos.length}/${effectiveMaxPhotos}`;

  useEffect(() => {
    setWatermark(loadStoredWatermark());
  }, []);

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) return;
    const available = Math.max(0, effectiveMaxPhotos - photos.length);
    if (available <= 0) {
      setAnalysisError("한 번에 최대 30장까지 사용할 수 있어요.");
      return;
    }
    onAddPhotos(files.slice(0, available));
    if (files.length > available) setAnalysisError("한 번에 최대 30장까지 사용할 수 있어요.");
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files);
      return;
    }

    const rawIndex = event.dataTransfer.getData("text/photo-index");
    const droppedIndex = rawIndex ? Number(rawIndex) : null;
    if (dragIndex !== null && droppedIndex !== null && Number.isFinite(droppedIndex) && dragIndex !== droppedIndex) {
      onMovePhoto(dragIndex, droppedIndex);
      setSelectedIndex(droppedIndex);
    }
    setDragIndex(null);
  }

  async function analyzePhotos(scope: "featured" | "all" = "featured") {
    if (photos.length === 0) {
      setAnalysisError("분석할 사진을 먼저 추가해주세요.");
      return;
    }

    setAnalyzing(true);
    setAnalysisError("");

    try {
      const targetPhotos = scope === "featured" ? photos.slice(0, 10) : photos;
      const analyzablePhotos = await Promise.all(targetPhotos.map(async (photo) => ({
        url: photo.file ? await fileToDataUrl(photo.file) : photo.url,
        originalUrl: photo.url,
        name: photo.name,
      })));

      const response = await authFetch("/api/analyze-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photos: analyzablePhotos.map((photo) => ({ url: photo.url, name: photo.name })),
          platform: platform || (mode === "threads" ? "threads" : mode === "detail" ? "detail" : "naver"),
          contentType: contentType || mode,
          context: { ...context, analysisScope: scope, totalPhotoCount: photos.length },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "사진 분석에 실패했어요.");

      const rawResult = data as PhotoAnalysisResult;
      const urlMap = new Map(analyzablePhotos.map((photo) => [photo.url, photo.originalUrl]));
      const result: PhotoAnalysisResult = {
        ...rawResult,
        photos: rawResult.photos.map((photo) => ({ ...photo, url: urlMap.get(photo.url) || photo.url })),
        coverPhotoUrl: urlMap.get(rawResult.coverPhotoUrl) || rawResult.coverPhotoUrl,
        photoOrder: rawResult.photoOrder.map((url) => urlMap.get(url) || url),
      };
      setAnalysisResult(result);
      onApplyAnalysis?.(result);
    } catch (caught) {
      setAnalysisError(caught instanceof Error ? caught.message : "사진 분석 중 문제가 생겼어요.");
    } finally {
      setAnalyzing(false);
    }
  }

  function applyRecommendedOrder() {
    const order = analysisResult?.photoOrder || [];
    if (order.length === 0) return;
    order.forEach((url, targetIndex) => {
      const currentIndex = photos.findIndex((photo) => photo.url === url);
      if (currentIndex >= 0 && currentIndex !== targetIndex) onMovePhoto(currentIndex, targetIndex);
    });
  }

  const timelineUrls = analysisResult?.photoOrder?.length ? analysisResult.photoOrder : photos.map((photo) => photo.url);

  return (
    <section className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-3xl border border-dashed p-4 text-center transition ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-blue-200 bg-blue-50/70"
        }`}
      >
        <Camera className="mx-auto text-blue-600" size={26} aria-hidden="true" />
        <p className="mt-2 text-sm font-black text-blue-800">사진을 끌어다 놓거나 눌러서 추가하세요</p>
        <p className="mt-1 text-xs font-bold text-blue-700/70">
          {mode === "threads" ? `스레드 미리보기는 4장 중심, 관리는 ${limitText}장까지 가능해요.` : `현재 ${limitText}장`}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">
            <ImagePlus size={17} aria-hidden="true" />
            사진 추가
          </button>
          <button type="button" onClick={() => analyzePhotos("featured")} disabled={analyzing || photos.length === 0} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-blue-700 ring-1 ring-blue-100 disabled:opacity-50">
            {analyzing ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Sparkles size={17} aria-hidden="true" />}
            AI 사진 분석
          </button>
        </div>
        {photos.length > 10 && (
          <button type="button" onClick={() => analyzePhotos("all")} disabled={analyzing} className="mt-2 min-h-10 w-full rounded-2xl bg-slate-950 px-4 text-xs font-black text-white disabled:opacity-50">
            전체 사진 분석 · {photos.length}장 전체를 분석해요
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {(analysisResult || photoSummary || currentCoverUrl || analysisError) && (
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-950">AI 사진 분석</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{analysisResult?.summary || photoSummary || analysisError || "사진 분위기와 배치를 분석했어요."}</p>
            </div>
            {currentCoverUrl && <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-700">대표사진 추천</span>}
          </div>
          {currentCoverUrl && (
            <div className="mt-3 rounded-2xl bg-blue-50 p-3">
              <p className="text-xs font-black text-blue-700">AI 추천 대표사진</p>
              <button type="button" onClick={() => setShowReason((value) => !value)} className="mt-1 text-xs font-bold text-blue-600">선택 이유 보기</button>
              {showReason && <p className="mt-2 text-xs leading-5 text-blue-700/80">{currentCoverReason || "대표 이미지로 쓰기 좋아 보여요."}</p>}
            </div>
          )}
          {timelineUrls.length > 0 && <PhotoTimeline photos={photos} orderedUrls={timelineUrls} />}
          {analysisResult?.photoOrder?.length ? (
            <button type="button" onClick={applyRecommendedOrder} className="mt-3 min-h-10 w-full rounded-2xl bg-slate-950 px-4 text-sm font-black text-white">
              타임라인 적용
            </button>
          ) : null}
        </div>
      )}

      {photos.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-400">아직 추가한 사진이 없어요.</p>
      ) : (
        <div className="space-y-2">
          {photos.map((photo, index) => {
            const analysis = photoAnalysis.find((item) => item.url === photo.url) || analysisResult?.photos.find((item) => item.url === photo.url);
            const isCover = currentCoverUrl === photo.url;
            return (
              <article
                key={photo.id}
                draggable
                onDragStart={(event) => {
                  setDragIndex(index);
                  event.dataTransfer.setData("text/photo-index", String(index));
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragIndex !== null && dragIndex !== index) onMovePhoto(dragIndex, index);
                  setDragIndex(null);
                }}
                className={`rounded-2xl border bg-white p-3 ${selectedIndex === index ? "border-blue-400 shadow-sm" : "border-slate-100"}`}
              >
                <div className="flex gap-3">
                  <button type="button" onClick={() => setSelectedIndex(index)} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                    <WatermarkOverlay
                      imageUrl={photo.url}
                      alt={photo.name || `사진 ${index + 1}`}
                      watermark={watermark}
                      enabled={watermark ? Boolean(watermark.imageUrl) && (watermark.scope === "all" || (watermark.scope === "cover" && isCover)) : false}
                      compact
                      className="h-full w-full"
                    />
                    {photo.isLocal && <span className="absolute left-1 top-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-black text-white">새 사진</span>}
                    {isCover && <span className="absolute bottom-1 left-1 rounded-full bg-slate-950 px-1.5 py-0.5 text-[10px] font-black text-white">대표</span>}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-black text-slate-500">{photo.name || `사진 ${index + 1}`}</p>
                      <GripVertical className="shrink-0 text-slate-300" size={17} aria-hidden="true" />
                    </div>
                    <input
                      value={photoCaptions[index] || analysis?.caption || defaultCaption(index)}
                      onChange={(event) => onChangeCaption(index, event.target.value)}
                      placeholder="사진 설명 추가"
                      className="mt-2 h-10 w-full rounded-xl bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    {analysis?.shortMemo && <p className="mt-1 text-[11px] font-bold text-blue-500">{analysis.shortMemo}</p>}
                    {analysis?.recommendedUse && <p className="mt-1 text-[11px] font-bold text-slate-400">{analysis.recommendedUse}</p>}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <MiniButton disabled={index === 0} onClick={() => onMovePhoto(index, index - 1)} icon={<ChevronUp size={14} />} label="위" />
                      <MiniButton disabled={index === photos.length - 1} onClick={() => onMovePhoto(index, index + 1)} icon={<ChevronDown size={14} />} label="아래" />
                      <MiniButton onClick={() => { setSelectedIndex(index); setShowDecorators(true); }} icon={<Palette size={14} />} label="꾸미기" />
                      <MiniButton onClick={() => setEditingIndex((current) => current === index ? null : index)} icon={<Pencil size={14} />} label="수정" />
                      <MiniButton onClick={() => onSetCoverPhoto?.(photo.url, "사용자가 직접 대표사진으로 지정했어요.")} icon={<Star size={14} />} label="대표" />
                      <MiniButton danger onClick={() => onRemovePhoto(index)} icon={<Trash2 size={14} />} label="삭제" />
                    </div>
                  </div>
                </div>
                {editingIndex === index && (
                  <div className="mt-3">
                    <PhotoEditPanel
                      photo={photo}
                      index={index}
                      caption={photoCaptions[index] || analysis?.caption || defaultCaption(index)}
                      isCover={isCover}
                      watermark={watermark}
                      onChangeCaption={(caption) => onChangeCaption(index, caption)}
                      onReplacePhoto={(file) => {
                        onRemovePhoto(index);
                        onAddPhotos([file]);
                        setEditingIndex(null);
                      }}
                      onSetCover={() => onSetCoverPhoto?.(photo.url, "사용자가 직접 대표사진으로 지정했어요.")}
                      onToggleWatermarkScope={(scope) => {
                        if (!watermark) return;
                        const next = { ...watermark, scope };
                        setWatermark(next);
                        window.localStorage.setItem("posty-watermark-profile", JSON.stringify(next));
                      }}
                      onOpenDecorators={() => {
                        setSelectedIndex(index);
                        setShowDecorators(true);
                      }}
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {selectedPhoto && showDecorators && (
        <div className="rounded-3xl bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-black text-slate-950">사진 꾸미기</p>
            <button type="button" onClick={() => setShowDecorators(false)} className="text-xs font-black text-slate-400">닫기</button>
          </div>
          <ImageDecoratorEditor
            photoUrls={urls}
            photoCaptions={photoCaptions}
            imageDecorators={imageDecorators}
            onChangeDecorators={onChangeDecorators}
            onChangeCaptions={(captions) => captions.forEach((caption, index) => onChangeCaption(index, caption))}
            mode={mode === "detail" ? "detail" : "blog"}
          />
        </div>
      )}
    </section>
  );
}

function MiniButton({ icon, label, onClick, disabled = false, danger = false }: { icon: ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex min-h-8 items-center gap-1 rounded-xl px-2.5 text-[11px] font-black disabled:opacity-35 ${danger ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600"}`}>
      {icon}
      {label}
    </button>
  );
}

function PhotoTimeline({ photos, orderedUrls }: { photos: EditorPhoto[]; orderedUrls: string[] }) {
  const orderedPhotos = orderedUrls.map((url) => photos.find((photo) => photo.url === url)).filter(Boolean) as EditorPhoto[];
  if (orderedPhotos.length === 0) return null;

  return (
    <div className="mt-3 rounded-3xl bg-slate-50 p-3">
      <p className="text-xs font-black text-slate-500">AI 추천 사진 타임라인</p>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {orderedPhotos.map((photo, index) => (
          <article key={`${photo.url}-${index}`} className="min-w-[104px] rounded-2xl bg-white p-2">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
              <img src={photo.url} alt={photo.name || timelineRole(index, orderedPhotos.length)} className="h-full w-full object-cover" />
            </div>
            <p className="mt-2 text-[11px] font-black text-blue-700">{timelineRole(index, orderedPhotos.length)}</p>
            <p className="mt-0.5 truncate text-[10px] font-bold text-slate-400">{photo.name || `사진 ${index + 1}`}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function timelineRole(index: number, total: number) {
  if (index === 0) return "도착";
  if (index === 1) return "입장";
  if (index === Math.floor(total / 2)) return "메인";
  if (index === total - 1) return "마무리";
  return "디테일";
}

export function defaultCaption(index: number) {
  if (index === 0) return "대표 이미지";
  if (index === 1) return "본문 참고 이미지";
  return "사진 설명 추가";
}

export function createEditorPhoto(file: File): EditorPhoto {
  return {
    id: crypto.randomUUID(),
    url: URL.createObjectURL(file),
    file,
    isLocal: true,
    name: file.name,
  };
}

export function photosFromUrls(urls: string[], names?: string[]): EditorPhoto[] {
  return urls.map((url, index) => ({
    id: `remote-${index}-${url}`,
    url,
    isLocal: false,
    name: names?.[index] || `사진 ${index + 1}`,
  }));
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("파일을 읽지 못했어요."));
    reader.readAsDataURL(file);
  });
}


