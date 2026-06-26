import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const OPENAI_MODEL = "gpt-4.1-mini";

type AnalyzeRequest = {
  title?: string;
  content?: string;
  tags?: string[];
  photoUrls?: string[];
  place?: string;
  style?: string;
};

type AnalyzeResponse = {
  totalScore: number;
  seoScore: number;
  clickScore: number;
  readabilityScore: number;
  photoScore: number;
  empathyScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  betterTitles: string[];
  recommendedKeywords: string[];
  quickFixes: string[];
};

function clampScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeStringArray(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];
  return value.map(String).map((item) => item.trim()).filter(Boolean).slice(0, limit);
}

function normalizeAnalyzeResponse(parsed: Partial<AnalyzeResponse>): AnalyzeResponse {
  return {
    totalScore: clampScore(parsed.totalScore),
    seoScore: clampScore(parsed.seoScore),
    clickScore: clampScore(parsed.clickScore),
    readabilityScore: clampScore(parsed.readabilityScore),
    photoScore: clampScore(parsed.photoScore),
    empathyScore: clampScore(parsed.empathyScore),
    summary: typeof parsed.summary === "string" ? parsed.summary : "분석 요약을 만들지 못했어요.",
    strengths: normalizeStringArray(parsed.strengths, 5),
    improvements: normalizeStringArray(parsed.improvements, 5),
    betterTitles: normalizeStringArray(parsed.betterTitles, 3),
    recommendedKeywords: normalizeStringArray(parsed.recommendedKeywords, 10),
    quickFixes: normalizeStringArray(parsed.quickFixes, 6),
  };
}

function parseJson(text: string) {
  try {
    return JSON.parse(text) as Partial<AnalyzeResponse>;
  } catch (error) {
    console.error("Analyze JSON parsing failed:", error, text);
    throw new Error("OpenAI 응답을 JSON으로 해석하지 못했어요. 다시 시도해주세요.");
  }
}

export async function POST(request: NextRequest) {
  let input: AnalyzeRequest;

  try {
    input = (await request.json()) as AnalyzeRequest;
  } catch (error) {
    console.error("Analyze request JSON parsing failed:", error);
    return NextResponse.json({ message: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  if (!input.content?.trim()) {
    return NextResponse.json({ message: "분석할 본문이 비어 있어요." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is missing for analyze-post.");
    return NextResponse.json(
      { message: "OPENAI_API_KEY가 설정되어 있지 않아요. .env.local을 확인해주세요." },
      { status: 500 },
    );
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "developer",
          content: `당신은 네이버 블로그 SEO 전문가이자 블로그 성장 코치입니다.
사용자의 저장된 블로그 글을 분석해 SEO, 클릭률, 가독성, 사진 활용, 공감도를 0~100점으로 평가합니다.

분석 규칙:
- 과장하지 말 것
- 실제 검색량을 아는 것처럼 단정하지 말 것
- "가능성이 있습니다", "도움이 될 수 있습니다"처럼 조심스럽게 표현
- 네이버 블로그 기준으로 실용적인 조언 제공
- 제목 후보는 클릭률과 검색 친화성을 고려
- 사진이 없으면 photoScore를 낮게 주고 사진 추가를 권장
- 태그가 부족하면 키워드를 추천
- 사용자가 입력한 사실만 근거로 분석
- 비난하지 말고 바로 고칠 수 있는 코칭 문장으로 작성

반환은 반드시 JSON만 사용하세요:
{
  "totalScore": 92,
  "seoScore": 95,
  "clickScore": 88,
  "readabilityScore": 94,
  "photoScore": 82,
  "empathyScore": 90,
  "summary": "전체적으로 읽기 쉽고 정보성이 좋은 글입니다.",
  "strengths": ["소제목 구성이 좋습니다", "키워드가 자연스럽습니다"],
  "improvements": ["대표사진을 앞쪽에 배치하면 좋아요", "도입부에 장소명을 자연스럽게 넣어보세요"],
  "betterTitles": ["...", "...", "..."],
  "recommendedKeywords": ["...", "..."],
  "quickFixes": ["도입부를 2문장 줄이기", "마무리에 방문 팁 추가"]
}`,
        },
        {
          role: "user",
          content: `아래 블로그 글을 네이버 블로그 기준으로 분석해주세요.

제목: ${input.title || ""}
장소: ${input.place || ""}
스타일: ${input.style || ""}
태그: ${(input.tags || []).join(", ")}
사진 개수: ${input.photoUrls?.length || 0}
사진 URL:
${(input.photoUrls || []).join("\n")}

본문:
${input.content}`,
        },
      ],
      text: { format: { type: "json_object" } },
    });

    const analyzed = normalizeAnalyzeResponse(parseJson(response.output_text));

    if (!analyzed.summary || analyzed.totalScore === 0) {
      console.error("Invalid analyze response shape:", analyzed);
      return NextResponse.json(
        { message: "OpenAI 응답에 분석 결과가 부족해요. 다시 시도해주세요." },
        { status: 502 },
      );
    }

    return NextResponse.json(analyzed);
  } catch (error) {
    console.error("OpenAI analyze call failed:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `AI 블로그 코치 분석 실패: ${error.message}`
            : "AI 블로그 코치 분석 중 알 수 없는 문제가 생겼어요.",
      },
      { status: 500 },
    );
  }
}
