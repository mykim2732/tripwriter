import { getBrowserSupabaseClient } from "@/lib/supabase";
import type { ContentPlatform, ContentType } from "@/types/editor";
import type { CreatePostInput, Post, UpdatePostInput } from "@/types/post";

const tableName = "posts";
const photoBucketName = "trip-photos";

const platforms = ["naver", "tistory", "brunch", "instagram", "threads", "wordpress", "general", "review", "detail"] as const;
const contentTypes = ["blog", "instagram", "threads", "review", "diary", "info", "detail"] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function objectArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === "object" && !Array.isArray(item)).map((item) => item as Record<string, unknown>) : [];
}

function resolvePlatform(value: unknown, style: unknown): ContentPlatform {
  const candidate = String(value || "");
  if ((platforms as readonly string[]).includes(candidate)) return candidate as ContentPlatform;
  const styleText = String(style || "").toLowerCase();
  if (styleText.includes("thread")) return "threads";
  if (styleText.includes("tistory")) return "tistory";
  if (styleText.includes("detail")) return "detail";
  if (styleText.includes("review")) return "review";
  return "naver";
}

function resolveContentType(value: unknown, platform: ContentPlatform): ContentType {
  const candidate = String(value || "");
  if ((contentTypes as readonly string[]).includes(candidate)) return candidate as ContentType;
  if (platform === "threads") return "threads";
  if (platform === "detail") return "detail";
  if (platform === "review") return "review";
  return "blog";
}

function normalizeEditorOptions(row: Partial<Post> & Record<string, unknown>) {
  const options = asRecord(row.editor_options);
  const platform = resolvePlatform(options.platform, row.style);
  const contentType = resolveContentType(options.contentType, platform);
  const photoUrls = Array.isArray(row.photo_urls) ? row.photo_urls.map(String) : [];

  return {
    ...options,
    platform,
    contentType,
    selectedTitle: typeof options.selectedTitle === "string" ? options.selectedTitle : String(row.travel_title || row.ai_titles?.[0] || ""),
    titleCandidates: stringArray(options.titleCandidates).length ? stringArray(options.titleCandidates) : (Array.isArray(row.ai_titles) ? row.ai_titles.map(String) : []),
    photoCaptions: stringArray(options.photoCaptions).length ? stringArray(options.photoCaptions) : photoUrls.map((_, index) => index === 0 ? "대표 이미지" : "사진 설명 추가"),
    photoAnalysis: objectArray(options.photoAnalysis),
    coverPhotoUrl: typeof options.coverPhotoUrl === "string" ? options.coverPhotoUrl : photoUrls[0] || "",
    coverReason: typeof options.coverReason === "string" ? options.coverReason : "",
    photoSummary: typeof options.photoSummary === "string" ? options.photoSummary : "",
    imageDecorators: objectArray(options.imageDecorators),
    links: objectArray(options.links),
    attachments: objectArray(options.attachments),
    detailPage: asRecord(options.detailPage),
    reviewPage: asRecord(options.reviewPage),
  };
}

function normalizeEditorOptionsForWrite(input: CreatePostInput | UpdatePostInput) {
  const options = asRecord(input.editor_options);
  if (Object.keys(options).length === 0) return input;
  const normalized = {
    ...options,
    photoCaptions: stringArray(options.photoCaptions),
    photoAnalysis: objectArray(options.photoAnalysis),
    imageDecorators: objectArray(options.imageDecorators),
    links: objectArray(options.links),
    attachments: objectArray(options.attachments),
  };
  return { ...input, editor_options: normalized };
}
const attachmentBucketName = "blog-attachments";

function createStoragePath(file: File) {
  const today = new Date().toISOString().slice(0, 10);
  const randomId = crypto.randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");

  return `guest/${today}/${randomId}-${safeName}`;
}

export async function uploadPostPhotos(files: File[]) {
  const supabase = getBrowserSupabaseClient();
  const uploadedUrls: string[] = [];

  for (const file of files) {
    const path = createStoragePath(file);
    const { error } = await supabase.storage
      .from(photoBucketName)
      .upload(path, file, { upsert: false });

    if (error) {
      console.error(`Photo upload failed: ${file.name}. Check Supabase Storage bucket/RLS policies for trip-photos.`, error);
      continue;
    }

    const { data } = supabase.storage.from(photoBucketName).getPublicUrl(path);
    uploadedUrls.push(data.publicUrl);
  }

  return uploadedUrls;
}

export async function uploadPostAttachments(files: File[]) {
  const supabase = getBrowserSupabaseClient();
  const uploadedUrls: string[] = [];

  for (const file of files) {
    const path = createStoragePath(file);
    const { error } = await supabase.storage
      .from(attachmentBucketName)
      .upload(path, file, { upsert: false });

    if (error) {
      console.error(`Attachment upload failed: ${file.name}. Check Supabase Storage bucket/RLS policies for blog-attachments.`, error);
      continue;
    }

    const { data } = supabase.storage.from(attachmentBucketName).getPublicUrl(path);
    uploadedUrls.push(data.publicUrl);
  }

  return uploadedUrls;
}

export function normalizePost(row: Partial<Post> & Record<string, unknown>): Post {
  return {
    id: String(row.id || ""),
    user_id: String(row.user_id || "guest"),
    travel_title: String(row.travel_title || ""),
    destination: String(row.destination || ""),
    travel_date: String(row.travel_date || ""),
    keywords: String(row.keywords || ""),
    style: String(row.style || ""),
    ai_titles: Array.isArray(row.ai_titles) ? row.ai_titles.map(String) : [],
    content: String(row.content || ""),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    photo_urls: Array.isArray(row.photo_urls) ? row.photo_urls.map(String) : [],
    status:
      row.status === "scheduled" || row.status === "published" || row.status === "failed"
        ? row.status
        : "draft",
    scheduled_at: typeof row.scheduled_at === "string" ? row.scheduled_at : null,
    published_at: typeof row.published_at === "string" ? row.published_at : null,
    naver_post_url: typeof row.naver_post_url === "string" ? row.naver_post_url : null,
    polished_content: typeof row.polished_content === "string" ? row.polished_content : null,
    published_html: typeof row.published_html === "string" ? row.published_html : null,
    editor_options: normalizeEditorOptions(row),
    attachment_urls: Array.isArray(row.attachment_urls) ? row.attachment_urls.map(String) : null,
    html_updated_at: typeof row.html_updated_at === "string" ? row.html_updated_at : null,
    created_at: String(row.created_at || new Date().toISOString()),
  };
}

export async function getPosts() {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => normalizePost(row as Partial<Post> & Record<string, unknown>));
}

export async function getPost(id: string) {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return normalizePost(data as Partial<Post> & Record<string, unknown>);
}

export async function createPost(input: CreatePostInput) {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase
    .from(tableName)
    .insert(normalizeEditorOptionsForWrite(input) as CreatePostInput)
    .select("*")
    .single();

  if (error) throw error;
  return normalizePost(data as Partial<Post> & Record<string, unknown>);
}

export async function updatePost(id: string, input: UpdatePostInput) {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase
    .from(tableName)
    .update(normalizeEditorOptionsForWrite(input) as UpdatePostInput)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return normalizePost(data as Partial<Post> & Record<string, unknown>);
}

export async function deletePost(id: string) {
  const supabase = getBrowserSupabaseClient();
  const { error } = await supabase.from(tableName).delete().eq("id", id);

  if (error) throw error;
  return true;
}


