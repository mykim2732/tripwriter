"use client";

import { BookOpen, Gift, Home, PenLine, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/write", label: "작성", icon: PenLine },
  { href: "/saved", label: "저장함", icon: BookOpen },
  { href: "/rewards", label: "리워드", icon: Gift },
  { href: "/account", label: "계정", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 grid w-full max-w-md -translate-x-1/2 grid-cols-5 border-t border-slate-100 bg-white/95 px-2 pt-2 shadow-[0_-8px_28px_rgba(15,23,42,0.06)] backdrop-blur pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link key={href} href={href} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-black transition active:scale-[0.98] ${active ? "bg-blue-50 text-blue-600" : "text-slate-400"}`}>
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
