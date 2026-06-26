"use client";

import { BookOpen, Home, PenLine, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/write", label: "작성", icon: PenLine },
  { href: "/saved", label: "저장함", icon: BookOpen },
  { href: "/account", label: "계정", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-md -translate-x-1/2 grid-cols-4 border-t border-slate-100 bg-white px-3 pb-4 pt-2">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-bold ${
              active ? "text-blue-600" : "text-slate-400"
            }`}
          >
            <Icon size={21} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

