import { BottomNav } from "@/components/BottomNav";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="posty-app-shell mx-auto min-h-screen max-w-md bg-white text-slate-950 shadow-[0_0_32px_rgba(15,23,42,0.06)]">
      <div className="posty-scroll-safe pb-[calc(7.5rem+env(safe-area-inset-bottom))]">{children}</div>
      <BottomNav />
    </main>
  );
}
