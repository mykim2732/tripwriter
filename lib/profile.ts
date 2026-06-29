import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ensureProfile, type Profile } from "@/lib/credits";
import { browserSupabase } from "@/lib/supabase";

export type ProfileUpdateInput = {
  display_name?: string;
  avatar_url?: string | null;
  bio?: string | null;
  content_fields?: string[];
  preferred_tone?: string | null;
  onboarding_completed?: boolean;
  profile_completed_at?: string | null;
};

export const contentFieldOptions = ["블로그", "리뷰", "상세페이지", "SNS", "여행", "맛집", "육아", "IT"];
export const toneOptions = ["담백하게", "친근하게", "감성적으로", "전문가처럼", "유쾌하게", "SEO 중심"];

export async function getCurrentProfile(client?: SupabaseClient) {
  const supabase = client || browserSupabase.client;
  const { data } = await supabase.auth.getUser();
  return ensureProfile(data.user, supabase);
}

export async function updateProfile(input: ProfileUpdateInput, client?: SupabaseClient) {
  const supabase = client || browserSupabase.client;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("로그인이 필요해요.");

  const { data, error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function uploadProfileImage(file: File, user?: User | null, client?: SupabaseClient) {
  const supabase = client || browserSupabase.client;
  const currentUser = user || (await supabase.auth.getUser()).data.user;
  if (!currentUser) throw new Error("로그인이 필요해요.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${currentUser.id}/${crypto.randomUUID()}.${safeExt}`;
  const { error } = await supabase.storage.from("profile-images").upload(path, file, {
    upsert: true,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;

  const { data } = supabase.storage.from("profile-images").getPublicUrl(path);
  return data.publicUrl;
}

export function isProfileComplete(profile: Profile | null) {
  if (!profile) return false;
  return Boolean(profile.onboarding_completed || (profile.display_name && profile.content_fields && profile.content_fields.length > 0 && profile.preferred_tone));
}
