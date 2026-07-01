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
  reviewResearch?: unknown;
};

type QualityResponse = {
  score: number;
  humanLikeScore: number;
  issues: string[];
  aiLikeExpressions: string[];
  repeatedPhrases: string[];
  overstatements: string[];
  unsupportedExperienceClaims: string[];
  reviewExperienceConfusion: string[];
  photoMismatchNotes: string[];
  seoSuggestions: string[];
  improvedContent: string;
  improvedTitleCandidates: string[];
};

function fallbackReview(input: QualityRequest): QualityResponse {
  const content = input.content || "";
  const aiLikeExpressions = ["이번 포스팅에서는", "소개해드릴게요", "함께 알아볼까요", "놓치지 마세요", "완벽한", "최고의", "강력 추천"].filter((phrase) => content.includes(phrase));
  const repeatedPhrases = findRepeatedStarts(content);
  const overstatements = ["완벽한", "최고의", "무조건", "꼭 가야", "필수템"].filter((phrase) => content.includes(phrase));
  const unsupportedExperienceClaims = ["직접 써보니", "먹어보니", "다녀와보니"].filter((phrase) => content.includes(phrase) && !input.content?.includes("저는"));
  const hasReviewResearch = JSON.stringify(input.reviewResearch || {}).length > 5;
  const reviewExperienceConfusion = hasReviewResearch && /후기에서|리뷰에서/.test(content) && /제가 직접|내가 직접/.test(content)
    ? ["타인 리뷰 참고 내용과 내 직접 경험이 같은 문단에서 섞였을 수 있어요."]
    : [];
  const hasPhotoInput = Boolean(input.photoCaptions?.length || input.photoSummary);
  const photoMismatchNotes = hasPhotoInput && !/사진|장면|이미지|보이는|컷/.test(content) ? ["사진 설명이 본문에 충분히 연결되지 않았어요."] : [];
  const keyword = input.keywords?.split(",")[0]?.trim();
  const seoSuggestions = keyword && !content.includes(keyword) ? [`핵심 키워드 "${keyword}"를 첫 문단이나 소제목에 자연스럽게 넣어보세요.`] : [];
  const issues = [
    ...aiLikeExpressions.map((item) => `AI스러운 표현: ${item}`),
    ...repeatedPhrases.map((item) => `반복 문장 시작: ${item}`),
    ...overstatements.map((item) => `과장 표현: ${item}`),
    ...unsupportedExperienceClaims.map((item) => `경험 없는 단정 가능성: ${item}`),
    ...reviewExperienceConfusion,
    ...photoMismatchNotes,
    ...seoSuggestions,
  ];
  const humanLikeScore = Math.max(45, 100 - aiLikeExpressions.length * 8 - repeatedPhrases.length * 5 - overstatements.length * 8 - reviewExperienceConfusion.length * 10);

  return {
    score: Math.max(55, 100 - issues.length * 6),
    humanLikeScore,
    issues,
    aiLikeExpressions,
    repeatedPhrases,
    overstatements,
    unsupportedExperienceClaims,
    reviewExperienceConfusion,
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
    return NextResponse.json({ message: "검사할 본문이 비어 있어요." }, { status: 400 });
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
본문에서 사람이 쓴 느낌, AI스러운 표현, 반복 문장, 과장, 경험 없는 단정, 사진 불일치, SEO 부족, 타인 리뷰 참고와 내 경험 혼동을 검사합니다.
새 사실을 만들지 말고, 사진과 사용자 입력에 없는 효능/성능/가격/운영 정보를 단정하지 마세요.
개선안은 더 자연스럽고 담백하게 다듬되 원문의 의미를 크게 바꾸지 마세요.

JSON only:
{
  "score": 0,
  "humanLikeScore": 0,
  "issues": ["..."],
  "aiLikeExpressions": ["..."],
  "repeatedPhrases": ["..."],
  "overstatements": ["..."],
  "unsupportedExperienceClaims": ["..."],
  "reviewExperienceConfusion": ["..."],
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
    score: clampScore(value.score, fallback.score),
    humanLikeScore: clampScore(value.humanLikeScore, fallback.humanLikeScore),
    issues: normalizeArray(value.issues, fallback.issues),
    aiLikeExpressions: normalizeArray(value.aiLikeExpressions, fallback.aiLikeExpressions),
    repeatedPhrases: normalizeArray(value.repeatedPhrases, fallback.repeatedPhrases),
    overstatements: normalizeArray(value.overstatements, fallback.overstatements),
    unsupportedExperienceClaims: normalizeArray(value.unsupportedExperienceClaims, fallback.unsupportedExperienceClaims),
    reviewExperienceConfusion: normalizeArray(value.reviewExperienceConfusion, fallback.reviewExperienceConfusion),
    photoMismatchNotes: normalizeArray(value.photoMismatchNotes, fallback.photoMismatchNotes),
    seoSuggestions: normalizeArray(value.seoSuggestions, fallback.seoSuggestions),
    improvedContent: typeof value.improvedContent === "string" && value.improvedContent.trim() ? value.improvedContent : fallback.improvedContent,
    improvedTitleCandidates: normalizeArray(value.improvedTitleCandidates, fallback.improvedTitleCandidates).slice(0, 5),
  };
}

function clampScore(value: unknown, fallback: number) {
  return typeof value === "number" ? Math.max(0, Math.min(100, value)) : fallback;
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
    .replaceAll("함께 알아볼까요", "차분히 볼게요")
    .replaceAll("놓치지 마세요", "필요한 분들은 참고해보세요")
    .replaceAll("완벽한", "잘 맞는")
    .replaceAll("최고의", "인상적인")
    .replaceAll("강력 추천", "추천");
}
