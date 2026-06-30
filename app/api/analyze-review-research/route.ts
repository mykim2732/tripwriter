import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const OPENAI_MODEL = "gpt-4.1-mini";

type ReviewResearchRequest = {
  subject?: string;
  rating?: string;
  reviewMemo?: string;
  links?: { label?: string; url?: string }[];
  pros?: string;
  cons?: string;
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
    summary: typeof value.summary === "string" ? value.summary : "입력한 리뷰 메모를 기준으로 참고 포인트를 정리했어요.",
    commonPros: normalizeArray(value.commonPros),
    commonCons: normalizeArray(value.commonCons),
    keywords: normalizeArray(value.keywords, 12),
    suggestedAngles: normalizeArray(value.suggestedAngles),
    cautionNotes: normalizeArray(value.cautionNotes),
    titleHints: normalizeArray(value.titleHints),
  };
}

function fallbackAnalyze(input: ReviewResearchRequest): ReviewResearchResponse {
  const pros = (input.pros || "").split(/,|\n/).map((item) => item.trim()).filter(Boolean).slice(0, 6);
  const cons = (input.cons || "").split(/,|\n/).map((item) => item.trim()).filter(Boolean).slice(0, 6);
  const memoKeywords = (input.reviewMemo || "")
    .replace(/[^\p{L}\p{N}\s#]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2)
    .slice(0, 10);

  return {
    summary: `${input.subject || "대상"}에 대해 사용자가 입력한 메모 기준으로 장점과 아쉬운 점을 균형 있게 참고하면 좋아요.`,
    commonPros: pros,
    commonCons: cons,
    keywords: Array.from(new Set([...memoKeywords, ...(input.subject ? [input.subject] : [])])).slice(0, 10),
    suggestedAngles: ["직접 경험한 점과 참고 메모를 구분해서 작성하기", "장점과 아쉬운 점을 함께 넣어 신뢰감 높이기", "사진에서 확인 가능한 내용만 구체적으로 쓰기"],
    cautionNotes: ["외부 후기 원문을 그대로 옮기지 않기", "링크 내용을 실제로 읽은 것처럼 단정하지 않기", "효능이나 성능은 확인된 범위에서만 표현하기"],
    titleHints: input.subject ? [`${input.subject} 솔직 후기`, `${input.subject} 장단점 정리`, `${input.subject} 써보니 좋았던 점`] : ["솔직 후기", "장단점 정리", "사진으로 보는 후기"],
  };
}

export async function POST(request: NextRequest) {
  let input: ReviewResearchRequest;

  try {
    input = (await request.json()) as ReviewResearchRequest;
  } catch {
    return NextResponse.json({ message: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  const hasUsefulInput = Boolean(input.subject || input.reviewMemo || input.pros || input.cons || input.rating || input.links?.some((link) => link.url));
  if (!hasUsefulInput) {
    return NextResponse.json({ message: "리뷰 메모나 참고할 대상 이름을 입력해주세요." }, { status: 400 });
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
          content: `당신은 블로그/SNS/상세페이지 리뷰 리서치 보조자입니다.
사용자가 직접 입력한 리뷰 메모, 평점, 장점, 단점, 링크 설명만 바탕으로 안전하게 요약합니다.

엄격한 규칙:
- 외부 링크 내용을 실제로 읽은 척하지 마세요.
- 구글/네이버/카카오 리뷰 원문을 수집하거나 복제하지 마세요.
- 사용자가 직접 확인해서 입력한 reviewMemo를 최우선 근거로 삼되, 그대로 길게 복사하지 말고 핵심만 재구성하세요.
- 링크는 사용자가 참고한 출처 힌트로만 다루고, 링크 본문을 열람하거나 스크래핑한 것처럼 표현하지 마세요.
- "이런 후기가 많다는 점을 참고할 수 있어요"처럼 조심스럽게 표현하세요.
- 효능, 성능, 인증, 가격, 운영 정보는 입력된 범위 밖으로 단정하지 마세요.
- 저작권/플랫폼 정책에 민감한 원문 복제는 금지합니다.

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
사용자 입력 리뷰 메모:
${input.reviewMemo || ""}

사용자가 정리한 장점:
${input.pros || ""}

사용자가 정리한 단점:
${input.cons || ""}

참고 링크 목록:
${JSON.stringify(input.links || [])}

링크는 위치와 출처 힌트로만 보고, 링크 본문을 읽은 것처럼 쓰지 마세요.`,
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
