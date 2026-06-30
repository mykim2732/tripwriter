export type ContentPlatform =
  | "naver"
  | "tistory"
  | "brunch"
  | "instagram"
  | "threads"
  | "wordpress"
  | "general"
  | "review"
  | "detail";

export type ContentType = "blog" | "instagram" | "threads" | "review" | "diary" | "info" | "detail";

export type EditorLink = {
  label: string;
  url: string;
  type?: "link" | "map" | "youtube" | "purchase" | "affiliate";
};

export type EditorPhoto = {
  id: string;
  url: string;
  file?: File;
  isLocal?: boolean;
  name?: string;
};

export type ImageDecorator = {
  id?: string;
  imageUrl?: string;
  imageIndex?: number;
  type:
    | "sticker"
    | "maskingTape"
    | "arrow"
    | "circle"
    | "badge"
    | "sparkle"
    | "highlight"
    | "frame"
    | "handDrawn"
    | "memo"
    | "polaroid"
    | "paper";
  shape?: "outline" | "arrow" | "dotted" | "smallCircle" | "check" | "star" | "heart" | "sparkle" | "smile" | "cloud" | "memoLine" | "underline" | "circle" | "sun" | "flower" | "house" | "rainbow";
  text?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  color?: string;
  enabled?: boolean;
};

export type PhotoAnalysis = {
  url: string;
  caption: string;
  shortMemo?: string;
  recommendedUse?: string;
  decoratorSuggestions?: ImageDecorator[];
};

export type PhotoStorylineItem = {
  photoUrl: string;
  heading: string;
  paragraphPoint: string;
  caption: string;
};

export type ReviewResearchLink = {
  label?: string;
  url: string;
};

export type ReviewResearchResult = {
  summary: string;
  commonPros: string[];
  commonCons: string[];
  keywords: string[];
  suggestedAngles: string[];
  cautionNotes: string[];
  titleHints: string[];
};

export type ReviewResearchInput = {
  subject?: string;
  rating?: string;
  reviewMemo?: string;
  links?: ReviewResearchLink[];
  pros?: string;
  cons?: string;
  result?: ReviewResearchResult;
};

export type WatermarkProfile = {
  name: string;
  imageUrl: string;
  position: "top-left" | "top-right" | "center" | "bottom-left" | "bottom-right";
  opacity: 20 | 40 | 60 | 80 | 100;
  size: "small" | "medium" | "large";
  scope: "all" | "cover" | "selected";
};

export type DesignTheme =
  | "감성 다이어리"
  | "여행 기록"
  | "카페 감성"
  | "맛집 후기"
  | "판매 상세페이지"
  | "정보 정리"
  | "육아 일상"
  | "전문 리뷰"
  | "아이 낙서";

export type DiarySticker = {
  type: "memo" | "tape" | "badge" | "tip" | "summary" | "checklist" | "quote" | "divider" | "paper" | "stamp" | "underline" | "polaroid";
  text?: string;
  positionHint?: string;
};

export type DetailSection = {
  id: string;
  type: "hero" | "benefit" | "imageText" | "checklist" | "spec" | "faq" | "cta" | "notice";
  title: string;
  body: string;
  imageUrl?: string;
  items?: string[];
};

export type ReviewPage = {
  productName?: string;
  oneLineReview?: string;
  ratingText?: string;
  pros?: string;
  cons?: string;
  experience?: string;
  recommendTarget?: string;
  repurchaseIntent?: string;
  photoReviewPoints?: string[];
  hashtags?: string[];
};

export type BlogEditorState = {
  selectedTitle: string;
  titleCandidates: string[];
  content: string;
  html: string;
  editorPhotos?: EditorPhoto[];
  photoUrls: string[];
  localPhotoPreviews?: string[];
  photoCaptions: string[];
  photoDecorators?: ImageDecorator[];
  photoStoryline?: PhotoStorylineItem[];
  photoAnalysis?: PhotoAnalysis[];
  coverPhotoUrl?: string;
  coverReason?: string;
  photoSummary?: string;
  attachments?: { name: string; url?: string; type?: string }[];
  links?: EditorLink[];
  platform: ContentPlatform;
  contentType: ContentType;
  fontFamily: string;
  fontSize: string;
  textAlign: "left" | "center" | "right";
  pointIcon: string;
  emojiHeadings: boolean;
  paragraphSpacing: boolean;
  showCaptions: boolean;
  detailPage?: {
    productName: string;
    brandName?: string;
    category?: string;
    targetCustomer?: string;
    keyBenefits: string[];
    priceInfo?: string;
    components?: string;
    cautions?: string;
    faq?: { question: string; answer: string }[];
    ctaText?: string;
    sections?: DetailSection[];
  };
  reviewPage?: ReviewPage;
  reviewResearch?: ReviewResearchInput;
  editorOptions: Record<string, unknown>;
};





