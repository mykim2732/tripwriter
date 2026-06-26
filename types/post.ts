export type PostStatus = "draft" | "scheduled" | "published" | "failed";

export type Post = {
  id: string;
  user_id: string;
  travel_title: string;
  destination: string;
  travel_date: string;
  keywords: string;
  style: string;
  ai_titles: string[];
  content: string;
  tags: string[];
  photo_urls: string[];
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  naver_post_url: string | null;
  polished_content: string | null;
  published_html: string | null;
  editor_options: Record<string, unknown> | null;
  attachment_urls: string[] | null;
  html_updated_at: string | null;
  created_at: string;
};

export type CreatePostInput = Omit<
  Post,
  | "id"
  | "created_at"
  | "polished_content"
  | "published_html"
  | "editor_options"
  | "attachment_urls"
  | "html_updated_at"
> &
  Partial<
    Pick<
      Post,
      "polished_content" | "published_html" | "editor_options" | "attachment_urls" | "html_updated_at"
    >
  >;

export type UpdatePostInput = Partial<Omit<Post, "id" | "created_at">>;
