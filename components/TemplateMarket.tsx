"use client";

import { CheckCircle2 } from "lucide-react";
import type { BlogEditorState, DesignTheme } from "@/types/editor";

export type ContentTemplate = {
  id: string;
  name: string;
  description: string;
  badge: string;
  designTheme: DesignTheme;
  fontFamily: string;
  fontSize: string;
  pointIcon: string;
  pointColor: string;
  highlightColor: string;
};

export const contentTemplates: ContentTemplate[] = [
  { id: "muji", name: "무인양품", description: "담백한 여백과 정돈된 정보", badge: "MIN", designTheme: "정보 정리", fontFamily: "문서형", fontSize: "기본", pointIcon: "📌", pointColor: "#334155", highlightColor: "#e2e8f0" },
  { id: "diary", name: "감성 다이어리", description: "메모지, 테이프, 손글씨 무드", badge: "DIARY", designTheme: "감성 다이어리", fontFamily: "감성 손글씨", fontSize: "크게", pointIcon: "✨", pointColor: "#db2777", highlightColor: "#fbcfe8" },
  { id: "kid", name: "아이 낙서", description: "별, 하트, 구름 낙서 포인트", badge: "KID", designTheme: "아이 낙서", fontFamily: "귀여운 손글씨", fontSize: "크게", pointIcon: "❤️", pointColor: "#f97316", highlightColor: "#fed7aa" },
  { id: "cafe", name: "카페 감성", description: "따뜻한 사진과 부드러운 문장", badge: "CAFE", designTheme: "카페 감성", fontFamily: "카페 감성", fontSize: "기본", pointIcon: "☕", pointColor: "#92400e", highlightColor: "#fde68a" },
  { id: "insta", name: "인스타 감성", description: "짧고 예쁜 문장과 이모지", badge: "SNS", designTheme: "감성 다이어리", fontFamily: "Pretendard", fontSize: "기본", pointIcon: "💖", pointColor: "#ec4899", highlightColor: "#fbcfe8" },
  { id: "ohouse", name: "오늘의집", description: "공간, 제품, 구매 포인트 중심", badge: "HOME", designTheme: "전문 리뷰", fontFamily: "Noto Sans KR", fontSize: "기본", pointIcon: "⭐", pointColor: "#2563eb", highlightColor: "#bfdbfe" },
  { id: "brunch", name: "브런치", description: "에세이형 긴 호흡과 문장감", badge: "ESSAY", designTheme: "감성 다이어리", fontFamily: "나눔명조", fontSize: "크게", pointIcon: "🌿", pointColor: "#166534", highlightColor: "#dcfce7" },
  { id: "notion", name: "Notion", description: "체크리스트와 박스 정리", badge: "DOC", designTheme: "정보 정리", fontFamily: "Pretendard", fontSize: "기본", pointIcon: "✅", pointColor: "#111827", highlightColor: "#e5e7eb" },
  { id: "apple", name: "애플", description: "깔끔한 제품 소개와 강한 한 문장", badge: "PRO", designTheme: "전문 리뷰", fontFamily: "문서형", fontSize: "기본", pointIcon: "💼", pointColor: "#0f172a", highlightColor: "#dbeafe" },
  { id: "magazine", name: "잡지", description: "강한 제목과 섹션형 구성", badge: "MAG", designTheme: "전문 리뷰", fontFamily: "나눔명조", fontSize: "크게", pointIcon: "🔥", pointColor: "#be123c", highlightColor: "#fecdd3" },
  { id: "news", name: "뉴스", description: "사실 중심과 빠른 요약", badge: "NEWS", designTheme: "정보 정리", fontFamily: "문서형", fontSize: "기본", pointIcon: "📝", pointColor: "#1d4ed8", highlightColor: "#bfdbfe" },
  { id: "minimal", name: "미니멀", description: "색을 줄이고 글에 집중", badge: "CALM", designTheme: "정보 정리", fontFamily: "기본", fontSize: "기본", pointIcon: "📌", pointColor: "#475569", highlightColor: "#f1f5f9" },
];

type Props = {
  current?: string;
  onApply: (template: ContentTemplate) => void;
};

export function TemplateMarket({ current, onApply }: Props) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {contentTemplates.map((template) => {
        const active = current === template.id;
        return (
          <button key={template.id} type="button" onClick={() => onApply(template)} className={`min-h-28 rounded-3xl p-3 text-left ring-1 transition ${active ? "bg-blue-600 text-white ring-blue-600" : "bg-white text-slate-700 ring-slate-100"}`}>
            <div className="flex items-start justify-between gap-2">
              <span className={`rounded-full px-2 py-1 text-[10px] font-black ${active ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"}`}>{template.badge}</span>
              {active && <CheckCircle2 size={16} aria-hidden="true" />}
            </div>
            <p className="mt-3 text-sm font-black">{template.name}</p>
            <p className={`mt-1 text-[11px] font-bold leading-4 ${active ? "text-blue-50" : "text-slate-400"}`}>{template.description}</p>
          </button>
        );
      })}
    </div>
  );
}

export function applyTemplateToState(state: BlogEditorState, template: ContentTemplate): BlogEditorState {
  return {
    ...state,
    fontFamily: template.fontFamily,
    fontSize: template.fontSize,
    pointIcon: template.pointIcon,
    editorOptions: {
      ...state.editorOptions,
      templateId: template.id,
      designTheme: template.designTheme,
      pointColor: template.pointColor,
      highlightColor: template.highlightColor,
      fontFamily: template.fontFamily,
      fontSize: template.fontSize,
      pointIcon: template.pointIcon,
    },
  };
}
