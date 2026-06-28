"use client";

import { browserSupabase } from "@/lib/supabase";

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  try {
    const { data } = await browserSupabase.client.auth.getSession();
    const token = data.session?.access_token;
    if (token && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
    }
  } catch (error) {
    console.warn("Auth session lookup failed. Falling back to guest request.", error);
  }

  return fetch(input, { ...init, headers });
}
