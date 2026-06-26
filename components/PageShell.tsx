import { BottomNav } from "@/components/BottomNav";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-md bg-white pb-24 text-slate-950 shadow-[0_0_32px_rgba(15,23,42,0.06)]">
      {children}
      <BottomNav />
    </main>
  );
}
