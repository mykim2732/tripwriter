import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const OPENAI_MODEL = "gpt-4.1-mini";

type PolishRequest = {
  content?: string;
  titles?: string[];
  tags?: string[];
  photoUrls?: string[];
  options?: {
    emphasizeHeadings?: boolean;
    boldKeySentences?: boolean;
    showTags?: boolean;
    showCaptions?: boolean;
    fontFamily?: string;
    fontSize?: string;
    textAlign?: string;
    emojiHeadings?: boolean;
    checkKeySentences?: boolean;
    wideParagraphSpacing?: boolean;
    platform?: string;
    photoCaptions?: string[];
  };
};

type ImagePlacement = {
  url: string;
  positionHint: string;
  caption: string;
};

type PolishResponse = {
  polishedContent: string;
  html: string;
  imagePlacements: ImagePlacement[];
  improvementSummary: string[];
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizePolishResponse(parsed: Partial<PolishResponse>): PolishResponse {
  return {
    polishedContent:
      typeof parsed.polishedContent === "string" ? parsed.polishedContent : "",
    html: typeof parsed.html === "string" ? parsed.html : "",
    imagePlacements: Array.isArray(parsed.imagePlacements)
      ? parsed.imagePlacements
          .filter((item) => item && typeof item.url === "string")
          .map((item) => ({
            url: String(item.url),
            positionHint: String(item.positionHint || "본문 중간"),
            caption: String(item.caption || "블로그 이미지"),
          }))
      : [],
    improvementSummary: Array.isArray(parsed.improvementSummary)
      ? parsed.improvementSummary.map(String).filter(Boolean)
      : [],
  };
}

function parseJson(text: string) {
  try {
    return JSON.parse(text) as Partial<PolishResponse>;
  } catch (error) {
    console.error("Polish JSON parsing failed:", error, text);
    throw new Error("OpenAI 응답을 JSON으로 해석하지 못했어요. 다시 시도해주세요.");
  }
}

export async function POST(request: NextRequest) {
  let input: PolishRequest;

  try {
    input = (await request.json()) as PolishRequest;
  } catch (error) {
    console.error("Polish request JSON parsing failed:", error);
    return NextResponse.json(
      { message: "요청 형식이 올바르지 않아요." },
      { status: 400 },
    );
  }

  if (!input.content?.trim()) {
    return NextResponse.json(
      { message: "다듬을 본문이 비어 있어요." },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is missing for polish-post.");
    return NextResponse.json(
      { message: "OPENAI_API_KEY가 설정되어 있지 않아요. .env.local을 확인해주세요." },
      { status: 500 },
    );
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const safeContent = escapeHtml(input.content);
    const safeTitles = (input.titles || []).map(escapeHtml);
    const safeTags = (input.tags || []).map(escapeHtml);
    const safePhotoUrls = (input.photoUrls || []).map(escapeHtml);

    const response = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "developer",
          content: `당신은 네이버 블로그 전문 편집자입니다.
사용자의 블로그 초안을 네이버 블로그에서 읽기 좋게 다듬습니다.

작업 원칙:
- 글의 핵심 흐름은 유지
- 사실을 새로 지어내지 않음
- 문단을 읽기 좋게 나눔
- 소제목을 자연스럽게 보강
- 중요한 문장은 문장 자체를 자연스럽게 다듬고, Markdown **강조** 표시는 남기지 않음
- 필요하면 인용문 박스 형태로 변환
- 필요하면 체크리스트/번호 목록으로 정리
- 광고 같은 표현은 제거
- 너무 과한 이모지는 금지
- 네이버 블로그에 어울리는 자연스러운 문체 유지
- 항상 클릭률, 가독성, 사진 활용, 공감도, SEO를 고려
- 모바일에서 읽기 쉬운 줄바꿈과 문단 흐름 유지
- 최근 콘텐츠 소비 트렌드를 반영하되 실제 데이터를 아는 것처럼 단정하지 말 것
- 네이버/티스토리는 긴 글, 소제목, 사진 배치, 검색 키워드 중심으로 다듬기
- 스레드는 짧고 자연스러운 대화형, 댓글/공감 유도, 과하지 않은 이모지 중심으로 다듬기
- 사진이 있으면 기존 사진 설명과 배치를 고려하고, 사진 URL을 누락하지 말 것
- 옵션에 따라 소제목 앞에 이모지 추가 가능
- 글 분위기에 맞는 이모지를 적절히 삽입
- 과한 이모지 남발 금지
- 네이버 블로그에서 보기 좋은 줄바꿈 유지
- 핵심 문장 앞에 ✅ 또는 강조 기호를 사용할 수 있음
- 사진 삽입 위치를 추천
- 본문과 제목에 Markdown 기호 **, ##, 코드블록 같은 표시를 그대로 남기지 말 것
- 일반 본문에는 **강조** 형태를 사용하지 말 것
- 강조는 자연스러운 문장으로 표현하고, 실제 굵게 표시는 앱의 HTML 변환 단계에서 처리
- 미리보기 편집기에 바로 들어갈 텍스트이므로 Markdown 문법 표시를 쓰지 말 것
- 사용자 입력 HTML은 이미 escape된 텍스트이므로, 실제 사실은 바꾸지 말고 편집만 하세요.

반환은 반드시 JSON만 사용하세요:
{
  "polishedContent": "Markdown 형식의 다듬어진 본문",
  "html": "발행용 HTML",
  "imagePlacements": [
    {
      "url": "이미지 URL",
      "positionHint": "도입부 아래",
      "caption": "사진 설명"
    }
  ],
  "improvementSummary": [
    "소제목을 추가했습니다",
    "긴 문단을 나눴습니다"
  ]
}`,
        },
        {
          role: "user",
          content: `아래 블로그 초안을 발행 전 편집용으로 다듬어 주세요.

본문 escape 텍스트:
${safeContent}

제목 후보:
${safeTitles.join("\n")}

태그:
${safeTags.join(", ")}

사진 URL:
${safePhotoUrls.join("\n")}

옵션:
- 소제목 강조: ${Boolean(input.options?.emphasizeHeadings)}
- 핵심 문장 굵게: ${Boolean(input.options?.boldKeySentences)}
- 태그 표시: ${Boolean(input.options?.showTags)}
- 사진 캡션 표시: ${Boolean(input.options?.showCaptions)}
- fontFamily: ${input.options?.fontFamily || "기본"}
- fontSize: ${input.options?.fontSize || "기본"}
- textAlign: ${input.options?.textAlign || "왼쪽"}
- 이모지 소제목 사용: ${Boolean(input.options?.emojiHeadings)}
- 핵심 문장 앞 체크 표시: ${Boolean(input.options?.checkKeySentences)}
- 문단 간격 넓게: ${Boolean(input.options?.wideParagraphSpacing)}
- 플랫폼: ${input.options?.platform || "naver"}
- 사진 설명: ${(input.options?.photoCaptions || []).join(", ")}

HTML 작성 규칙:
- html 필드는 네이버 블로그 발행 전 미리보기용 HTML 문자열로 작성하세요.
- 문단은 <p>, 소제목은 <h2>, 이미지는 <figure><img /></figure> 형태를 사용하세요.
- 사용자 본문에서 온 텍스트는 HTML 태그로 실행되지 않게 안전하게 다루세요.
- fontFamily/fontSize/textAlign은 최상위 wrapper style에 반영하세요.
- emojiHeadings가 true면 소제목 앞에 분위기에 맞는 이모지를 0~1개 추가하세요.
- checkKeySentences가 true면 중요한 문장 앞에 ✅를 자연스럽게 붙일 수 있습니다.
- wideParagraphSpacing이 true면 HTML 문단 margin을 조금 넓게 설정하세요.
- 본문과 제목에 Markdown 기호 **, ##, 코드블록 같은 표시를 그대로 남기지 말 것
- 일반 본문에는 **강조** 형태를 사용하지 말 것
- 강조는 자연스러운 문장으로 표현하고, 실제 굵게 표시는 앱의 HTML 변환 단계에서 처리
- 미리보기 편집기에 바로 들어갈 텍스트이므로 Markdown 문법 표시를 쓰지 말 것`,
        },
      ],
      text: { format: { type: "json_object" } },
    });

    const polished = normalizePolishResponse(parseJson(response.output_text));

    if (!polished.polishedContent || !polished.html) {
      console.error("Invalid polish response shape:", polished);
      return NextResponse.json(
        { message: "OpenAI 응답에 다듬어진 본문 또는 HTML이 부족해요." },
        { status: 502 },
      );
    }

    return NextResponse.json(polished);
  } catch (error) {
    console.error("OpenAI polish call failed:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `AI 꾸미기 실패: ${error.message}`
            : "AI 꾸미기 중 알 수 없는 문제가 생겼어요.",
      },
      { status: 500 },
    );
  }
}









