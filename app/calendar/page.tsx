"use client";

import { CalendarDays, Clock, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorCard } from "@/components/ErrorCard";
import { PageShell } from "@/components/PageShell";
import { getPosts } from "@/lib/posts";
import type { Post } from "@/types/post";

export default function CalendarPage() {
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
        setError(caught instanceof Error ? caught.message : "캘린더를 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const groups = useMemo(() => buildCalendarGroups(posts), [posts]);

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-blue-600">Calendar</p>
            <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">발행 캘린더</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">작성 중인 글과 예약/발행 상태를 날짜별로 확인해요.</p>
          </div>
          <Link href="/write" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm" aria-label="새 콘텐츠"><Plus size={22} /></Link>
        </div>

        {loading && <div className="flex min-h-52 items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={28} /></div>}
        {!loading && error && <ErrorCard title="캘린더 오류" message={error} action={<button type="button" onClick={() => window.location.reload()} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white">다시 시도</button>} />}
        {!loading && !error && posts.length === 0 && <EmptyState title="아직 일정이 없어요" description="글을 만들면 발행 준비 일정으로 볼 수 있어요." action={<Link href="/write" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-black text-white">새 콘텐츠 만들기</Link>} />}

        <div className="space-y-4">
          {groups.map((group) => (
            <section key={group.label} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays size={19} className="text-blue-600" />
                <h2 className="text-base font-black text-slate-950">{group.label}</h2>
              </div>
              <div className="grid gap-2">
                {group.items.map((post) => (
                  <Link key={post.id} href={`/publish/${post.id}`} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">{post.travel_title || "제목 없음"}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-slate-400"><Clock size={12} /> {formatDate(post.scheduled_at || post.published_at || post.created_at)}</p>
                      {getPlatformPostUrl(post) && <p className="mt-1 text-[11px] font-black text-blue-600">발행 URL 저장됨</p>}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${post.status === "published" ? "bg-blue-600 text-white" : post.status === "scheduled" ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-700"}`}>{statusLabel(post.status)}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function buildCalendarGroups(posts: Post[]) {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const scheduled = posts.filter((post) => post.status === "scheduled");
  const published = posts.filter((post) => post.status === "published");
  const drafts = posts.filter((post) => post.status === "draft");
  return [
    { label: "오늘 작성", items: drafts.filter((post) => (post.created_at || "").slice(0, 10) === todayKey).slice(0, 8) },
    { label: "예약 리스트", items: scheduled.slice(0, 12) },
    { label: "최근 발행", items: published.slice(0, 8) },
    { label: "수정 중", items: drafts.slice(0, 12) },
  ].filter((group) => group.items.length > 0);
}

function statusLabel(status: Post["status"]) {
  return status === "published" ? "발행됨" : status === "scheduled" ? "예약됨" : status === "failed" ? "확인 필요" : "수정 중";
}

function formatDate(value?: string | null) {
  if (!value) return "날짜 없음";
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function getPlatformPostUrl(post: Post) {
  const optionUrl = post.editor_options?.platformPostUrl;
  if (typeof optionUrl === "string" && optionUrl) return optionUrl;
  return post.naver_post_url || "";
}
