"use client";

import { Bell, CheckCircle2, CreditCard, Gift, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";

const readKey = "posty-ai-notifications-read";

const notifications = [
  { icon: Gift, title: "Reward credits are ready", body: "Check in or complete a beta mission to receive extra AI credits.", tone: "blue" },
  { icon: Sparkles, title: "AI design upgraded", body: "Posty AI can now apply stronger visual design themes to blog, review, and detail pages.", tone: "violet" },
  { icon: CheckCircle2, title: "Profile setup helps quality", body: "Add your preferred tone and writing fields so generated content feels more like you.", tone: "green" },
  { icon: CreditCard, title: "Pricing is in preparation", body: "Free, Pro, Creator, and Business plans are visible. Payments are disabled during beta.", tone: "slate" },
  { icon: Bell, title: "Beta update notices", body: "New release notes and customer support pages are available from Settings.", tone: "amber" },
];

export default function NotificationsPage() {
  const [read, setRead] = useState(false);
  useEffect(() => {
    window.localStorage.setItem(readKey, "true");
    setRead(true);
  }, []);

  return (
    <PageShell>
      <section className="px-5 pb-28 pt-7">
        <div className="mb-6">
          <p className="text-sm font-bold text-blue-600">Posty AI</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">Notifications</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Important product updates, credit events, and beta notices will appear here.</p>
        </div>
        <div className="grid gap-3">
          {notifications.map(({ icon: Icon, title, body, tone }) => (
            <article key={title} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneClass(tone)}`}><Icon size={23} /></div>
                <div>
                  <h2 className="text-base font-black text-slate-950">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        {read && <p className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">All current beta notifications are marked as read.</p>}
      </section>
    </PageShell>
  );
}

function toneClass(tone: string) {
  if (tone === "violet") return "bg-violet-50 text-violet-600";
  if (tone === "green") return "bg-emerald-50 text-emerald-600";
  if (tone === "amber") return "bg-amber-50 text-amber-600";
  if (tone === "slate") return "bg-slate-100 text-slate-600";
  return "bg-blue-50 text-blue-600";
}
