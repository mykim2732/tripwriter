"use client";

import { ShieldAlert, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorCard } from "@/components/ErrorCard";
import { LoadingCard } from "@/components/LoadingCard";
import { PageShell } from "@/components/PageShell";
import type { Profile } from "@/lib/credits";
import { getCurrentProfile } from "@/lib/profile";
import { getPosts } from "@/lib/posts";
import { browserSupabase } from "@/lib/supabase";
import type { Post } from "@/types/post";

export default function AdminPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [creditLogCount, setCreditLogCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const { data } = await browserSupabase.client.auth.getUser();
        if (!data.user) {
          setError("로그인이 필요합니다.");
          return;
        }
        const nextProfile = await getCurrentProfile();
        setProfile(nextProfile);
        if (nextProfile?.role !== "admin") return;

        setPosts(await getPosts());
        const { count: profilesCount } = await browserSupabase.client.from("profiles").select("id", { count: "exact", head: true });
        const { count: logsCount } = await browserSupabase.client.from("credit_logs").select("id", { count: "exact", head: true });
        setUserCount(profilesCount ?? null);
        setCreditLogCount(logsCount ?? null);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "관리자 정보를 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const isAdmin = profile?.role === "admin";
  const todayCount = posts.filter((post) => post.created_at.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;

  return (
    <PageShell>
      <section className="px-5 pb-8 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">Posty AI Admin</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">관리자</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">회원, 콘텐츠, 크레딧 로그를 운영 관점에서 확인하는 기초 화면입니다.</p>
        </div>

        {loading && <LoadingCard title="관리자 권한 확인 중" description="로그인 상태와 role을 확인하고 있어요." />}
        {!loading && error && <ErrorCard title="접근 오류" message={error} action={<Link href="/login" className="inline-flex rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white">로그인</Link>} />}
        {!loading && !error && !isAdmin && (
          <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><ShieldAlert size={28} /></div>
            <h2 className="mt-4 text-lg font-black text-slate-950">관리자 권한이 필요합니다.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">현재 계정은 관리자 role이 아니에요. Supabase profiles.role 값을 admin으로 설정한 계정만 접근할 수 있습니다.</p>
          </div>
        )}
        {!loading && !error && isAdmin && (
          <div className="space-y-4">
            <article className="rounded-3xl bg-blue-600 p-5 text-white shadow-sm">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15"><ShieldCheck size={25} /></div>
                <div>
                  <h2 className="text-base font-black">관리자 권한 확인됨</h2>
                  <p className="mt-1 text-sm leading-6 text-blue-100">RLS 정책에 따라 표시 가능한 운영 데이터만 보여줍니다.</p>
                </div>
              </div>
            </article>
            <div className="grid grid-cols-2 gap-3">
              <AdminMetric label="전체 사용자" value={userCount === null ? "RLS 확인" : `${userCount}명`} />
              <AdminMetric label="전체 콘텐츠" value={`${posts.length}개`} />
              <AdminMetric label="오늘 생성" value={`${todayCount}개`} />
              <AdminMetric label="크레딧 로그" value={creditLogCount === null ? "RLS 확인" : `${creditLogCount}건`} />
            </div>
            <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="mb-3 flex items-center gap-2"><UsersRound size={19} className="text-blue-600" /><h2 className="text-base font-black text-slate-950">최근 생성 콘텐츠</h2></div>
              <div className="grid gap-2">
                {posts.slice(0, 6).map((post) => <Link key={post.id} href={`/saved/${post.id}`} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">{post.travel_title || "제목 없음"}</Link>)}
                {posts.length === 0 && <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-400">표시할 콘텐츠가 없어요.</p>}
              </div>
            </article>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function AdminMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100"><p className="text-xs font-black text-slate-400">{label}</p><p className="mt-2 text-xl font-black text-slate-950">{value}</p></div>;
}
