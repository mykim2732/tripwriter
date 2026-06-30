import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const OPENAI_MODEL = "gpt-4.1-mini";

type QualityRequest = {
  title?: string;
  content?: string;
  titles?: string[];
  keywords?: string;
  photoCaptions?: string[];
  photoSummary?: string;
  platform?: string;
};

type QualityResponse = {
  score: number;
  issues: string[];
  aiLikeExpressions: string[];
  repeatedPhrases: string[];
  overstatements: string[];
  photoMismatchNotes: string[];
  seoSuggestions: string[];
  improvedContent: string;
  improvedTitleCandidates: string[];
};

function fallbackReview(input: QualityRequest): QualityResponse {
  const content = input.content || "";
  const aiLikeExpressions = ["이번 포스팅에서는", "소개해드릴게요", "함께 알아볼까요", "놓치지 마세요", "완벽한", "최고의", "강력 추천"].filter((phrase) => content.includes(phrase));
  const repeatedPhrases = findRepeatedStarts(content);
  const overstatements = ["완벽한", "최고의", "무조건", "역대급", "필수템"].filter((phrase) => content.includes(phrase));
  const hasPhotoInput = Boolean(input.photoCaptions?.length || input.photoSummary);
  const photoMismatchNotes = hasPhotoInput && !/사진|장면|이미지|보이/.test(content) ? ["사진 설명이 본문에 충분히 연결되지 않았어요."] : [];
  const keyword = input.keywords?.split(",")[0]?.trim();
  const seoSuggestions = keyword && !content.includes(keyword) ? [`핵심 키워드 "${keyword}"를 첫 문단이나 소제목에 자연스럽게 넣어보세요.`] : [];
  const issues = [...aiLikeExpressions.map((item) => `AI 티 나는 표현: ${item}`), ...repeatedPhrases.map((item) => `반복 시작 표현: ${item}`), ...overstatements.map((item) => `과장 표현: ${item}`), ...photoMismatchNotes, ...seoSuggestions];

  return {
    score: Math.max(60, 100 - issues.length * 7),
    issues,
    aiLikeExpressions,
    repeatedPhrases,
    overstatements,
    photoMismatchNotes,
    seoSuggestions,
    improvedContent: softenContent(content),
    improvedTitleCandidates: (input.titles?.length ? input.titles : [input.title || "콘텐츠 제목"]).slice(0, 3),
  };
}

export async function POST(request: NextRequest) {
  let input: QualityRequest;

  try {
    input = (await request.json()) as QualityRequest;
  } catch {
    return NextResponse.json({ message: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  if (!input.content?.trim()) {
    return NextResponse.json({ message: "검수할 본문이 비어 있어요." }, { status: 400 });
  }

  const fallback = fallbackReview(input);
  if (!process.env.OPENAI_API_KEY) return NextResponse.json(fallback);

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "developer",
          content: `당신은 Posty AI의 발행 전 품질 검수자입니다.
AI 티 나는 표현, 반복 문장, 과장 표현, 사진 설명과 본문 불일치, SEO 부족을 점검하고 자연스럽게 개선합니다.
사실을 새로 만들지 말고, 사진과 사용자 입력에 없는 효능/성능/가격/운영 정보는 단정하지 마세요.

JSON only:
{
  "score": 0,
  "issues": ["..."],
  "aiLikeExpressions": ["..."],
  "repeatedPhrases": ["..."],
  "overstatements": ["..."],
  "photoMismatchNotes": ["..."],
  "seoSuggestions": ["..."],
  "improvedContent": "...",
  "improvedTitleCandidates": ["..."]
}`,
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
      text: { format: { type: "json_object" } },
    });
    const parsed = JSON.parse(response.output_text) as Partial<QualityResponse>;
    return NextResponse.json(normalizeQuality(parsed, fallback));
  } catch (error) {
    console.error("Content quality review failed:", error);
    return NextResponse.json(fallback);
  }
}

function normalizeQuality(value: Partial<QualityResponse>, fallback: QualityResponse): QualityResponse {
  return {
    score: typeof value.score === "number" ? Math.max(0, Math.min(100, value.score)) : fallback.score,
    issues: normalizeArray(value.issues, fallback.issues),
    aiLikeExpressions: normalizeArray(value.aiLikeExpressions, fallback.aiLikeExpressions),
    repeatedPhrases: normalizeArray(value.repeatedPhrases, fallback.repeatedPhrases),
    overstatements: normalizeArray(value.overstatements, fallback.overstatements),
    photoMismatchNotes: normalizeArray(value.photoMismatchNotes, fallback.photoMismatchNotes),
    seoSuggestions: normalizeArray(value.seoSuggestions, fallback.seoSuggestions),
    improvedContent: typeof value.improvedContent === "string" && value.improvedContent.trim() ? value.improvedContent : fallback.improvedContent,
    improvedTitleCandidates: normalizeArray(value.improvedTitleCandidates, fallback.improvedTitleCandidates).slice(0, 5),
  };
}

function normalizeArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : fallback;
}

function findRepeatedStarts(content: string) {
  const starts = content.split(/\n+/).map((line) => line.trim().split(/\s+/).slice(0, 2).join(" ")).filter((item) => item.length > 1);
  return Array.from(new Set(starts.filter((start, index) => starts.indexOf(start) !== index))).slice(0, 5);
}

function softenContent(content: string) {
  return content
    .replaceAll("이번 포스팅에서는", "오늘은")
    .replaceAll("소개해드릴게요", "정리해볼게요")
    .replaceAll("함께 알아볼까요", "차분히 살펴볼게요")
    .replaceAll("놓치지 마세요", "필요한 분들은 참고해보세요")
    .replaceAll("완벽한", "잘 맞는")
    .replaceAll("최고의", "인상적인")
    .replaceAll("강력 추천", "추천");
}
