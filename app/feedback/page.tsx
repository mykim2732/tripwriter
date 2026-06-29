"use client";

import { Camera, Send, Star } from "lucide-react";
import { FormEvent, useState } from "react";
import { PageShell } from "@/components/PageShell";

type FeedbackDraft = {
  rating: number;
  pain: string;
  feature: string;
  bug: string;
  contact: string;
  createdAt: string;
};

export default function FeedbackPage() {
  const [rating, setRating] = useState(5);
  const [pain, setPain] = useState("");
  const [feature, setFeature] = useState("");
  const [bug, setBug] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: FeedbackDraft = { rating, pain, feature, bug, contact, createdAt: new Date().toISOString() };
    const previous = JSON.parse(localStorage.getItem("posty_feedback") || "[]") as FeedbackDraft[];
    localStorage.setItem("posty_feedback", JSON.stringify([next, ...previous].slice(0, 20)));
    setMessage("피드백을 저장했어요. 베타 개선에 바로 반영할게요.");
    setPain("");
    setFeature("");
    setBug("");
    setContact("");
  }

  return (
    <PageShell>
      <section className="px-5 pb-28 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">Posty AI Beta</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">피드백 보내기</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">불편한 점, 필요한 기능, 버그를 알려주세요. 더 돈 내고 쓸 만한 제품으로 다듬겠습니다.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-base font-black text-slate-950">만족도</h2>
            <div className="mt-3 flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" onClick={() => setRating(value)} className={`flex h-12 w-12 items-center justify-center rounded-2xl ${rating >= value ? "bg-amber-100 text-amber-500" : "bg-slate-100 text-slate-300"}`}>
                  <Star size={22} fill="currentColor" />
                </button>
              ))}
            </div>
          </article>

          <Field label="불편한 점" value={pain} onChange={setPain} placeholder="어떤 부분이 불편했나요?" />
          <Field label="원하는 기능" value={feature} onChange={setFeature} placeholder="추가되면 바로 쓸 것 같은 기능을 알려주세요." />
          <Field label="버그 신고" value={bug} onChange={setBug} placeholder="오류 화면, 재현 방법을 적어주세요." />

          <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <label className="text-sm font-black text-slate-700">연락처 선택 입력</label>
            <input value={contact} onChange={(event) => setContact(event.target.value)} placeholder="이메일 또는 카카오톡 ID" className="mt-2 h-12 w-full rounded-2xl bg-slate-50 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-200" />
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-400"><Camera size={17} /> 스크린샷 첨부는 준비 중</div>
          </article>

          <button type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white"><Send size={17} /> 피드백 보내기</button>
        </form>

        {message && <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{message}</p>}
      </section>
    </PageShell>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <span className="text-sm font-black text-slate-700">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-28 w-full rounded-2xl bg-slate-50 p-4 text-sm leading-6 outline-none focus:ring-2 focus:ring-blue-200" />
    </label>
  );
}
