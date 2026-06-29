"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const key = "posty-ai-notifications-read";

export function NotificationBell() {
  const [read, setRead] = useState(false);
  useEffect(() => { setRead(window.localStorage.getItem(key) === "true"); }, []);
  return (
    <Link href="/notifications" className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-100" aria-label="Notifications">
      <Bell size={19} />
      {!read && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white" />}
    </Link>
  );
}
