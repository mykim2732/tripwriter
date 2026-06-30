import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import {
  fallbackContentPlan,
  normalizeContentPlan,
  type PostyContentPlan,
  type PostyPlanInput,
} from "@/lib/posty-brain";

const OPENAI_MODEL = "gpt-4.1-mini";

export async function POST(request: NextRequest) {
  let input: PostyPlanInput;

  try {
    input = (await request.json()) as PostyPlanInput;
  } catch {
    return NextResponse.json({ message: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  const fallback = fallbackContentPlan(input);
  if (!process.env.OPENAI_API_KEY) return NextResponse.json(fallback);

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "developer",
          content: `당신은 Posty AI의 콘텐츠 시작 플래너입니다.
아직 최종 원고를 쓰지는 않습니다. 사진, 키워드, 리뷰 리서치, 말투, 플랫폼을 보고 글을 쓰기 전의 작성 계획만 만듭니다.
사진이 콘텐츠의 뼈대가 되도록 photoStoryline을 구체적으로 작성하세요.
모르는 내용은 추정하지 말고, 사용자가 입력한 사실과 사진 분석 결과만 기반으로 계획하세요.

JSON only:
{
  "contentGoal": "...",
  "targetReader": "...",
  "photoStoryline": ["..."],
  "suggestedSections": ["..."],
  "coverPhotoReason": "...",
  "tonePlan": "...",
  "seoPlan": "...",
  "designPlan": "...",
  "publishPlan": "..."
}`,
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
      text: { format: { type: "json_object" } },
    });
    const parsed = JSON.parse(response.output_text) as Partial<PostyContentPlan>;
    return NextResponse.json(normalizeContentPlan(parsed, fallback));
  } catch (error) {
    console.error("Posty planner failed:", error);
    return NextResponse.json(fallback);
  }
}
