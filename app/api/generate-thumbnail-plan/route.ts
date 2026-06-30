import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { consumeApiCredit } from "@/lib/server-credits";

const OPENAI_MODEL = "gpt-4.1-mini";

type ThumbnailRequest = {
  title?: string;
  platform?: string;
  contentType?: string;
  thumbnailStyle?: "minimal" | "diary" | "review" | "detail";
  photoUrls?: string[];
  photoCaptions?: string[];
};

type ThumbnailPlan = {
  headline: string;
  subText: string;
  badgeText: string;
  style: "minimal" | "diary" | "review" | "detail";
  overlayColor: string;
  accentColor: string;
  memoText: string;
  photoUrl: string;
  mode?: "ai" | "mock";
};

function normalize(value: Partial<ThumbnailPlan>, fallbackPhoto: string, fallbackStyle: ThumbnailPlan["style"]): ThumbnailPlan {
  const style = ["minimal", "diary", "review", "detail"].includes(String(value.style)) ? value.style as ThumbnailPlan["style"] : fallbackStyle;
  return {
    headline: String(value.headline || "AI 썸네일"),
    subText: String(value.subText || "읽고 싶어지는 대표 이미지"),
    badgeText: String(value.badgeText || "추천"),
    style,
    overlayColor: String(value.overlayColor || "#ffffff"),
    accentColor: String(value.accentColor || "#2563eb"),
    memoText: String(value.memoText || "이 장면이 포인트"),
    photoUrl: String(value.photoUrl || fallbackPhoto),
    mode: value.mode === "mock" ? "mock" : "ai",
  };
}

function fallbackPlan(input: ThumbnailRequest, fallbackPhoto: string): ThumbnailPlan {
  const style = input.thumbnailStyle || (input.contentType === "detail" ? "detail" : input.contentType === "review" ? "review" : "minimal");
  return normalize({
    headline: input.title || "Posty AI 썸네일",
    subText: "대표사진 기반 mock preview",
    badgeText: style === "detail" ? "BEST" : style === "review" ? "REVIEW" : style === "diary" ? "DIARY" : "POSTY",
    style,
    overlayColor: "#ffffff",
    accentColor: style === "detail" ? "#2563eb" : style === "review" ? "#facc15" : style === "diary" ? "#fecdd3" : "#0f172a",
    memoText: (input.photoCaptions || [])[0] || "이 장면이 포인트",
    photoUrl: fallbackPhoto,
    mode: "mock",
  }, fallbackPhoto, style);
}

function parseJson(text: string) {
  try {
    return JSON.parse(text) as Partial<ThumbnailPlan>;
  } catch (error) {
    console.error("Thumbnail JSON parsing failed", error, text);
    throw new Error("AI 썸네일 응답을 JSON으로 해석하지 못했어요.");
  }
}

export async function POST(request: NextRequest) {
  let input: ThumbnailRequest;
  try {
    input = (await request.json()) as ThumbnailRequest;
  } catch (error) {
    console.error("Thumbnail request JSON parsing failed", error);
    return NextResponse.json({ message: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  const photoUrls = (input.photoUrls || []).filter(Boolean);
  if (photoUrls.length === 0) {
    return NextResponse.json({ message: "썸네일을 만들 사진이 필요해요." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(fallbackPlan(input, photoUrls[0]));
  }

  const credit = await consumeApiCredit(request, "polishPost", "AI Thumbnail");
  if (!credit.ok) return credit.response;

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        { role: "developer", content: "당신은 Posty AI 모바일 썸네일 디자이너입니다. 원본 이미지를 직접 생성하지 않고 앱의 CSS 오버레이로 올릴 제목, 배지, 손글씨 메모, 색상을 설계합니다. 미니멀/다이어리/리뷰/상세페이지 스타일 중 사용자가 고른 방향을 유지하고 JSON만 반환하세요." },
        { role: "user", content: `제목: ${input.title || ""}\n플랫폼: ${input.platform || "naver"}\n콘텐츠 타입: ${input.contentType || "blog"}\n요청 스타일: ${input.thumbnailStyle || "minimal"}\n사진 URL: ${photoUrls.join("\n")}\n사진 설명: ${(input.photoCaptions || []).join(" / ")}\n\n가장 대표사진에 어울리는 photoUrl을 고르고, 클릭하고 싶지만 과장되지 않은 headline/subText/badgeText/memoText를 추천하세요. 색상은 hex로 반환하세요.\n{ "headline":"...", "subText":"...", "badgeText":"...", "style":"minimal|diary|review|detail", "overlayColor":"#ffffff", "accentColor":"#2563eb", "memoText":"...", "photoUrl":"..." }` },
      ],
      text: { format: { type: "json_object" } },
    });

    return NextResponse.json(normalize(parseJson(response.output_text), photoUrls[0], input.thumbnailStyle || "minimal"), { headers: credit.headers });
  } catch (error) {
    console.error("OpenAI thumbnail call failed", error);
    return NextResponse.json(fallbackPlan(input, photoUrls[0]));
  }
}
