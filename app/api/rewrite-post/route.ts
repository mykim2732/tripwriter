import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { consumeApiCredit } from "@/lib/server-credits";

const OPENAI_MODEL = "gpt-4.1-mini";

type RewriteRequest = {
  title?: string;
  content?: string;
  platform?: string;
  style?: string;
  tags?: string[];
  photoCaptions?: string[];
};

type RewriteItem = {
  mode: string;
  title: string;
  content: string;
  summary: string;
};

type RewriteResponse = {
  rewrites: RewriteItem[];
};

const rewriteModes = [
  "더 감성적으로",
  "더 SEO 중심",
  "더 전문가처럼",
  "더 짧게",
  "더 길게",
  "더 친근하게",
  "더 클릭 잘되는 제목",
  "더 정보형으로",
  "더 후기처럼",
  "더 CTA가 자연스럽게",
];

function normalizeRewriteResponse(value: Partial<RewriteResponse>): RewriteResponse {
  const rewrites = Array.isArray(value.rewrites)
    ? value.rewrites
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const record = item as Record<string, unknown>;
          return {
            mode: String(record.mode || "다시 쓰기"),
            title: String(record.title || ""),
            content: String(record.content || ""),
            summary: String(record.summary || "문체를 조정했어요."),
          };
        })
        .filter((item) => item.content.trim())
    : [];

  return { rewrites: rewrites.slice(0, 10) };
}

function parseJson(text: string) {
  try {
    return JSON.parse(text) as Partial<RewriteResponse>;
  } catch (error) {
    console.error("Rewrite JSON parsing failed", error, text);
    throw new Error("AI 다시쓰기 응답을 JSON으로 해석하지 못했어요.");
  }
}

export async function POST(request: NextRequest) {
  let input: RewriteRequest;

  try {
    input = (await request.json()) as RewriteRequest;
  } catch (error) {
    console.error("Rewrite request JSON parsing failed", error);
    return NextResponse.json({ message: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  if (!input.content?.trim()) {
    return NextResponse.json({ message: "다시 쓸 본문이 비어 있어요." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ message: "OPENAI_API_KEY가 설정되어 있지 않아요." }, { status: 500 });
  }

  const credit = await consumeApiCredit(request, "polishPost", "AI Rewrite Pro");
  if (!credit.ok) return credit.response;

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "developer",
          content: `당신은 Posty AI의 전문 콘텐츠 리라이터입니다. 같은 원문을 10가지 실전 스타일로 즉시 다시 작성합니다.\n\n원칙:\n- 사실을 새로 만들지 않습니다.\n- 사진 설명과 태그가 있으면 자연스럽게 반영합니다.\n- Markdown 기호 **, ##, 코드블록을 그대로 남기지 않습니다.\n- 각 버전은 제목과 본문이 확실히 다르게 느껴져야 합니다.\n- SEO형은 키워드와 소제목을 자연스럽게 강화합니다.\n- 감성형은 여백과 감정 표현을 살립니다.\n- 전문가형은 구조와 신뢰감을 강화합니다.\n- 짧게/길게 버전은 길이 차이가 분명해야 합니다.\n- 반환은 JSON만 사용합니다.\n\n반환 형식:\n{ "rewrites": [{ "mode": "더 감성적으로", "title": "...", "content": "...", "summary": "..." }] }`,
        },
        {
          role: "user",
          content: `아래 글을 다음 10가지 모드로 다시 작성하세요.\n\n모드:\n${rewriteModes.join("\n")}\n\n플랫폼: ${input.platform || "naver"}\n스타일: ${input.style || ""}\n현재 제목: ${input.title || ""}\n태그: ${(input.tags || []).join(", ")}\n사진 설명: ${(input.photoCaptions || []).join(" / ")}\n\n원문:\n${input.content}`,
        },
      ],
      text: { format: { type: "json_object" } },
    });

    const data = normalizeRewriteResponse(parseJson(response.output_text));
    if (data.rewrites.length === 0) {
      return NextResponse.json({ message: "AI가 다시쓰기 결과를 만들지 못했어요." }, { status: 502 });
    }

    return NextResponse.json(data, { headers: credit.headers });
  } catch (error) {
    console.error("OpenAI rewrite call failed", error);
    return NextResponse.json(
      { message: error instanceof Error ? `AI 다시쓰기 실패: ${error.message}` : "AI 다시쓰기 중 문제가 생겼어요." },
      { status: 500 },
    );
  }
}
