"use client";

import Link from "next/link";
import { BarChart3, CalendarClock, CheckCircle2, FolderOpen, Loader2, PenLine, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdSlot } from "@/components/AdSlot";
import { DashboardCard } from "@/components/DashboardCard";
import { PageShell } from "@/components/PageShell";
import { StatsCard } from "@/components/StatsCard";
import { getPosts } from "@/lib/posts";
import type { ContentPlatform } from "@/types/editor";
import type { Post } from "@/types/post";

type AiScore = {
  totalScore?: number;
  seoScore?: number;
  clickScore?: number;
  photoScore?: number;
  empathyScore?: number;
};

const platformLabels: Record<ContentPlatform, string> = {
  naver: "네이버",
  tistory: "티스토리",
  threads: "스레드",
  brunch: "브런치",
  instagram: "인스타",
  wordpress: "워드프레스",
  general: "일반",
  review: "리뷰",
  detail: "상세페이지",
};

const trackedPlatforms: ContentPlatform[] = ["naver", "tistory", "threads", "review"];

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const data = await getPosts();
        setPosts(data);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "대시보드를 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const draftCount = posts.filter((post) => post.status === "draft").length;
    const publishedCount = posts.filter((post) => post.status === "published").length;
    const scheduledCount = posts.filter((post) => post.status === "scheduled").length;
    const thisMonthCreated = posts.filter((post) => isThisMonth(post.created_at)).length;
    const thisMonthPublished = posts.filter((post) => post.published_at && isThisMonth(post.published_at)).length;
    const platformCounts = trackedPlatforms.reduce<Record<ContentPlatform, number>>((acc, platform) => {
      acc[platform] = posts.filter((post) => getPostPlatform(post) === platform).length;
      return acc;
    }, { naver: 0, tistory: 0, threads: 0, review: 0, detail: 0, brunch: 0, instagram: 0, wordpress: 0, general: 0 });
    const aiScores = posts.map(getAiScore).filter((score): score is AiScore => Boolean(score));
    const averageSeo = aiScores.length > 0 ? Math.round(aiScores.reduce((sum, score) => sum + safeScore(score.seoScore), 0) / aiScores.length) : 0;
    const aiUsageCount = posts.filter((post) => post.ai_titles.length > 0 || Boolean(getAiScore(post))).length;
    const mostPlatform = trackedPlatforms.reduce<ContentPlatform>((best, platform) => platformCounts[platform] > platformCounts[best] ? platform : best, "naver");

    return {
      draftCount,
      publishedCount,
      scheduledCount,
      totalCount: posts.length,
      thisMonthCreated,
      thisMonthPublished,
      averageSeo,
      aiUsageCount,
      platformCounts,
      mostPlatform,
    };
  }, [posts]);

  const recentEdited = useMemo(() => sortByDate(posts, (post) => post.html_updated_at || post.created_at).slice(0, 5), [posts]);
  const recentPublished = useMemo(() => sortByDate(posts.filter((post) => post.status === "published"), (post) => post.published_at || post.created_at).slice(0, 5), [posts]);
  const recentAi = useMemo(() => sortByDate(posts.filter((post) => post.ai_titles.length > 0 || Boolean(getAiScore(post))), (post) => post.created_at).slice(0, 5), [posts]);
  const maxPlatformCount = Math.max(1, ...trackedPlatforms.map((platform) => stats.platformCounts[platform]));

  return (
    <PageShell>
      <section className="min-h-screen bg-slate-50 px-5 pb-28 pt-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-blue-600">콘텐츠 대시보드</p>
            <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">오늘의 작업</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">작성 중인 프로젝트와 발행 흐름을 한눈에 확인해요.</p>
          </div>
          <Link href="/write" className="shrink-0 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-sm">
            새 콘텐츠
          </Link>
        </div>

        {loading && (
          <div className="flex min-h-60 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
            <Loader2 className="animate-spin text-blue-600" size={30} aria-hidden="true" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5 text-rose-700">
            <p className="text-sm font-black">대시보드를 불러오지 못했어요</p>
            <p className="mt-2 text-sm leading-6">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <StatsCard label="작성중" value={stats.draftCount} description="이어 쓸 초안" icon={<PenLine size={20} />} />
              <StatsCard label="발행됨" value={stats.publishedCount} description="완료 표시한 글" icon={<CheckCircle2 size={20} />} tone="sky" />
              <StatsCard label="예약" value={stats.scheduledCount} description="예약 대기" icon={<CalendarClock size={20} />} tone="slate" />
              <StatsCard label="전체" value={stats.totalCount} description="총 프로젝트 글" icon={<FolderOpen size={20} />} tone="violet" />
            </div>

            <DashboardCard title="이번달 통계" description="저장된 프로젝트 기준으로 계산해요.">
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="이번달 작성" value={`${stats.thisMonthCreated}개`} />
                <MiniStat label="이번달 발행" value={`${stats.thisMonthPublished}개`} />
                <MiniStat label="AI 사용횟수" value={`${stats.aiUsageCount}회`} />
                <MiniStat label="평균 SEO점수" value={stats.averageSeo > 0 ? `${stats.averageSeo}점` : "분석 전"} />
              </div>
              <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                가장 많이 사용하는 플랫폼: {platformLabels[stats.mostPlatform]}
              </div>
            </DashboardCard>

            <DashboardCard title="플랫폼 비율" description="네이버, 티스토리, 스레드 저장 글 비율이에요.">
              <div className="space-y-3">
                {trackedPlatforms.map((platform) => {
                  const count = stats.platformCounts[platform];
                  const percent = Math.round((count / maxPlatformCount) * 100);
                  return (
                    <div key={platform}>
                      <div className="mb-2 flex items-center justify-between text-sm font-bold">
                        <span className="text-slate-700">{platformLabels[platform]}</span>
                        <span className="text-slate-400">{count}개</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </DashboardCard>

            <DashboardCard title="최근 작업" description="최근 수정, 발행, AI 생성 기록을 빠르게 열어요." action={<BarChart3 className="text-blue-600" size={22} />}>
              <RecentList title="최근 수정" posts={recentEdited} />
              <RecentList title="최근 발행" posts={recentPublished} empty="아직 발행 완료한 글이 없어요." />
              <RecentList title="최근 AI 생성" posts={recentAi} empty="AI 생성 기록이 아직 없어요." />
            </DashboardCard>
          <AdSlot type="banner" title="운영 배너 광고 슬롯" description="대시보드 하단 배너 광고 위치입니다. AdSense 또는 Kakao AdFit 연결을 준비합니다." />
          </div>
        )}
      </section>
    </PageShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function RecentList({ title, posts, empty = "표시할 작업이 없어요." }: { title: string; posts: Post[]; empty?: string }) {
  return (
    <div className="mt-4 first:mt-0">
      <h3 className="mb-2 text-sm font-black text-slate-950">{title}</h3>
      {posts.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-400">{empty}</p>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => {
            const platform = getPostPlatform(post);
            return (
              <Link key={`${title}-${post.id}`} href={platform === "threads" ? `/saved/threads/${post.id}` : `/saved/${post.id}`} className="block rounded-2xl bg-slate-50 px-4 py-3 transition active:scale-[0.99]">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">{post.travel_title || post.ai_titles[0] || getProjectName(post)}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">{platformLabels[platform]} · {statusLabel(post.status)}</p>
                  </div>
                  <Sparkles className="shrink-0 text-blue-500" size={17} aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getPostPlatform(post: Post): ContentPlatform {
  const optionPlatform = post.editor_options?.platform;
  if (isContentPlatform(optionPlatform)) return optionPlatform;
  if (post.style === "threads") return "threads";
  if (post.style?.toLowerCase().includes("tistory")) return "tistory";
  return "naver";
}

function getProjectName(post: Post) {
  return post.destination || post.travel_title || post.keywords.split(",")[0]?.trim() || "기타 프로젝트";
}

function getAiScore(post: Post): AiScore | null {
  const score = post.editor_options?.aiScore;
  if (!score || typeof score !== "object" || Array.isArray(score)) return null;
  return score as AiScore;
}

function isContentPlatform(value: unknown): value is ContentPlatform {
  return ["naver", "tistory", "threads", "detail", "review", "brunch", "instagram", "wordpress", "general"].includes(String(value));
}

function isThisMonth(dateValue: string) {
  const date = new Date(dateValue);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function safeScore(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function sortByDate(posts: Post[], getDate: (post: Post) => string | null) {
  return [...posts].sort((a, b) => new Date(getDate(b) || 0).getTime() - new Date(getDate(a) || 0).getTime());
}

function statusLabel(status: Post["status"]) {
  if (status === "draft") return "수정 중";
  if (status === "scheduled") return "예약됨";
  if (status === "published") return "발행됨";
  return "발행 실패";
}



