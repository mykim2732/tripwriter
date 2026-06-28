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
    style?: string;
    designTheme?: string;
    photoCaptions?: string[];
    photoAnalysis?: unknown[];
    coverPhotoUrl?: string;
    coverReason?: string;
    photoSummary?: string;
  };
};

type ImagePlacement = {
  url: string;
  positionHint: string;
  caption: string;
};

type ImageDecorator = {
  id?: string;
  imageUrl?: string;
  imageIndex?: number;
  type: "sticker" | "maskingTape" | "arrow" | "circle" | "badge" | "sparkle" | "highlight" | "frame" | "handDrawn" | "memo" | "polaroid" | "paper";
  shape?: "outline" | "arrow" | "dotted" | "smallCircle" | "check" | "star" | "heart" | "sparkle" | "smile" | "cloud" | "memoLine" | "underline" | "circle" | "sun" | "flower" | "house" | "rainbow";
  text?: string;
  color?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  enabled?: boolean;
};

type PolishResponse = {
  decoratedTitle: string;
  polishedContent: string;
  html: string;
  photoCaptions: string[];
  imagePlacements: ImagePlacement[];
  imageDecorators: ImageDecorator[];
  diaryStickers: { type: string; text?: string; positionHint?: string }[];
  designOptions: Record<string, unknown>;
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
    decoratedTitle: typeof parsed.decoratedTitle === "string" ? parsed.decoratedTitle : "",
    polishedContent:
      typeof parsed.polishedContent === "string" ? parsed.polishedContent : "",
    html: typeof parsed.html === "string" ? parsed.html : "",
    photoCaptions: Array.isArray(parsed.photoCaptions) ? parsed.photoCaptions.map(String).filter(Boolean) : [],
    imagePlacements: Array.isArray(parsed.imagePlacements)
      ? parsed.imagePlacements
          .filter((item) => item && typeof item.url === "string")
          .map((item) => ({
            url: String(item.url),
            positionHint: String(item.positionHint || "본문 중간"),
            caption: String(item.caption || "블로그 이미지"),
          }))
      : [],
    imageDecorators: Array.isArray(parsed.imageDecorators)
      ? parsed.imageDecorators.map((item: Record<string, unknown>) => ({
          id: typeof item.id === "string" ? item.id : undefined,
          imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : undefined,
          imageIndex: typeof item.imageIndex === "number" ? item.imageIndex : undefined,
          type: ["sticker", "maskingTape", "arrow", "circle", "badge", "sparkle", "highlight", "frame", "handDrawn", "memo", "polaroid", "paper"].includes(String(item.type)) ? item.type as ImageDecorator["type"] : "sticker",
          shape: ["outline", "arrow", "dotted", "smallCircle", "check", "star", "heart", "sparkle", "smile", "cloud", "memoLine", "underline", "circle", "sun", "flower", "house", "rainbow"].includes(String(item.shape)) ? item.shape as ImageDecorator["shape"] : undefined,
          text: typeof item.text === "string" ? item.text : undefined,
          color: typeof item.color === "string" ? item.color : undefined,
          position: typeof item.position === "string" ? item.position as ImageDecorator["position"] : undefined,
          enabled: typeof item.enabled === "boolean" ? item.enabled : true,
        }))
      : [],
    diaryStickers: Array.isArray(parsed.diaryStickers)
      ? parsed.diaryStickers
          .filter((item) => item && typeof item === "object")
          .map((item) => {
            const record = item as Record<string, unknown>;
            return {
              type: String(record.type || "memo"),
              text: typeof record.text === "string" ? record.text : undefined,
              positionHint: typeof record.positionHint === "string" ? record.positionHint : undefined,
            };
          })
      : [],
    designOptions: parsed.designOptions && typeof parsed.designOptions === "object" && !Array.isArray(parsed.designOptions) ? parsed.designOptions as Record<string, unknown> : {},
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
    const imageInputs = (input.photoUrls || [])
      .filter((url) => /^https?:\/\//.test(url))
      .slice(0, 8)
      .map((url) => ({ type: "input_image", image_url: url }));

    const response = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        {
          role: "developer",
          content: `당신은 네이버 블로그 전문 편집자입니다.
사용자의 블로그 초안을 네이버 블로그에서 읽기 좋게 다듬습니다.

작업 원칙:
- 당신은 단순 교정자가 아니라 AI 디자이너입니다. 사용자가 버튼 하나만 눌러도 사람이 10~20분 꾸민 것 같은 블로그 결과를 만듭니다.
- 제목은 클릭률과 플랫폼 분위기를 고려해 자연스럽게 개선하되, 과장하거나 없는 사실을 만들지 않습니다.
- 감성형/여행/카페/맛집 글은 제목과 소제목에 이모지를 0~1개 자연스럽게 사용할 수 있고, 정보형/전문가형은 이모지를 최소화합니다.
- 본문 흐름을 분석해 📍, ✨, 💡, 🍽, 🏕, ☕, 📌 같은 상황 맞춤 소제목을 자동 생성합니다.
- 중요한 문장은 ⭐, 💡, 🔥, 📌 같은 포인트 아이콘과 함께 자연스럽게 강조합니다.
- 문단이 길면 모바일에서 읽기 좋게 줄바꿈, 공백, 문단 간격을 정리합니다.
- 사진 URL이 있으면 대표사진, 본문 중간, 마무리 전 순서로 누락 없이 배치하고 imagePlacements에 짧은 사진 설명을 제안합니다.
- 사진 설명은 짧고 구체적으로 작성합니다. 예: 후지산이 선명하게 보이는 풍경, 감성적인 카페 내부, 캠핑장 전경.
- 글 분위기에 맞는 글꼴/색상 느낌을 HTML 스타일에 은근하게 반영합니다. 감성 글은 부드럽게, 정보성 글은 읽기 쉽게, 제품 리뷰는 명확하게 보이게 합니다.
- 마지막에는 댓글, 저장, 질문, 공감 유도를 광고처럼 보이지 않게 자연스럽게 추가할 수 있습니다.
- 향후 사진 꾸미기 오버레이(스티커, 화살표, 모자이크, 번호, 추천 표시)를 붙일 수 있도록 imagePlacements의 positionHint와 caption을 명확하게 작성합니다.
- 사용자가 이미 수정한 제목, 사진, 이모지, 링크, 첨부파일, 글꼴, 글자크기, 정렬, 사진 설명은 삭제하지 않는다는 전제로 본문만 더 읽기 좋게 다듬습니다.
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
- imagePlacements에는 모든 photoUrls를 포함하고, 각 사진마다 짧은 caption과 positionHint를 작성할 것
- 옵션에 따라 소제목 앞에 이모지 추가 가능
- 글 분위기에 맞는 이모지를 적절히 삽입
- 과한 이모지 남발 금지
- 네이버 블로그에서 보기 좋은 줄바꿈 유지
- 핵심 문장 앞에 ✅ 또는 강조 기호를 사용할 수 있음
- 사진 삽입 위치를 추천
- 본문과 제목에 Markdown 기호 **, ##, 코드블록 같은 표시를 그대로 남기지 말 것
- AI 디자이너 모드로 소제목, 핵심 문장, 문단 공백, 사진 설명, CTA를 종합적으로 다듬을 것
- 일반 본문에는 **강조** 형태를 사용하지 말 것
- 강조는 자연스러운 문장으로 표현하고, 실제 굵게 표시는 앱의 HTML 변환 단계에서 처리
- 미리보기 편집기에 바로 들어갈 텍스트이므로 Markdown 문법 표시를 쓰지 말 것
- 이번 작업은 단순 문단 정리가 아니라 "비주얼 디자이너"처럼 블로그/상세페이지 자체의 분위기를 설계하는 것입니다.
- 이번 작업은 단순 문단 정리가 아니라 "비주얼 디자이너"처럼 블로그/상세페이지 자체의 분위기를 설계하는 것입니다.
- 감성 손글씨 메모, 마스킹 테이프, 다이어리 스티커, TIP 박스, 총평 박스, 체크리스트, 아이콘 소제목, 사진 프레임, BEST/HOT/NEW 스티커를 HTML과 imageDecorators에 적절히 설계할 것
- 사진 위 장식은 실제 이미지에 텍스트를 합성하지 않고 앱의 CSS/SVG Overlay로 표시됩니다.
- ChatGPT 스타일의 흰색 얇은 손그림 오버레이를 imageDecorators로 제안하세요. type은 handDrawn, color는 #ffffff, shape는 arrow/circle/underline/star/heart/check/cloud/smile/sparkle/dotted 중 선택하세요.
- 손그림 오버레이는 한 번에 쓱 그은 듯한 자연스러운 선 느낌이어야 하며 사진마다 1~3개까지만 제안하세요.
- 사진 옆이나 아래에 짧은 손글씨 메모를 제안할 수 있습니다. type은 memo, text는 "오늘 제일 행복했던 순간", "이 뷰는 꼭 봐야 해", "여기 또 오고 싶다", "정말 추천!"처럼 짧고 긍정적으로 작성하세요.
- 아이 낙서 테마에서는 삐뚤빼뚤 별, 해, 꽃, 구름, 집, 하트, 웃는 얼굴, 무지개, 연필 낙서 느낌의 shape를 사진 주변에 살짝 배치하세요.
- 감성 다이어리 테마에서는 maskingTape, polaroid, paper, memo, handDrawn underline, 작은 sticker를 조합하세요.
- 네이버는 감성/사진 중심 박스가 많게, 티스토리는 SEO/정보형 박스 중심, 스레드는 짧고 강렬한 SNS 카드형으로 다르게 꾸밀 것
- review 플랫폼이면 리뷰 카드처럼 장점/아쉬운 점/별점 느낌 문구/추천 대상/재구매 의사/사진 설명을 보기 좋게 정리할 것
- review 플랫폼은 실제 구매 후기처럼 자연스럽게 쓰되 과장 광고, 허위 효능, 단정적인 의료/건강/미용 표현을 피할 것
- review 플랫폼의 HTML에는 한줄평 박스, 장점 박스, 아쉬운 점 박스, 추천 대상 박스, 재구매 의사 박스를 상황에 맞게 포함할 것
- detail 플랫폼이면 온라인 판매 상세페이지 디자이너처럼 Hero, Problem/Solution, Benefit 카드, 이미지+설명, 체크리스트, FAQ, 구매 CTA 섹션으로 재배치할 것
- detail 플랫폼에서는 BEST, NEW, HOT, 추천, 한정, 무료배송, 오늘특가 같은 스티커를 imageDecorators에 제안할 수 있음
- detail 플랫폼은 과장 광고와 허위 효능 표현을 금지하고, 가격/배송/혜택은 사용자가 준 내용만 사용할 것
- imageDecorators는 사진마다 최대 1~2개만 추천하고 과하게 꾸미지 말 것
- imageDecorators에는 가능하면 id, imageIndex, imageUrl, type, text, position, color, enabled를 포함할 것
- type은 sticker, maskingTape, arrow, circle, badge, sparkle, handDrawn, memo, polaroid, paper 중에서 선택할 것
- 블로그는 감성컷, 꿀팁, 추천 정도로 자연스럽게 쓰고, 상품 상세페이지는 BEST, 무료배송, 오늘특가, 한정수량, 리뷰좋음 등을 사용할 수 있음
- 스레드에서는 imageDecorators를 최소화할 것
- 원본 이미지는 수정하지 않고 앱의 CSS 오버레이로 표시될 예정임
- 사용자가 선택한 designTheme를 최우선 디자인 방향으로 반영하세요.
- 감성 다이어리: 메모지 박스, 마스킹테이프, 손글씨풍 코멘트, 부드러운 색감, 여백을 사용하세요.
- 아이 낙서: 흰색 손그림 별/하트/구름/웃는 얼굴/무지개를 사진 주변에 적게 배치하고, 아이와 함께한 순간이 살아나는 짧은 메모를 사용하세요.
- 여행 기록: 장소감, 동선, 사진 중심 소제목, 여행 팁 박스를 사용하세요.
- 카페 감성: 음료/좌석/사진 포인트와 감성 배지를 사용하세요.
- 맛집 후기: 메뉴/가격/맛 표현/재방문 의사와 추천 배지를 사용하세요.
- 판매 상세페이지: Hero, 장점 카드 3개, 체크리스트, FAQ, 신뢰 포인트, 구매 CTA를 명확하게 구성하세요.
- 정보 정리: 체크리스트, TIP 박스, 요약 박스 중심으로 정리하세요.
- 육아 일상: 따뜻한 공감 메모와 현실적인 코멘트 박스를 사용하세요.
- 전문 리뷰: 장단점, 비교, 스펙, 총평 박스를 사용하세요.
- style도 반영하세요. 감성형은 부드럽고 여백 있게, 정보형은 구조적이고 이모지 최소, 여행형은 동선/장소감, 맛집후기형은 메뉴/가격/맛, 카페후기형은 인테리어/좌석/음료, 제품리뷰형은 장단점/비교, 육아일상형은 공감, 체험후기형은 과정과 추천 대상, 일기형은 감정 기록 중심입니다.
- diaryStickers에는 memo, tape, badge, tip, summary, checklist, quote, divider 중 적절한 decorative block을 2~5개 제안하세요.
- html에는 메모지 박스, TIP 박스, 총평 박스, 체크리스트 박스, 구분선, 인용구 박스 중 테마에 맞는 요소를 inline style로 실제 보이게 포함하세요.
- decoratedTitle에는 플랫폼에 맞는 이모지를 0~1개 자연스럽게 넣을 것
- 사용자 입력 HTML은 이미 escape된 텍스트이므로, 실제 사실은 바꾸지 말고 편집만 하세요.

반환은 반드시 JSON만 사용하세요:
{
  "decoratedTitle": "플랫폼에 맞게 꾸민 대표 제목",
  "polishedContent": "Markdown 기호 없이 다듬어진 본문",
  "html": "발행용 HTML",
  "photoCaptions": ["사진 설명 1", "사진 설명 2"],
  "imagePlacements": [
    {
      "url": "이미지 URL",
      "positionHint": "도입부 아래",
      "caption": "사진 설명"
    }
  ],
  "imageDecorators": [
    { "id": "decorator-1", "imageIndex": 0, "type": "sticker", "text": "BEST", "color": "#2563eb", "position": "top-left", "enabled": true },
    { "id": "decorator-2", "imageIndex": 0, "type": "handDrawn", "shape": "arrow", "color": "#ffffff", "position": "center", "enabled": true },
    { "id": "decorator-3", "imageIndex": 1, "type": "memo", "text": "여기 또 오고 싶다", "color": "#fff7ed", "position": "bottom-right", "enabled": true }
  ],
  "designOptions": {
    "theme": "감성 다이어리",
    "designTheme": "감성 다이어리",
    "visualStyle": "white hand-drawn overlay diary",
    "overlayStyle": "thin rough white doodle",
    "memoStyle": "short emotional handwritten note",
    "paperTexture": "soft translucent paper",
    "stickerStyle": "small diary sticker",
    "handwritingStyle": "casual Korean handwriting",
    "fontFamily": "감성 손글씨",
    "fontSize": "large",
    "pointColor": "pink",
    "highlightColor": "yellow",
    "pointIcon": "✨",
    "sectionStyle": "diary",
    "recommendedFontFamily": "Pretendard",
    "recommendedPointColor": "#2563eb",
    "recommendedHighlightColor": "#bfdbfe",
    "designMood": "clean"
  },
  "diaryStickers": [
    { "type": "memo", "text": "여기 정말 좋았어요", "positionHint": "첫 번째 사진 아래" },
    { "type": "tape", "text": "", "positionHint": "대표사진 상단" },
    { "type": "badge", "text": "BEST", "positionHint": "추천 포인트 근처" }
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
- 글 스타일/톤: ${input.options?.style || ""}
- 선택한 AI 디자인 테마: ${input.options?.designTheme || "자동 추천"}
- 사진 설명: ${(input.options?.photoCaptions || []).join(", ")}
- AI 사진 분석 요약: ${input.options?.photoSummary || ""}
- AI 추천 대표사진: ${input.options?.coverPhotoUrl || ""}
- 대표사진 추천 이유: ${input.options?.coverReason || ""}
- 사진별 분석 결과: ${JSON.stringify(input.options?.photoAnalysis || [])}

HTML 작성 규칙:
- html 필드는 네이버 블로그 발행 전 미리보기용 HTML 문자열로 작성하세요.
- 문단은 <p>, 소제목은 <h2>, 이미지는 <figure><img /></figure> 형태를 사용하세요.
- 사용자 본문에서 온 텍스트는 HTML 태그로 실행되지 않게 안전하게 다루세요.
- fontFamily/fontSize/textAlign은 최상위 wrapper style에 반영하세요.
- emojiHeadings가 true면 소제목 앞에 분위기에 맞는 이모지를 0~1개 추가하세요.
- checkKeySentences가 true면 중요한 문장 앞에 ✅를 자연스럽게 붙일 수 있습니다.
- wideParagraphSpacing이 true면 HTML 문단 margin을 조금 넓게 설정하세요.
- 본문과 제목에 Markdown 기호 **, ##, 코드블록 같은 표시를 그대로 남기지 말 것
- AI 디자이너 모드로 소제목, 핵심 문장, 문단 공백, 사진 설명, CTA를 종합적으로 다듬을 것
- 일반 본문에는 **강조** 형태를 사용하지 말 것
- 강조는 자연스러운 문장으로 표현하고, 실제 굵게 표시는 앱의 HTML 변환 단계에서 처리
- 미리보기 편집기에 바로 들어갈 텍스트이므로 Markdown 문법 표시를 쓰지 말 것
- 이번 작업은 단순 문단 정리가 아니라 "비주얼 디자이너"처럼 블로그/상세페이지 자체의 분위기를 설계하는 것입니다.
- 감성 손글씨 메모, 마스킹 테이프, 다이어리 스티커, TIP 박스, 총평 박스, 체크리스트, 아이콘 소제목, 사진 프레임, BEST/HOT/NEW 스티커를 HTML과 imageDecorators에 적절히 설계할 것
- 사진 위 장식은 실제 이미지에 텍스트를 합성하지 않고 앱의 CSS/SVG Overlay로 표시됩니다.
- ChatGPT 스타일의 흰색 얇은 손그림 오버레이를 imageDecorators로 제안하세요. type은 handDrawn, color는 #ffffff, shape는 arrow/circle/underline/star/heart/check/cloud/smile/sparkle/dotted 중 선택하세요.
- 손그림 오버레이는 한 번에 쓱 그은 듯한 자연스러운 선 느낌이어야 하며 사진마다 1~3개까지만 제안하세요.
- 사진 옆이나 아래에 짧은 손글씨 메모를 제안할 수 있습니다. type은 memo, text는 "오늘 제일 행복했던 순간", "이 뷰는 꼭 봐야 해", "여기 또 오고 싶다", "정말 추천!"처럼 짧고 긍정적으로 작성하세요.
- 아이 낙서 테마에서는 삐뚤빼뚤 별, 해, 꽃, 구름, 집, 하트, 웃는 얼굴, 무지개, 연필 낙서 느낌의 shape를 사진 주변에 살짝 배치하세요.
- 감성 다이어리 테마에서는 maskingTape, polaroid, paper, memo, handDrawn underline, 작은 sticker를 조합하세요.
- 네이버는 감성/사진 중심 박스가 많게, 티스토리는 SEO/정보형 박스 중심, 스레드는 짧고 강렬한 SNS 카드형으로 다르게 꾸밀 것
- detail 플랫폼이면 온라인 판매 상세페이지 디자이너처럼 Hero, Problem/Solution, Benefit 카드, 이미지+설명, 체크리스트, FAQ, 구매 CTA 섹션으로 재배치할 것
- detail 플랫폼에서는 BEST, NEW, HOT, 추천, 한정, 무료배송, 오늘특가 같은 스티커를 imageDecorators에 제안할 수 있음
- detail 플랫폼은 과장 광고와 허위 효능 표현을 금지하고, 가격/배송/혜택은 사용자가 준 내용만 사용할 것
- imageDecorators는 사진마다 최대 1~2개만 추천하고 과하게 꾸미지 말 것
- imageDecorators에는 가능하면 id, imageIndex, imageUrl, type, text, position, color, enabled를 포함할 것
- type은 sticker, maskingTape, arrow, circle, badge, sparkle, handDrawn, memo, polaroid, paper 중에서 선택할 것
- 블로그는 감성컷, 꿀팁, 추천 정도로 자연스럽게 쓰고, 상품 상세페이지는 BEST, 무료배송, 오늘특가, 한정수량, 리뷰좋음 등을 사용할 수 있음
- 스레드에서는 imageDecorators를 최소화할 것
- 원본 이미지는 수정하지 않고 앱의 CSS 오버레이로 표시될 예정임
- 선택한 AI 디자인 테마를 html, designOptions, diaryStickers, imageDecorators에 반영할 것
- AI 사진 분석 결과가 있으면 사진 설명, 대표사진, 전체 분위기, 추천 배치를 우선 반영할 것
- coverPhotoUrl이 있으면 대표 이미지 또는 Hero 이미지로 자연스럽게 강조할 것
- photoSummary가 있으면 글의 전체 분위기와 색상/스티커/메모 톤에 반영할 것
- designOptions에는 designTheme, visualStyle, overlayStyle, memoStyle, paperTexture, stickerStyle, handwritingStyle을 포함할 것
- diaryStickers는 앱에서 메모지/테이프/배지/TIP/총평/체크리스트/인용구/구분선으로 렌더링할 예정이므로 짧고 명확하게 제안할 것
- decoratedTitle에는 플랫폼에 맞는 이모지를 0~1개 자연스럽게 넣을 것`,
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


















