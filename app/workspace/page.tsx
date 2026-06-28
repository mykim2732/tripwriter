"use client";

import { FolderOpen, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorCard } from "@/components/ErrorCard";
import { PageShell } from "@/components/PageShell";
import { getPosts } from "@/lib/posts";
import type { Post } from "@/types/post";

const platformLabel: Record<string, string> = {
  naver: "네이버",
  tistory: "티스토리",
  threads: "스레드",
  detail: "상세페이지",
  review: "리뷰",
  general: "일반",
};

export default function WorkspacePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        setPosts(await getPosts());
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "워크스페이스를 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const groups = useMemo(() => groupProjects(posts), [posts]);

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-blue-600">Workspace</p>
            <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">프로젝트</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">같은 주제의 블로그, 스레드, 리뷰, 상세페이지를 폴더처럼 관리해요.</p>
          </div>
          <Link href="/write" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm" aria-label="새 콘텐츠">
            <Plus size={22} aria-hidden="true" />
          </Link>
        </div>

        {loading && <div className="flex min-h-52 items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={28} /></div>}
        {!loading && error && (
          <ErrorCard title="?????? ??" message={error} action={<button type="button" onClick={() => window.location.reload()} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white">?? ??</button>} />
        )}
        {!loading && !error && groups.length === 0 && (
          <EmptyState title="?? ????? ???" description="???? ??? ?????? ?? ????." action={<Link href="/write" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">? ??? ???</Link>} />
        )}

        <div className="space-y-4">
          {groups.map((group) => (
            <article key={group.name} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><FolderOpen size={24} /></div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-black text-slate-950">{group.name}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-400">{group.items.length}개 콘텐츠</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {group.items.map((post) => {
                  const platform = getPlatform(post);
                  return (
                    <Link key={post.id} href={platform === "threads" ? `/saved/threads/${post.id}` : `/saved/${post.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900">{post.travel_title || "제목 없음"}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">{platformLabel[platform] || platformLabel.general}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${post.status === "published" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"}`}>{post.status === "published" ? "발행됨" : "수정 중"}</span>
                    </Link>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function groupProjects(posts: Post[]) {
  const map = new Map<string, Post[]>();
  posts.forEach((post) => {
    const key = post.destination?.trim() || post.travel_title?.split(/[|·:-]/)[0]?.trim() || "기타 프로젝트";
    map.set(key, [...(map.get(key) || []), post]);
  });
  return Array.from(map.entries()).map(([name, items]) => ({ name, items })).sort((a, b) => b.items.length - a.items.length);
}

function getPlatform(post: Post) {
  const value = post.editor_options?.platform;
  return typeof value === "string" ? value : post.style === "threads" ? "threads" : "naver";
}
