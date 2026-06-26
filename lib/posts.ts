import { getBrowserSupabaseClient } from "@/lib/supabase";
import type { CreatePostInput, Post, UpdatePostInput } from "@/types/post";

const tableName = "posts";
const photoBucketName = "trip-photos";
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

export async function getPosts() {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function getPost(id: string) {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Post;
}

export async function createPost(input: CreatePostInput) {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase
    .from(tableName)
    .insert(input)
    .select("*")
    .single();

  if (error) throw error;
  return data as Post;
}

export async function updatePost(id: string, input: UpdatePostInput) {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase
    .from(tableName)
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as Post;
}

export async function deletePost(id: string) {
  const supabase = getBrowserSupabaseClient();
  const { error } = await supabase.from(tableName).delete().eq("id", id);

  if (error) throw error;
  return true;
}

