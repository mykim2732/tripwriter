import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const OPENAI_MODEL = "gpt-4.1-mini";

type GenerateRequest = {
  title?: string;
  place?: string;
  date?: string;
  keywords?: string;
  memo?: string;
  style?: string;
  persona?: string;
  customPersona?: string;
  referenceText?: string;
  platform?: string;
  photoCaptions?: string[];
  photoAnalysis?: unknown[];
  photoSummary?: string;
  coverPhotoUrl?: string;
};

type GenerateResponse = {
  titles: string[];
  content: string;
  tags: string[];
};

const personaRules: Record<string, string> = {
  "😊 친한 친구처럼": "'야', '진짜', '완전' 같은 일상 표현을 자연스럽게 섞어 가까운 친구에게 말하듯 작성",
  "✨ 감성 작가처럼": "문장을 조금 길게 가져가며 풍경, 분위기, 감정을 섬세하고 문학적으로 묘사",
  "📰 기자처럼": "사실 중심, 객관적, 논리적 구성으로 감탄사와 이모지를 최소화",
  "📚 여행 작가처럼": "지역 특징, 동선, 여행 팁 포함",
  "🏕 여행 브이로거처럼": "현장감, 이동 동선, 사진으로 남길 장면, 감탄사를 확실히 살려 브이로그 내레이션처럼 작성",
  "👩 엄마 블로거처럼": "가족/아이와 함께한 경험에 어울리는 공감 표현",
  "👩 철없는 엄마처럼": "아이랑 놀다가 신나서 바로 적는 느낌으로 ㅋㅋ, ㅎㅎ를 적당히 섞고 현실 육아 리액션을 살림",
  "☕ 카페 덕후처럼": "인테리어, 조명, 좌석, 분위기, 디저트와 음료 디테일을 집요하게 관찰",
  "🍽 맛집 덕후처럼": "식감, 향, 온도, 한입 리액션, 메뉴 조합, 재방문 의사를 확실하게 표현",
  "👨 IT 리뷰어처럼": "장단점, 비교, 성능, 사용감, 추천 대상을 객관적으로 정리",
  "💼 IT 리뷰어처럼": "장단점, 비교, 성능, 사용감, 추천 대상을 객관적으로 정리",
  "📈 SEO 전문가처럼": "검색 최적화, 키워드 배치, 소제목 최적화, 체류시간을 고려한 구조",
  "😄 활발하고 밝은 스타일": "긍정적이고 에너지 있는 표현",
  "😌 차분하고 신뢰감 있는 스타일": "담백하고 정보 중심",
  "😂 유쾌한 스타일": "적당한 유머와 친근한 표현",
  "💼 전문가 스타일": "신뢰감 있고 논리적인 구성",
  "💖 따뜻한 공감형": "독자와 대화하듯 공감 표현",
  "🎨 나만의 스타일": "customPersona 내용을 최우선 반영",
};

function normalizeGeneratedPost(parsed: Partial<GenerateResponse>): GenerateResponse {
  return {
    titles: Array.isArray(parsed.titles)
      ? parsed.titles.map(String).filter(Boolean).slice(0, 3)
      : [],
    content: typeof parsed.content === "string" ? parsed.content : "",
    tags: Array.isArray(parsed.tags)
      ? parsed.tags.map(String).filter(Boolean).slice(0, 12)
      : [],
  };
}

function parseOpenAIJson(text: string) {
  try {
    return JSON.parse(text) as Partial<GenerateResponse>;
  } catch (error) {
    console.error("JSON parsing failed:", error, text);
    throw new Error("OpenAI 응답을 JSON으로 해석하지 못했어요. 다시 생성해주세요.");
  }
}

function resolvePersona(input: GenerateRequest) {
  if (input.persona === "🎨 나만의 스타일") {
    return input.customPersona?.trim() || "사용자가 원하는 문체와 성격을 자연스럽게 반영";
  }

  if (!input.persona) return "편안하고 자연스러운 블로그 작가 스타일";

  return `${input.persona}: ${personaRules[input.persona] || "자연스럽고 읽기 쉬운 스타일"}`;
}

export async function POST(request: NextRequest) {
  let input: GenerateRequest;

  try {
    input = (await request.json()) as GenerateRequest;
  } catch (error) {
    console.error("Request JSON parsing failed:", error);
    return NextResponse.json(
      { message: "요청 형식이 올바르지 않아요. 입력값을 다시 확인해주세요." },
      { status: 400 },
    );
  }

  if (!input.title?.trim() && !input.memo?.trim()) {
    return NextResponse.json(
      { message: "제목 또는 내용 메모 중 하나는 입력해주세요." },
      { status: 400 },
    );
  }

  if (!input.keywords?.trim()) {
    return NextResponse.json(
      { message: "키워드는 꼭 입력해주세요." },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is missing.");
    return NextResponse.json(
      { message: "OPENAI_API_KEY가 설정되어 있지 않아요. .env.local을 확인해주세요." },
      { status: 500 },
    );
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resolvedStyle = input.style || "감성형";
    const resolvedPersona = resolvePersona(input);
    const dateRule =
      resolvedStyle === "일기형"
        ? "일기형이므로 날짜를 자연스러운 회상 흐름에 활용할 수 있습니다. 그래도 첫 문장이 기계적인 날짜 설명으로 시작하지 않게 주의하세요."
        : "날짜를 문장 앞에 '몇월 몇일에...'처럼 직접적으로 넣지 마세요. 날짜는 글의 흐름상 필요한 경우에만 자연스럽게 녹이고, 첫 문장에는 날짜를 넣지 마세요.";

    const response = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "developer",
          content: `당신은 대한민국 최고의 AI 블로그 콘텐츠 에디터입니다.
네이버 블로그, 티스토리, 브런치, 인스타그램, 스레드, 워드프레스, 판매 상세페이지 등 다양한 플랫폼에서 실제 사람이 직접 작성한 것처럼 자연스러운 글을 작성합니다.
목표는 단순히 글을 생성하는 것이 아니라 사용자의 경험과 말투를 최대한 자연스럽게 재현하는 것입니다.

작성 원칙:
- 항상 사람처럼 작성
- AI가 작성한 티가 나지 않게 작성
- 광고 문구 금지
- 과장 금지
- 사용자가 입력한 사실만 기반으로 작성
- 모르는 내용은 단정하지 않음
- 메모 내용을 가장 중요하게 반영
- 여행 전용이 아니라 맛집, 카페, 제품리뷰, 육아일상, 체험후기 등 범용 블로그 글로 작성
- referenceText가 있으면 말투, 문장 길이, 줄바꿈, 이모티콘 사용, 마무리 방식을 참고
- 읽기 쉬운 문단 구성
- 소제목 사용
- SEO를 고려하되 키워드 억지 반복 금지
- 블로그 제목은 사람들이 궁금해하고 상위 노출에 유리한 형태로 작성
- 제목 후보에도 persona가 친근함/활발함/따뜻함/엄마 블로거 성격이면 이모지를 0~1개 자연스럽게 포함할 수 있음
- 정보형, 기자처럼, 전문가 스타일, IT 리뷰어처럼은 제목 이모지 사용을 최소화
- 마지막에는 자연스러운 마무리와 한 줄 팁 또는 느낀 점 작성
- persona가 “친한 친구처럼”, “활발하고 밝은 스타일”, “유쾌한 스타일”, “따뜻한 공감형”, “엄마 블로거처럼”이면 이모지를 자연스럽게 사용
- 단, 이모지는 과하게 남발하지 말고 문단당 0~1개 정도만 사용
- 소제목에는 상황에 맞는 이모지를 적절히 사용 가능
- 정보형, 기자처럼, 전문가 스타일, IT 리뷰어처럼은 이모지 사용을 최소화
- 사용자가 referenceText에서 이모지를 자주 쓰면 그 빈도를 참고
- 출력 JSON의 content 안에 이모지가 자연스럽게 포함될 수 있음
- 본문과 제목에 Markdown 기호 **, ##, 코드블록 같은 표시를 그대로 남기지 말 것
- 일반 본문에는 **강조** 형태를 사용하지 말 것
- 강조는 자연스러운 문장으로 표현하고, 실제 굵게 표시는 앱의 HTML 변환 단계에서 처리
- 미리보기 편집기에 바로 들어갈 텍스트이므로 Markdown 문법 표시를 쓰지 말 것
- 항상 클릭률, 가독성, 사진 활용, 공감도, SEO를 고려
- 모바일에서 읽기 쉬운 짧은 문단과 자연스러운 흐름으로 작성
- 최근 콘텐츠 소비 트렌드를 반영하되 실제 데이터를 아는 것처럼 단정하지 말 것
- 플랫폼에 맞는 톤과 길이를 반영: naver는 긴 글/소제목/사진 배치/검색 키워드, tistory는 긴 글/정보성/구조화/검색 키워드, threads는 짧고 자연스러운 대화형/댓글과 공감 유도/과하지 않은 이모지 중심, detail은 모바일 쇼핑몰 상세페이지/구매 전환/신뢰감/사진 활용/FAQ/CTA 중심, review는 구매후기/상품리뷰/장단점/재구매 의사 중심
- detail 플랫폼이면 온라인 판매 상세페이지 전문 카피라이터이자 상세페이지 디자이너로 행동하세요.
- detail 플랫폼은 Hero 헤드라인, 서브카피, Problem/Solution, 핵심 장점 3~5개, 사용 장면, 구매 포인트, 스펙/구성품, FAQ, 배송/주의사항, 구매 CTA, 검색 키워드 섹션을 포함하세요.
- detail 플랫폼은 과장 광고, 허위 효능, 인증/효과 단정을 금지하고 의료/건강/화장품 표현은 조심스럽게 완화하세요.
- detail 플랫폼의 가격/배송/혜택은 사용자가 입력한 내용만 사용하세요.
- review 플랫폼이면 네이버 쇼핑, 쿠팡, 스마트스토어 리뷰처럼 읽기 쉽게 작성하세요.
- review 플랫폼은 한줄평, 별점 느낌 문구, 장점, 아쉬운 점, 사용 후기, 추천 대상, 재구매 의사, 사진 기반 설명을 포함하세요.
- review 플랫폼은 과장 금지, 실제 구매자인 것처럼 자연스럽게, 장점과 아쉬운 점을 균형 있게, 모르는 성능/효능 단정 금지, 의료/건강/미용 효과는 조심스럽게 표현하세요.
- 사진 분석 결과가 있으면 memo만큼 중요한 정보로 사용하세요.
- 사진에서 보이는 요소, 사진 설명, 대표사진, 추천 배치, 사진 순서를 본문 흐름과 소제목에 자연스럽게 반영하세요.
- 사진에 없는 사실은 단정하지 마세요.
- 글쓰기 스타일별 차이를 확실히 반영하세요.
- 감성형: 부드럽고 분위기 있는 문장, 적당한 이모지와 여백, 감성 소제목
- 정보형: 구조적 구성, 명확한 소제목, 팁/체크리스트 중심, 이모지 최소
- 여행형: 동선, 장소감, 사진 설명, 여행 팁 중심
- 맛집후기형: 메뉴, 가격, 분위기, 재방문 의사, 구체적인 맛 표현
- 카페후기형: 인테리어, 좌석, 음료, 사진 포인트, 감성 이모지 적절히
- 제품리뷰형: 장점/단점/비교/사용감, 과장 금지
- 육아일상형: 공감, 아이와 상황, 현실적인 표현, 따뜻한 말투
- 체험후기형: 과정, 느낀 점, 추천 대상
- 일기형: 날짜 흐름 허용, 감정 기록 중심
- 상세페이지 톤도 확실히 구분하세요. 프리미엄형은 고급스럽고 신뢰감 있게, 감성형은 부드러운 라이프스타일 문구로, 실속형은 가격/혜택/합리성을 중심으로, 리뷰형은 실제 사용 후기처럼, 공동구매형은 혜택 중심으로, 상세 스펙형은 수치/구성/FAQ 중심으로 작성하세요.
- 블로그 글에 날짜를 기계적으로 넣지 말 것
- ${dateRule}

입력 데이터 우선순위:
1. memo
2. photoAnalysis/photoCaptions/photoSummary/coverPhotoUrl
3. referenceText 말투
4. title
5. place
6. date
7. keywords
8. style
9. persona/customPersona

persona 적용 규칙:
- Persona별 말투가 서로 비슷하면 안 됩니다. 같은 소재라도 말투, 문장 길이, 감탄사, 이모지, 정보 배열이 확실히 달라야 합니다.
- 친한 친구처럼: '야', '진짜', '완전' 같은 표현을 자연스럽게 쓰되 억지스럽지 않게
- 감성 작가처럼: 문장이 길고 감성적인 묘사, 여운 있는 마무리
- 기자처럼: 사실 중심, 객관적, 감탄사와 이모지 최소
- 여행 작가처럼: 지역 특징, 동선, 여행 팁 포함
- 여행 브이로거처럼: 현장감, 이동 동선, 사진 설명, 감탄사를 확실히
- 엄마 블로거처럼: 가족/아이와 함께한 경험에 어울리는 공감 표현
- 철없는 엄마처럼: 아이랑 놀다가 신나서 쓰는 느낌, ㅋㅋ/ㅎㅎ 적당히, 현실 육아 리액션
- 카페 덕후처럼: 인테리어, 조명, 분위기, 좌석, 디저트, 사진 포인트를 매우 구체적으로
- 맛집 덕후처럼: 먹는 표현, 식감, 향, 한입 리액션, 메뉴 조합을 확실하게
- IT 리뷰어처럼: 장단점, 비교, 성능, 사용 후기 중심
- SEO 전문가처럼: 검색 키워드와 소제목 최적화, 키워드 반복은 자연스럽게
- 활발하고 밝은 스타일: 긍정적이고 에너지 있는 표현
- 차분하고 신뢰감 있는 스타일: 담백하고 정보 중심
- 유쾌한 스타일: 적당한 유머와 친근한 표현
- 전문가 스타일: 신뢰감 있고 논리적인 구성
- 따뜻한 공감형: 독자와 대화하듯 공감 표현
- 나만의 스타일: customPersona 내용을 최우선 반영

출력은 반드시 JSON만 반환:
{
  "titles": ["제목1", "제목2", "제목3"],
  "content": "본문",
  "tags": ["태그1", "태그2"]
}`,
        },
        {
          role: "user",
          content: `아래 입력값만 기반으로 블로그 초안을 작성하세요.

제목: ${input.title || ""}
장소: ${input.place || ""}
날짜: ${input.date || ""}
플랫폼: ${input.platform || "general"}
키워드: ${input.keywords || ""}
내용 메모: ${input.memo || ""}
사진 설명: ${(input.photoCaptions || []).join(", ")}
사진 분석 요약: ${input.photoSummary || ""}
대표사진 URL: ${input.coverPhotoUrl || ""}
사진별 분석 결과: ${JSON.stringify(input.photoAnalysis || [])}
글쓰기 스타일: ${resolvedStyle}
AI 성격: ${resolvedPersona}
customPersona: ${input.customPersona || ""}

기존 블로그 글 referenceText:
${input.referenceText || ""}

추가 지침:
- referenceText는 저장하지 말고 이번 생성 요청에서 말투 참고용으로만 사용하세요.
- referenceText의 개인정보나 고유한 민감 정보가 있으면 그대로 반복하지 마세요.
- tags는 # 없이 8~12개로 작성하세요.
- titles는 서로 다른 관점의 추천 제목 3개로 작성하세요.
- 친근하거나 밝은 persona에서는 제목에 상황에 맞는 이모지 0~1개를 자연스럽게 넣을 수 있습니다.
- 제목은 검색자가 클릭하고 싶어 할 만큼 구체적으로 작성하되 과장하지 마세요.
- 날짜는 위 날짜 규칙을 반드시 따르세요.
- persona와 referenceText의 이모지 사용 빈도를 참고하되, 글이 산만해질 정도로 이모지를 많이 넣지 마세요.
- 소제목에는 내용과 맞는 이모지를 0~1개 정도 사용할 수 있습니다.
- 본문과 제목에 Markdown 기호 **, ##, 코드블록 같은 표시를 그대로 남기지 말 것
- 일반 본문에는 **강조** 형태를 사용하지 말 것
- 강조는 자연스러운 문장으로 표현하고, 실제 굵게 표시는 앱의 HTML 변환 단계에서 처리
- 미리보기 편집기에 바로 들어갈 텍스트이므로 Markdown 문법 표시를 쓰지 말 것
- 항상 클릭률, 가독성, 사진 활용, 공감도, SEO를 고려
- 모바일에서 읽기 쉬운 짧은 문단과 자연스러운 흐름으로 작성
- 최근 콘텐츠 소비 트렌드를 반영하되 실제 데이터를 아는 것처럼 단정하지 말 것
- 플랫폼에 맞는 톤과 길이를 반영: naver는 긴 글/소제목/사진 배치/검색 키워드, tistory는 긴 글/정보성/구조화/검색 키워드, threads는 짧고 자연스러운 대화형/댓글과 공감 유도/과하지 않은 이모지 중심, detail은 모바일 쇼핑몰 상세페이지/구매 전환/신뢰감/사진 활용/FAQ/CTA 중심, review는 구매후기/상품리뷰/장단점/재구매 의사 중심
- 사진 분석 결과가 있으면 본문 흐름, 소제목, 사진 설명 문단에 적극 반영하세요.
- review 플랫폼이면 한줄평, 별점 느낌 문구, 장점, 아쉬운 점, 사용 후기, 추천 대상, 재구매 의사를 포함하세요.
- 글쓰기 스타일별 차이를 반드시 눈에 띄게 반영하세요. 감성형/정보형/여행형/맛집후기형/카페후기형/제품리뷰형/육아일상형/체험후기형/일기형 또는 상세페이지 톤이 서로 비슷하게 나오면 안 됩니다.
- 상세페이지 톤이 프리미엄형/감성형/실속형/리뷰형/공동구매형/상세 스펙형이면 헤드라인, 섹션 구성, CTA 문체가 그 톤에 맞게 달라져야 합니다.`,
        },
      ],
      text: { format: { type: "json_object" } },
    });

    const parsed = parseOpenAIJson(response.output_text);
    const generated = normalizeGeneratedPost(parsed);

    if (generated.titles.length === 0 || !generated.content || generated.tags.length === 0) {
      console.error("Invalid OpenAI response shape:", generated);
      return NextResponse.json(
        { message: "OpenAI 응답에 제목, 본문 또는 태그가 부족해요. 다시 생성해주세요." },
        { status: 502 },
      );
    }

    return NextResponse.json(generated);
  } catch (error) {
    console.error("OpenAI call failed:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `OpenAI 호출 실패: ${error.message}`
            : "OpenAI 호출 중 알 수 없는 문제가 생겼어요.",
      },
      { status: 500 },
    );
  }
}












