import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { consumeApiCredit } from "@/lib/server-credits";

const OPENAI_MODEL = "gpt-4.1-mini";

type TrendRequest = {
  title?: string;
  content?: string;
  platform?: string;
  style?: string;
  tags?: string[];
  place?: string;
};

type TrendResponse = {
  summary: string;
  keywords: string[];
  expressions: string[];
  contentAngles: string[];
  titleIdeas: string[];
  quickWins: string[];
};

function normalize(value: Partial<TrendResponse>): TrendResponse {
  const list = (items: unknown) => Array.isArray(items) ? items.map(String).filter(Boolean).slice(0, 8) : [];
  return {
    summary: typeof value.summary === "string" ? value.summary : "검색 친화적인 표현과 콘텐츠 각도를 정리했어요.",
    keywords: list(value.keywords),
    expressions: list(value.expressions),
    contentAngles: list(value.contentAngles),
    titleIdeas: list(value.titleIdeas),
    quickWins: list(value.quickWins),
  };
}

function parseJson(text: string) {
  try {
    return JSON.parse(text) as Partial<TrendResponse>;
  } catch (error) {
    console.error("Trend JSON parsing failed", error, text);
    throw new Error("AI 트렌드 응답을 JSON으로 해석하지 못했어요.");
  }
}

export async function POST(request: NextRequest) {
  let input: TrendRequest;

  try {
    input = (await request.json()) as TrendRequest;
  } catch (error) {
    console.error("Trend request JSON parsing failed", error);
    return NextResponse.json({ message: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  if (!input.title?.trim() && !input.content?.trim()) {
    return NextResponse.json({ message: "트렌드를 추천할 제목이나 본문이 필요해요." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ message: "OPENAI_API_KEY가 설정되어 있지 않아요." }, { status: 500 });
  }

  const credit = await consumeApiCredit(request, "generatePost", "AI Trend");
  if (!credit.ok) return credit.response;

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "developer",
          content: `당신은 한국 콘텐츠 트렌드 에디터입니다. 실제 검색량 데이터에 접근한 것처럼 단정하지 않고, 최근 블로그/SNS 소비 트렌드에 맞는 검색 친화 키워드, 표현, 제목 각도, 빠른 개선점을 제안합니다. 반환은 JSON만 사용하세요.`,
        },
        {
          role: "user",
          content: `플랫폼: ${input.platform || "naver"}\n스타일: ${input.style || ""}\n장소/주제: ${input.place || ""}\n현재 제목: ${input.title || ""}\n현재 태그: ${(input.tags || []).join(", ")}\n본문 일부:\n${(input.content || "").slice(0, 4000)}\n\n다음 JSON을 작성하세요.\n{\n  "summary": "트렌드 방향 요약",\n  "keywords": ["추천 키워드"],\n  "expressions": ["요즘 자연스럽게 쓰기 좋은 표현"],\n  "contentAngles": ["콘텐츠 각도"],\n  "titleIdeas": ["클릭 친화 제목"],\n  "quickWins": ["바로 적용할 수정" ]\n}\n\n주의: 실제 검색량 수치를 안다고 말하지 말고, '가능성이 있어요', '검색 친화적으로 보입니다'처럼 조심스럽게 표현하세요.`,
        },
      ],
      text: { format: { type: "json_object" } },
    });

    return NextResponse.json(normalize(parseJson(response.output_text)), { headers: credit.headers });
  } catch (error) {
    console.error("OpenAI trend call failed", error);
    return NextResponse.json(
      { message: error instanceof Error ? `AI 트렌드 추천 실패: ${error.message}` : "AI 트렌드 추천 중 문제가 생겼어요." },
      { status: 500 },
    );
  }
}
