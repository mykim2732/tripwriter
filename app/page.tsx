"use client";

import Link from "next/link";
import {
  BarChart3,
  BookOpenText,
  Camera,
  FileText,
  Globe2,
  Loader2,
  MessageCircle,
  PenLine,
  Plus,
  ReceiptText,
  Search,
  Star,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { getPosts } from "@/lib/posts";
import type { ContentPlatform } from "@/types/editor";
import type { Post } from "@/types/post";

const platforms = [
  {
    key: "naver",
    title: "네이버 블로그",
    description: "검색과 사진 흐름에 맞춘 긴 글",
    icon: Search,
    active: true,
  },
  {
    key: "tistory",
    title: "티스토리",
    description: "정보성·구조화 중심의 긴 글",
    icon: FileText,
    active: true,
  },
  {
    key: "threads",
    title: "스레드",
    description: "짧고 공감 가는 대화형 글",
    icon: MessageCircle,
    active: true,
  },
  {
    key: "detail",
    title: "상세페이지 만들기",
    description: "상품 사진과 장점만 넣으면 판매용 상세페이지 초안",
    icon: ReceiptText,
    active: true,
  },
  {
    key: "review",
    title: "리뷰 작성",
    description: "상품 사진만 넣으면 구매후기와 리뷰글을 만들어드려요.",
    icon: Star,
    active: true,
  },
  {
    key: "brunch",
    title: "브런치",
    description: "에세이처럼 자연스러운 문장",
    icon: BookOpenText,
    active: false,
  },
  {
    key: "instagram",
    title: "인스타그램",
    description: "짧은 캡션과 해시태그",
    icon: Camera,
    active: false,
  },
  {
    key: "wordpress",
    title: "워드프레스",
    description: "SEO와 구조화 중심 글",
    icon: Globe2,
    active: false,
  },
  {
    key: "general",
    title: "일반 글쓰기",
    description: "플랫폼 상관없이 자유롭게",
    icon: PenLine,
    active: false,
  },
];

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

const statusLabels: Record<Post["status"], string> = {
  draft: "수정중",
  scheduled: "예약됨",
  published: "발행됨",
  failed: "발행 실패",
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    async function loadRecentPosts() {
      try {
        const data = await getPosts();
        setPosts(data.slice(0, 5));
      } catch (caught) {
        console.error("Recent projects load failed", caught);
      } finally {
        setLoadingRecent(false);
      }
    }

    loadRecentPosts();
  }, []);

  const recentProjects = useMemo(() => posts.slice(0, 5), [posts]);

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-8">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <p className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            AI 콘텐츠 스튜디오
          </p>
          <h1 className="text-4xl font-black tracking-normal text-slate-950">
            Posty AI
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            사진과 키워드만 넣으면 블로그, 스레드, 상세페이지용 콘텐츠를
            만들어드려요.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Link
              href="/write"
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white"
            >
              <Plus size={17} aria-hidden="true" />새 콘텐츠 만들기
            </Link>
            <Link
              href="/dashboard"
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-black text-white"
            >
              <BarChart3 size={17} aria-hidden="true" />
              대시보드
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/onboarding" className="flex min-h-11 items-center justify-center rounded-2xl bg-blue-50 px-3 text-xs font-black text-blue-700">
              30초 시작 가이드
            </Link>
            <Link href="/demo" className="flex min-h-11 items-center justify-center rounded-2xl bg-slate-100 px-3 text-xs font-black text-slate-700">
              예시 먼저 보기
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 pb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">어디에 올릴까요?</h2>
          <span className="text-sm font-semibold text-blue-600"></span>
        </div>

        <div className="grid gap-3">
          {platforms.map(({ key, title, description, icon: Icon, active }) => {
            const body = (
              <>
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${active ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"}`}
                >
                  <Icon size={24} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-base font-bold ${active ? "text-slate-950" : "text-slate-400"}`}
                    >
                      {title}
                    </h3>
                    {!active && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-400">
                        준비중
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-1 text-sm leading-6 ${active ? "text-slate-500" : "text-slate-400"}`}
                  >
                    {description}
                  </p>
                </div>
              </>
            );

            if (!active) {
              return (
                <div
                  key={key}
                  className="flex gap-4 rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-100"
                >
                  {body}
                </div>
              );
            }

            return (
              <Link
                key={key}
                href={`/write?platform=${key}`}
                className="flex gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition active:scale-[0.99]"
              >
                {body}
              </Link>
            );
          })}
        </div>
      </section>


      <section className="px-5 pb-28">
        <div className="rounded-3xl bg-blue-50 p-5 ring-1 ring-blue-100">
          <p className="text-sm font-black text-blue-700">앱처럼 사용하기</p>
          <h2 className="mt-2 text-lg font-black text-slate-950">홈 화면에 Posty AI를 추가해보세요</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">모바일 브라우저의 공유 버튼에서 홈 화면에 추가를 선택하면 더 빠르게 작성 화면으로 돌아올 수 있어요.</p>
        </div>
      </section>      <section className="px-5 pb-28">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">최근 프로젝트</h2>
          <Link href="/saved" className="text-sm font-black text-blue-600">
            전체 보기
          </Link>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          {loadingRecent && (
            <div className="flex min-h-28 items-center justify-center">
              <Loader2
                className="animate-spin text-blue-600"
                size={24}
                aria-hidden="true"
              />
            </div>
          )}
          {!loadingRecent && recentProjects.length === 0 && (
            <div className="rounded-2xl bg-slate-50 px-4 py-5 text-center">
              <p className="text-sm font-bold text-slate-500">
                아직 최근 프로젝트가 없어요.
              </p>
              <Link
                href="/write"
                className="mt-3 inline-flex rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"
              >
                + 새 콘텐츠 만들기
              </Link>
            </div>
          )}
          {!loadingRecent && recentProjects.length > 0 && (
            <div className="space-y-2">
              {recentProjects.map((post) => {
                const platform = getPostPlatform(post);
                return (
                  <Link
                    key={post.id}
                    href={
                      platform === "threads"
                        ? `/saved/threads/${post.id}`
                        : `/saved/${post.id}`
                    }
                    className="block rounded-2xl bg-slate-50 px-4 py-3 transition active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">
                          {post.travel_title ||
                            post.ai_titles[0] ||
                            getProjectName(post)}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-400">
                          {platformLabels[platform]} ·{" "}
                          {statusLabels[post.status]}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black ${post.status === "published" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"}`}
                      >
                        {statusLabels[post.status]}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function getPostPlatform(post: Post): ContentPlatform {
  const optionPlatform = post.editor_options?.platform;
  if (isContentPlatform(optionPlatform)) return optionPlatform;
  if (post.style === "threads") return "threads";
  if (post.style?.toLowerCase().includes("tistory")) return "tistory";
  return "naver";
}

function isContentPlatform(value: unknown): value is ContentPlatform {
  return [
    "naver",
    "tistory",
    "threads",
    "detail",
    "review",
    "brunch",
    "instagram",
    "wordpress",
    "general",
  ].includes(String(value));
}

function getProjectName(post: Post) {
  return (
    post.destination ||
    post.travel_title ||
    post.keywords.split(",")[0]?.trim() ||
    "기타 프로젝트"
  );
}

