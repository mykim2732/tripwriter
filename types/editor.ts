export type ContentPlatform =
  | "naver"
  | "tistory"
  | "brunch"
  | "instagram"
  | "threads"
  | "wordpress"
  | "general"
  | "detail";

export type ContentType = "blog" | "instagram" | "threads" | "review" | "diary" | "info" | "detail";

export type EditorLink = {
  label: string;
  url: string;
  type?: "link" | "map" | "youtube";
};

export type ImageDecorator = {
  imageUrl?: string;
  imageIndex?: number;
  type: "sticker" | "maskingTape" | "arrow" | "highlight" | "frame" | "badge";
  text?: string;
  color?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
};

export type DetailSection = {
  id: string;
  type: "hero" | "benefit" | "imageText" | "checklist" | "spec" | "faq" | "cta" | "notice";
  title: string;
  body: string;
  imageUrl?: string;
  items?: string[];
};
export type BlogEditorState = {
  selectedTitle: string;
  titleCandidates: string[];
  content: string;
  html: string;
  photoUrls: string[];
  localPhotoPreviews?: string[];
  photoCaptions: string[];
  photoDecorators?: ImageDecorator[];
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
  editorOptions: Record<string, unknown>;
};



