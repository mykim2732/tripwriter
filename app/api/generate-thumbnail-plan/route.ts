import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { consumeApiCredit } from "@/lib/server-credits";

const OPENAI_MODEL = "gpt-4.1-mini";

type ThumbnailRequest = {
  title?: string;
  platform?: string;
  contentType?: string;
  photoUrls?: string[];
  photoCaptions?: string[];
};

type ThumbnailPlan = {
  headline: string;
  subText: string;
  badgeText: string;
  style: "blog" | "review" | "detail" | "sns";
  overlayColor: string;
  accentColor: string;
  memoText: string;
  photoUrl: string;
};

function normalize(value: Partial<ThumbnailPlan>, fallbackPhoto: string): ThumbnailPlan {
  const style = ["blog", "review", "detail", "sns"].includes(String(value.style)) ? value.style as ThumbnailPlan["style"] : "blog";
  return {
    headline: String(value.headline || "AI 썸네일"),
    subText: String(value.subText || "읽고 싶어지는 대표 이미지"),
    badgeText: String(value.badgeText || "추천"),
    style,
    overlayColor: String(value.overlayColor || "#ffffff"),
    accentColor: String(value.accentColor || "#2563eb"),
    memoText: String(value.memoText || "이 장면이 포인트"),
    photoUrl: String(value.photoUrl || fallbackPhoto),
  };
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
    return NextResponse.json({ message: "OPENAI_API_KEY가 설정되어 있지 않아요." }, { status: 500 });
  }

  const credit = await consumeApiCredit(request, "polishPost", "AI Thumbnail");
  if (!credit.ok) return credit.response;

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        { role: "developer", content: "당신은 모바일 블로그/리뷰/상세페이지 썸네일 디자이너입니다. 원본 이미지를 직접 생성하지 않고 앱의 CSS 오버레이로 올릴 제목, 배지, 손글씨 메모, 색상을 설계합니다. JSON만 반환하세요." },
        { role: "user", content: `제목: ${input.title || ""}\n플랫폼: ${input.platform || "naver"}\n콘텐츠 타입: ${input.contentType || "blog"}\n사진 URL: ${photoUrls.join("\n")}\n사진 설명: ${(input.photoCaptions || []).join(" / ")}\n\n가장 대표사진에 어울리는 photoUrl을 고르고, 클릭하고 싶지만 과장되지 않은 headline/subText/badgeText/memoText를 추천하세요. 색상은 hex로 반환하세요.\n{ "headline":"...", "subText":"...", "badgeText":"...", "style":"blog|review|detail|sns", "overlayColor":"#ffffff", "accentColor":"#2563eb", "memoText":"...", "photoUrl":"..." }` },
      ],
      text: { format: { type: "json_object" } },
    });

    return NextResponse.json(normalize(parseJson(response.output_text), photoUrls[0]), { headers: credit.headers });
  } catch (error) {
    console.error("OpenAI thumbnail call failed", error);
    return NextResponse.json(
      { message: error instanceof Error ? `AI 썸네일 실패: ${error.message}` : "AI 썸네일 생성 중 문제가 생겼어요." },
      { status: 500 },
    );
  }
}
