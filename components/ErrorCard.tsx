import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  title?: string;
  message: string;
  action?: ReactNode;
};

export function ErrorCard({ title = "문제가 생겼어요", message, action }: Props) {
  return (
    <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5 text-rose-700">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
        <div>
          <p className="text-sm font-black">{title}</p>
          <p className="mt-2 text-sm leading-6">{message}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </div>
    </div>
  );
}
