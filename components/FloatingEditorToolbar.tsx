"use client";

import { Loader2, Save } from "lucide-react";
import type { ReactNode } from "react";

export type FloatingToolbarItem = {
  key: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

type Props = {
  items: FloatingToolbarItem[];
  onSave?: () => void;
  saving?: boolean;
  children?: ReactNode;
  actionPanel?: ReactNode;
  columnsClass?: string;
  saveLabel?: string;
};

export function FloatingEditorToolbar({
  items,
  onSave,
  saving = false,
  children,
  actionPanel,
  columnsClass = "grid-cols-[repeat(5,1fr)_auto]",
  saveLabel = "저장",
}: Props) {
  return (
    <footer className="fixed left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-slate-100 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur" style={{ bottom: "calc(72px + env(safe-area-inset-bottom))" }}>
      {children && <div className="max-h-[52vh] overflow-y-auto overscroll-contain border-b border-slate-100 bg-white px-3 py-3">{children}</div>}
      <div className={`grid ${columnsClass} items-center gap-1 px-3 py-2`}>
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            title={item.label}
            aria-label={item.label}
            disabled={item.disabled}
            onClick={item.onClick}
            className={`flex min-h-11 items-center justify-center rounded-xl transition disabled:text-slate-300 ${
              item.active ? "bg-blue-50 text-blue-600" : "text-slate-950 hover:bg-slate-50"
            }`}
          >
            {item.icon}
          </button>
        ))}
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !onSave}
          className="flex h-11 min-w-12 items-center justify-center rounded-xl text-blue-600 transition hover:bg-blue-50 disabled:text-slate-300"
          aria-label={saveLabel}
          title={saveLabel}
        >
          {saving ? <Loader2 className="animate-spin" size={22} aria-hidden="true" /> : <Save size={22} aria-hidden="true" />}
        </button>
      </div>
      {actionPanel && <div className="border-t border-slate-100 bg-white px-3 py-3">{actionPanel}</div>}
    </footer>
  );
}
