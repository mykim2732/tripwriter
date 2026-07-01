import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const OPENAI_MODEL = "gpt-4.1-mini";

type ReviewPreviewInput = {
  sourceLabel?: string;
  rating?: number;
  summary?: string;
  keywords?: string[];
};

type ReviewResearchRequest = {
  subject?: string;
  rating?: string;
  reviewMemo?: string;
  links?: { label?: string; url?: string }[];
  pros?: string;
  cons?: string;
  reviewPreviews?: ReviewPreviewInput[];
  platform?: string;
  contentType?: string;
};

type ReviewResearchResponse = {
  summary: string;
  commonPros: string[];
  commonCons: string[];
  keywords: string[];
  suggestedAngles: string[];
  cautionNotes: string[];
  titleHints: string[];
};

function normalizeArray(value: unknown, limit = 8) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean).slice(0, limit) : [];
}

function normalizeResponse(value: Partial<ReviewResearchResponse>): ReviewResearchResponse {
  return {
    summary: typeof value.summary === "string" ? value.summary : "선택한 리뷰 미리보기와 직접 입력한 메모를 기준으로 참고 포인트를 정리했어요.",
    commonPros: normalizeArray(value.commonPros),
    commonCons: normalizeArray(value.commonCons),
    keywords: normalizeArray(value.keywords, 12),
    suggestedAngles: normalizeArray(value.suggestedAngles),
    cautionNotes: normalizeArray(value.cautionNotes),
    titleHints: normalizeArray(value.titleHints),
  };
}

function fallbackAnalyze(input: ReviewResearchRequest): ReviewResearchResponse {
  const selectedPreviews = (input.reviewPreviews || []).slice(0, 5);
  const previewText = selectedPreviews.map((item) => item.summary || "").filter(Boolean);
  const pros = (input.pros || "").split(/,|\n/).map((item) => item.trim()).filter(Boolean).slice(0, 6);
  const cons = (input.cons || "").split(/,|\n/).map((item) => item.trim()).filter(Boolean).slice(0, 6);
  const previewKeywords = selectedPreviews.flatMap((item) => item.keywords || []);
  const memoKeywords = [input.reviewMemo || "", ...previewText]
    .join(" ")
    .replace(/[^\p{L}\p{N}\s#]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2)
    .slice(0, 10);

  return {
    summary: `${input.subject || "대상"}에 대해 선택한 리뷰 미리보기와 직접 메모를 참고하되, 내 경험과 타인 리뷰를 구분해 쓰면 좋아요.`,
    commonPros: pros.length ? pros : previewKeywords.filter((item) => !item.includes("아쉬")),
    commonCons: cons,
    keywords: Array.from(new Set([...memoKeywords, ...previewKeywords, ...(input.subject ? [input.subject] : [])])).slice(0, 10),
    suggestedAngles: [
      "내가 직접 경험한 내용은 1인칭으로, 리뷰 참고 내용은 '후기에서 자주 보이는 포인트'처럼 분리하기",
      "선택한 리뷰 미리보기의 표현을 그대로 복사하지 말고 공통 키워드만 참고하기",
      "사진에서 확인 가능한 디테일을 먼저 쓰고, 타인 리뷰는 보조 정보로만 사용하기",
    ],
    cautionNotes: [
      "외부 리뷰 원문을 그대로 복제하지 않기",
      "링크 내용을 실제로 읽은 것처럼 단정하지 않기",
      "내 경험과 타인 리뷰 참고 내용을 섞어 과장하지 않기",
    ],
    titleHints: input.subject ? [`${input.subject} 솔직 후기`, `${input.subject} 참고 포인트`, `${input.subject} 다녀온 뒤 느낀 점`] : ["솔직 후기", "참고 포인트", "사진으로 보는 후기"],
  };
}

export async function POST(request: NextRequest) {
  let input: ReviewResearchRequest;

  try {
    input = (await request.json()) as ReviewResearchRequest;
  } catch {
    return NextResponse.json({ message: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  const hasUsefulInput = Boolean(
    input.subject ||
    input.reviewMemo ||
    input.pros ||
    input.cons ||
    input.rating ||
    input.links?.some((link) => link.url) ||
    input.reviewPreviews?.some((preview) => preview.summary),
  );
  if (!hasUsefulInput) {
    return NextResponse.json({ message: "장소/상품명이나 참고할 리뷰 포인트를 입력해주세요." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(fallbackAnalyze(input));
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "developer",
          content: `당신은 Posty AI의 리뷰 참고 정보를 정리하는 보조 에디터입니다.
사용자가 선택한 리뷰 미리보기, 직접 입력한 메모, 평점, 장단점, 참고 링크 설명만 바탕으로 글에 참고할 포인트를 정리합니다.

안전 규칙:
- 외부 리뷰 원문을 그대로 복제하지 마세요.
- 링크 본문을 읽은 척하지 마세요.
- 리뷰 미리보기는 공식 API 또는 mock/search-link에서 온 짧은 참고 정보입니다. 사실 단정이 아니라 글의 균형을 잡는 단서로만 다루세요.
- 사용자의 직접 경험과 타인 리뷰 참고 내용을 반드시 구분하도록 안내하세요.
- 효능, 성능, 의료, 가격, 인증 정보는 입력 범위를 벗어나 단정하지 마세요.

JSON only:
{
  "summary": "...",
  "commonPros": ["..."],
  "commonCons": ["..."],
  "keywords": ["..."],
  "suggestedAngles": ["..."],
  "cautionNotes": ["..."],
  "titleHints": ["..."]
}`,
        },
        {
          role: "user",
          content: `대상: ${input.subject || ""}
평점/평가: ${input.rating || ""}
플랫폼: ${input.platform || "general"}
콘텐츠 유형: ${input.contentType || "blog"}

선택한 리뷰 미리보기:
${JSON.stringify((input.reviewPreviews || []).slice(0, 5))}

사용자가 직접 확인해 적은 리뷰 메모:
${input.reviewMemo || ""}

사용자가 정리한 장점:
${input.pros || ""}

사용자가 정리한 아쉬운 점:
${input.cons || ""}

참고 링크 목록:
${JSON.stringify(input.links || [])}

위 자료를 그대로 복사하지 말고, 글에 참고할 포인트만 짧게 정리하세요.`,
        },
      ],
      text: { format: { type: "json_object" } },
    });

    const parsed = JSON.parse(response.output_text) as Partial<ReviewResearchResponse>;
    return NextResponse.json(normalizeResponse(parsed));
  } catch (error) {
    console.error("Review research analysis failed:", error);
    return NextResponse.json(fallbackAnalyze(input));
  }
}
