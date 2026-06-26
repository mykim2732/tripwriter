import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const OPENAI_MODEL = "gpt-4.1-mini";

type GenerateTitlesRequest = {
  content?: string;
  place?: string;
  style?: string;
  persona?: string;
  tags?: string[];
  currentTitles?: string[];
  platform?: string;
};

type GenerateTitlesResponse = {
  titles: string[];
};

function normalizeTitles(parsed: Partial<GenerateTitlesResponse>): GenerateTitlesResponse {
  return {
    titles: Array.isArray(parsed.titles)
      ? parsed.titles.map(String).map((title) => title.trim()).filter(Boolean).slice(0, 3)
      : [],
  };
}

function parseJson(text: string) {
  try {
    return JSON.parse(text) as Partial<GenerateTitlesResponse>;
  } catch (error) {
    console.error("Title JSON parsing failed:", error, text);
    throw new Error("OpenAI 응답을 JSON으로 해석하지 못했어요. 다시 시도해주세요.");
  }
}

export async function POST(request: NextRequest) {
  let input: GenerateTitlesRequest;

  try {
    input = (await request.json()) as GenerateTitlesRequest;
  } catch (error) {
    console.error("Generate titles request JSON parsing failed:", error);
    return NextResponse.json({ message: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  if (!input.content?.trim()) {
    return NextResponse.json({ message: "제목을 추천할 본문이 비어 있어요." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is missing for generate-titles.");
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
          content: `당신은 네이버 블로그 제목 전문가입니다.

요구사항:
- 검색자가 궁금해할 만한 제목
- 클릭하고 싶지만 과장되지 않은 제목
- 글 분위기와 persona에 맞는 제목
- 친한 친구처럼, 활발한 스타일, 따뜻한 공감형 등은 제목에 이모지 0~1개를 자연스럽게 포함
- 정보형, 기자형, 전문가형은 이모지 최소화
- 서로 다른 관점의 제목 3개 추천
- 실제 검색량을 아는 것처럼 단정하지 말 것
- JSON만 반환
- 플랫폼에 맞는 제목 톤을 반영
- 항상 클릭률, 가독성, 공감도, SEO를 고려하되 실제 검색량을 아는 것처럼 단정하지 말 것
- 본문과 제목에 Markdown 기호 **, ##, 코드블록 같은 표시를 그대로 남기지 말 것
- 일반 본문에는 **강조** 형태를 사용하지 말 것
- 강조는 자연스러운 문장으로 표현하고, 실제 굵게 표시는 앱의 HTML 변환 단계에서 처리
- 미리보기 편집기에 바로 들어갈 텍스트이므로 Markdown 문법 표시를 쓰지 말 것

반환 형식:
{
  "titles": ["제목1", "제목2", "제목3"]
}`,
        },
        {
          role: "user",
          content: `아래 글에 어울리는 네이버 블로그 제목 3개를 추천해주세요.

플랫폼: ${input.platform || "general"}
장소: ${input.place || ""}
스타일: ${input.style || ""}
페르소나: ${input.persona || ""}
태그: ${(input.tags || []).join(", ")}
현재 제목 후보:
${(input.currentTitles || []).join("\n")}

본문:
${input.content}`,
        },
      ],
      text: { format: { type: "json_object" } },
    });

    const generated = normalizeTitles(parseJson(response.output_text));

    if (generated.titles.length < 3) {
      console.error("Invalid title response shape:", generated);
      return NextResponse.json(
        { message: "OpenAI 응답에 제목 후보가 부족해요. 다시 시도해주세요." },
        { status: 502 },
      );
    }

    return NextResponse.json(generated);
  } catch (error) {
    console.error("OpenAI title generation failed:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `제목 추천 실패: ${error.message}`
            : "제목 추천 중 알 수 없는 문제가 생겼어요.",
      },
      { status: 500 },
    );
  }
}







