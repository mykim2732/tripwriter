"use client";

import { Check, Copy, X } from "lucide-react";
import { useState } from "react";

export type CopyAction = {
  label: string;
  description?: string;
  onClick: () => void | Promise<void>;
};

type Props = {
  actions: CopyAction[];
  label?: string;
};

export function CopyActionSheet({ actions, label = "복사 메뉴" }: Props) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState("");

  async function run(action: CopyAction) {
    await action.onClick();
    setDone(action.label);
    window.setTimeout(() => {
      setDone("");
      setOpen(false);
    }, 650);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={label} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200">
        <Copy size={19} aria-hidden="true" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[80] bg-slate-950/25" onClick={() => setOpen(false)}>
          <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white p-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-slate-950">복사하기</h2>
              <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-500" aria-label="닫기">
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 grid gap-2">
              {actions.map((action) => (
                <button key={action.label} type="button" onClick={() => { void run(action); }} className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 text-left">
                  <span>
                    <span className="block text-sm font-black text-slate-800">{action.label}</span>
                    {action.description && <span className="mt-0.5 block text-xs font-bold text-slate-400">{action.description}</span>}
                  </span>
                  {done === action.label ? <Check className="text-blue-600" size={18} /> : <Copy className="text-slate-300" size={18} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
