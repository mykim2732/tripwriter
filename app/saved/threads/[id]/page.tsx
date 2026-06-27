"use client";

import { ArrowLeft, Clipboard, Loader2, Save, Send, SmilePlus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EmojiPicker } from "@/components/EmojiPicker";
import { PageShell } from "@/components/PageShell";
import { createEditorPhoto, defaultCaption, PhotoManager } from "@/components/PhotoManager";
import { getPost, updatePost, uploadPostPhotos } from "@/lib/posts";
import type { EditorPhoto, ImageDecorator } from "@/types/editor";
import type { Post } from "@/types/post";

type ThreadEditorOptions = {
  platform?: string;
  hooks?: string[];
  alternatives?: string[];
  photoCaptions?: string[];
  imageDecorators?: ImageDecorator[];
};

const statusLabels: Record<Post["status"], string> = {
  draft: "수정 중",
  scheduled: "예약됨",
  published: "발행됨",
  failed: "발행 실패",
};

export default function ThreadSavedDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [content, setContent] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [hooks, setHooks] = useState<string[]>([]);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [photos, setPhotos] = useState<EditorPhoto[]>([]);
  const [photoCaptions, setPhotoCaptions] = useState<string[]>([]);
  const [photoDecorators, setPhotoDecorators] = useState<ImageDecorator[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  async function loadPost() {
    setLoading(true);
    setError("");
    try {
      const data = await getPost(params.id);
      const options = (data.editor_options || {}) as ThreadEditorOptions;
      setPost(data);
      setContent(data.content || "");
      setTagsText((data.tags || []).map((tag) => `#${tag.replace(/^#/, "")}`).join(" "));
      setHooks(Array.isArray(options.hooks) ? options.hooks.map(String) : data.ai_titles || []);
      setAlternatives(Array.isArray(options.alternatives) ? options.alternatives.map(String) : []);
      setPhotos((data.photo_urls || []).map((url, index) => ({ id: `remote-${index}-${url}`, url, isLocal: false, name: `사진 ${index + 1}` })));
      setPhotoCaptions(Array.isArray(options.photoCaptions) ? options.photoCaptions.map(String) : (data.photo_urls || []).map((_, index) => defaultCaption(index)));
      setPhotoDecorators(Array.isArray(options.imageDecorators) ? options.imageDecorators : []);
    } catch (caught) {
      setError(caught instanceof Error ? `스레드 글을 불러오지 못했어요. ${caught.message}` : "스레드 글을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }

  async function saveThread() {
    if (!post) return;
    setSaving(true);
    try {
      const tags = parseTags(tagsText);
      const photoUpload = await uploadManagedPhotos(photos);
      const updated = await updatePost(post.id, {
        content,
        tags,
        photo_urls: photoUpload.urls,
        editor_options: {
          ...(post.editor_options || {}),
          platform: "threads",
          hooks,
          alternatives,
          photoCaptions,
          imageDecorators: photoDecorators,
        },
      });
      setPost(updated);
      setPhotos(photoUpload.urls.map((url, index) => ({ id: `remote-${index}-${url}`, url, isLocal: false, name: photos[index]?.name || `사진 ${index + 1}` })));
      showToast(photoUpload.failedCount > 0 ? "일부 사진 업로드에 실패했지만 저장했어요." : "스레드 글을 저장했어요.");
    } catch (caught) {
      showToast(caught instanceof Error ? `저장에 실패했어요. ${caught.message}` : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  async function copyThread() {
    await navigator.clipboard.writeText(`${content}\n\n${tagsText}`.trim());
    showToast("스레드 문구를 복사했어요.");
  }

  function insertEmoji(emoji: string) {
    const start = bodyRef.current?.selectionStart ?? content.length;
    const end = bodyRef.current?.selectionEnd ?? content.length;
    const next = `${content.slice(0, start)}${emoji}${content.slice(end)}`;
    setContent(next);
    window.requestAnimationFrame(() => {
      bodyRef.current?.focus();
      bodyRef.current?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  function addPhotos(files: File[]) {
    const available = Math.max(0, 4 - photos.length);
    const added = files.slice(0, available).map(createEditorPhoto);
    setPhotos((current) => [...current, ...added]);
    setPhotoCaptions((current) => [...current, ...added.map((_, index) => defaultCaption(current.length + index))]);
    if (files.length > available) showToast("스레드는 4장까지 미리보기로 보여드려요.");
  }

  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index));
    setPhotoCaptions((current) => current.filter((_, captionIndex) => captionIndex !== index));
    setPhotoDecorators((current) => current.filter((decorator) => decorator.imageIndex !== index).map((decorator) => typeof decorator.imageIndex === "number" && decorator.imageIndex > index ? { ...decorator, imageIndex: decorator.imageIndex - 1 } : decorator));
  }

  function movePhoto(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= photos.length) return;
    setPhotos((current) => moveItem(current, fromIndex, toIndex));
    setPhotoCaptions((current) => moveItem(current, fromIndex, toIndex));
    setPhotoDecorators((current) => remapDecorators(current, fromIndex, toIndex));
  }

  function changeCaption(index: number, caption: string) {
    setPhotoCaptions((current) => {
      const next = [...current];
      next[index] = caption;
      return next;
    });
  }

  useEffect(() => {
    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  return (
    <PageShell>
      <section className="min-h-screen bg-slate-50 pb-28">
        <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => router.push("/saved")} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700" aria-label="뒤로가기">
              <ArrowLeft size={19} aria-hidden="true" />
            </button>
            <div className="min-w-0 flex-1 text-center">
              <p className="truncate text-xs font-bold text-slate-500">스레드</p>
              <p className="truncate text-sm font-black text-slate-950">SNS 카드 편집</p>
            </div>
            <button type="button" onClick={saveThread} disabled={saving || !post} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white disabled:opacity-50" aria-label="저장">
              {saving ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
            </button>
          </div>
        </header>

        <div className="px-4 py-5">
          {loading && <div className="flex min-h-56 items-center justify-center rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><Loader2 className="animate-spin text-blue-600" size={28} aria-hidden="true" /></div>}

          {!loading && error && (
            <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5 text-rose-700">
              <p className="text-sm font-black">문제가 생겼어요</p>
              <p className="mt-2 text-sm leading-6">{error}</p>
              <button type="button" onClick={loadPost} className="mt-4 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white">다시 불러오기</button>
            </div>
          )}

          {!loading && post && (
            <div className="space-y-4">
              <article className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">T</div>
                    <div>
                      <p className="text-sm font-black text-slate-950">트립라이터</p>
                      <p className="text-xs font-bold text-slate-400">@tripwriter · {statusLabels[post.status] || post.status}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">스레드</span>
                </div>

                <textarea
                  ref={bodyRef}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  className="min-h-52 w-full resize-y rounded-2xl border border-slate-100 bg-slate-50 p-4 text-base leading-8 text-slate-900 outline-none focus:border-blue-400 focus:bg-white"
                />

                {photos.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {photos.slice(0, 4).map((photo) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={photo.id} src={photo.url} alt={photo.name || "스레드 이미지"} className="aspect-square rounded-2xl object-cover" />
                    ))}
                  </div>
                )}

                <input
                  value={tagsText}
                  onChange={(event) => setTagsText(event.target.value)}
                  placeholder="#태그 #수정"
                  className="mt-4 h-11 w-full rounded-2xl bg-blue-50 px-4 text-sm font-bold text-blue-700 outline-none placeholder:text-blue-300"
                />
              </article>

              <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <h2 className="mb-3 text-sm font-black text-slate-950">사진 관리</h2>
                <PhotoManager
                  photos={photos}
                  photoCaptions={photoCaptions}
                  imageDecorators={photoDecorators}
                  onAddPhotos={addPhotos}
                  onRemovePhoto={removePhoto}
                  onMovePhoto={movePhoto}
                  onChangeCaption={changeCaption}
                  onChangeDecorators={setPhotoDecorators}
                  maxPhotos={4}
                  mode="threads"
                />
              </section>

              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setShowEmoji((value) => !value)} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-50 text-sm font-black text-blue-700"><SmilePlus size={17} />이모지</button>
                  <button type="button" onClick={copyThread} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-100 text-sm font-black text-slate-700"><Clipboard size={17} />복사</button>
                  <button type="button" onClick={saveThread} disabled={saving} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-black text-white disabled:opacity-60"><Save size={17} />저장</button>
                </div>
                {showEmoji && <div className="mt-3"><EmojiPicker onSelect={insertEmoji} /></div>}
              </div>

              <ThreadList title="첫 문장 훅" items={hooks} onChange={setHooks} />
              <ThreadList title="대체 문구" items={alternatives} onChange={setAlternatives} />

              <div className="grid gap-2">
                <button type="button" onClick={() => post && router.push(`/publish/${post.id}`)} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white">
                  <Send size={17} aria-hidden="true" />
                  스레드 발행 준비
                </button>
                <button type="button" onClick={copyThread} className="min-h-12 rounded-2xl bg-white px-4 text-sm font-bold text-slate-700 ring-1 ring-slate-100">복사해서 직접 발행하기</button>
              </div>
            </div>
          )}
        </div>
      </section>
      {toast && <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-40px)] max-w-sm -translate-x-1/2 rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-bold text-white shadow-xl">{toast}</div>}
    </PageShell>
  );
}

function ThreadList({ title, items, onChange }: { title: string; items: string[]; onChange: (items: string[]) => void }) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <h2 className="text-sm font-black text-slate-950">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-400">저장된 문구가 없어요.</p>
      ) : (
        <div className="mt-3 grid gap-2">
          {items.slice(0, 3).map((item, index) => (
            <textarea
              key={`${title}-${index}`}
              value={item}
              onChange={(event) => {
                const next = [...items];
                next[index] = event.target.value;
                onChange(next);
              }}
              className="min-h-20 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm leading-6 text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
            />
          ))}
        </div>
      )}
    </section>
  );
}

function parseTags(value: string) {
  return value
    .split(/[\s,]+/)
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 12);
}

async function uploadManagedPhotos(photos: EditorPhoto[]) {
  const localPhotos = photos.filter((photo) => photo.file);
  const uploadedUrls = await uploadPostPhotos(localPhotos.map((photo) => photo.file as File));
  let uploadIndex = 0;
  let failedCount = 0;

  const urls = photos.flatMap((photo) => {
    if (!photo.file) return [photo.url];
    const uploadedUrl = uploadedUrls[uploadIndex];
    uploadIndex += 1;
    if (!uploadedUrl) {
      failedCount += 1;
      return [];
    }
    return [uploadedUrl];
  });

  return { urls, failedCount };
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  if (item === undefined) return items;
  next.splice(toIndex, 0, item);
  return next;
}

function remapDecorators(decorators: ImageDecorator[], fromIndex: number, toIndex: number) {
  return decorators.map((decorator) => {
    if (typeof decorator.imageIndex !== "number") return decorator;
    if (decorator.imageIndex === fromIndex) return { ...decorator, imageIndex: toIndex };
    if (fromIndex < toIndex && decorator.imageIndex > fromIndex && decorator.imageIndex <= toIndex) return { ...decorator, imageIndex: decorator.imageIndex - 1 };
    if (fromIndex > toIndex && decorator.imageIndex >= toIndex && decorator.imageIndex < fromIndex) return { ...decorator, imageIndex: decorator.imageIndex + 1 };
    return decorator;
  });
}

