export type ContentPlatform =
  | "naver"
  | "tistory"
  | "brunch"
  | "instagram"
  | "threads"
  | "wordpress"
  | "general";

export type ContentType = "blog" | "instagram" | "threads" | "review" | "diary" | "info";

export type BlogEditorState = {
  selectedTitle: string;
  titleCandidates: string[];
  content: string;
  html: string;
  photoUrls: string[];
  localPhotoPreviews?: string[];
  photoCaptions: string[];
  attachments?: { name: string; url?: string; type?: string }[];
  links?: { label: string; url: string }[];
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
