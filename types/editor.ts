export type ContentPlatform =
  | "naver"
  | "tistory"
  | "brunch"
  | "instagram"
  | "threads"
  | "wordpress"
  | "general";

export type ContentType = "blog" | "instagram" | "threads" | "review" | "diary" | "info";

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
  editorOptions: Record<string, unknown>;
};
