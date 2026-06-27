import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const OPENAI_MODEL = "gpt-4.1-mini";

type AnalyzePhotosRequest = {
  photos?: { url: string; name?: string }[];
  platform?: "naver" | "tistory" | "threads" | "detail";
  contentType?: string;
  context?: {
    title?: string;
    place?: string;
    keywords?: string;
    style?: string;
  };
};

type PhotoAnalysisResponse = {
  photos: {
    url: string;
    caption: string;
    shortMemo?: string;
    recommendedUse?: string;
    decoratorSuggestions?: {
      type: string;
      text?: string;
      position?: string;
    }[];
  }[];
  coverPhotoUrl: string;
  coverReason: string;
  photoOrder: string[];
  summary: string;
};

function parseJson(text: string) {
  try {
    return JSON.parse(text) as Partial<PhotoAnalysisResponse>;
  } catch (error) {
    console.error("Photo analysis JSON parsing failed:", error, text);
    throw new Error("OpenAI 사진 분석 응답을 JSON으로 해석하지 못했어요.");
  }
}

function normalizeResponse(parsed: Partial<PhotoAnalysisResponse>, urls: string[]): PhotoAnalysisResponse {
  const photos = Array.isArray(parsed.photos)
    ? parsed.photos
        .filter((photo) => photo && typeof photo.url === "string")
        .map((photo) => ({
          url: String(photo.url),
          caption: String(photo.caption || "사진 설명 추가"),
          shortMemo: typeof photo.shortMemo === "string" ? photo.shortMemo : "",
          recommendedUse: typeof photo.recommendedUse === "string" ? photo.recommendedUse : "",
          decoratorSuggestions: Array.isArray(photo.decoratorSuggestions)
            ? photo.decoratorSuggestions.map((decorator) => ({
                type: String(decorator.type || "sparkle"),
                text: typeof decorator.text === "string" ? decorator.text : "",
                position: String(decorator.position || "top-left"),
              }))
            : [],
        }))
    : [];

  return {
    photos,
    coverPhotoUrl: typeof parsed.coverPhotoUrl === "string" ? parsed.coverPhotoUrl : urls[0] || "",
    coverReason: typeof parsed.coverReason === "string" ? parsed.coverReason : "첫 번째 사진이 대표 이미지로 무난해 보여요.",
    photoOrder: Array.isArray(parsed.photoOrder) ? parsed.photoOrder.map(String).filter((url) => urls.includes(url)) : urls,
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
  };
}

export async function POST(request: NextRequest) {
  let input: AnalyzePhotosRequest;

  try {
    input = (await request.json()) as AnalyzePhotosRequest;
  } catch (error) {
    console.error("Photo analysis request parsing failed:", error);
    return NextResponse.json({ message: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  const photos = (input.photos || []).filter((photo) => photo.url?.trim()).slice(0, 12);

  if (photos.length === 0) {
    return NextResponse.json({ message: "분석할 사진이 없어요." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is missing for analyze-photos.");
    return NextResponse.json({ message: "OPENAI_API_KEY가 설정되어 있지 않아요. .env.local을 확인해주세요." }, { status: 500 });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const urls = photos.map((photo) => photo.url);
    const response = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: `당신은 블로그/SNS/상세페이지 사진 큐레이터입니다.
사진을 보고 짧고 자연스러운 사진 설명, 감성 메모, 추천 용도, 대표사진, 추천 순서, 꾸미기 제안을 만듭니다.

규칙:
- 사진 설명은 짧고 자연스럽게 작성
- 사진 내용을 과장하거나 없는 것을 단정하지 않음
- 텍스트가 잘 안 보이면 추측하지 않음
- 블로그는 감성/정보 균형
- 스레드는 짧고 반응 좋은 문구 중심
- 상세페이지는 상품 장점과 구매 포인트 중심
- decorator는 사진당 1~2개만 추천
- 과하게 꾸미지 않음
- 반환은 반드시 JSON만 사용`,
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `플랫폼: ${input.platform || "naver"}
콘텐츠 타입: ${input.contentType || "blog"}
제목: ${input.context?.title || ""}
장소/브랜드: ${input.context?.place || ""}
키워드: ${input.context?.keywords || ""}
스타일: ${input.context?.style || ""}

반환 JSON:
{
  "photos": [
    {
      "url": "...",
      "caption": "사진 설명",
      "shortMemo": "짧은 감성 메모",
      "recommendedUse": "대표사진 | 도입부 | 본문 중간 | 마무리 | 상세 장점 | 스레드 이미지",
      "decoratorSuggestions": [
        {
          "type": "arrow | circle | heart | star | sparkle | memo | polaroid | maskingTape",
          "text": "짧은 문구",
          "position": "top-left | top-right | bottom-left | bottom-right | center"
        }
      ]
    }
  ],
  "coverPhotoUrl": "...",
  "coverReason": "대표사진으로 추천한 이유",
  "photoOrder": ["url1", "url2"],
  "summary": "사진 전체 분위기 요약"
}`,
            },
            ...photos.flatMap((photo, index) => [
              { type: "input_text" as const, text: `사진 ${index + 1}: ${photo.name || photo.url}` },
              { type: "input_image" as const, image_url: photo.url, detail: "low" as const },
            ]),
          ],
        },
      ],
      text: { format: { type: "json_object" } },
    });

    return NextResponse.json(normalizeResponse(parseJson(response.output_text), urls));
  } catch (error) {
    console.error("OpenAI photo analysis failed:", error);
    return NextResponse.json(
      { message: error instanceof Error ? `사진 분석 실패: ${error.message}` : "사진 분석 중 알 수 없는 문제가 생겼어요." },
      { status: 500 },
    );
  }
}
