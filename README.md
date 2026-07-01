# Posty AI

Posty AI는 네이버 블로그, 티스토리, 스레드, 리뷰, 상세페이지 콘텐츠를 만들고 편집하는 모바일 우선 AI 콘텐츠 스튜디오입니다.
사진, 키워드, 메모를 기반으로 AI 초안을 만들고, 편집기에서 사진 배치, AI 디자인, 복사 발행 준비까지 이어갈 수 있습니다.

## 주요 기능

- 플랫폼별 작성: 네이버 블로그, 티스토리, 스레드, 리뷰, 상세페이지
- AI 글 생성: 키워드, 메모, 사진 설명, 사진 분석 결과 기반 초안 생성
- AI 구성 계획: 초안 생성 전에 독자, 사진 흐름, 섹션, SEO/디자인 방향을 먼저 설계
- AI 디자인: 글 다듬기, 소제목, 사진 설명, 이미지 꾸미기 추천
- AI 품질 검수: AI 티 나는 표현, 반복, 과장, 사진 불일치, SEO 부족을 생성 직후 점검
- 공통 편집기: BlogEditor, DetailEditor, ReviewEditor와 FloatingEditorToolbar
- 사진 관리: 업로드, 드래그앤드롭, 순서 변경, 설명 수정, AI 사진 분석
- 사진 기반 다시 쓰기: 대표사진, 본문 사진, 마무리 사진 흐름으로 초안 재작성
- 리뷰 리서치: 사용자가 입력한 후기 메모/링크/장단점을 안전하게 요약해 초안에 반영
- 리뷰 API 준비층: Google Places, Kakao, Naver 공식 API 연결 전 mock/search-link mode 제공
- 이미지 AI 준비층: OpenAI 이미지 생성/수정 API route 준비, 원본 사진 덮어쓰기 금지
- AI 썸네일: 대표사진 기반 미니멀/다이어리/리뷰/상세페이지 mock preview
- 썸네일 저장/다운로드: CSS 오버레이와 워터마크가 보이는 합성 preview를 PNG로 다운로드하고 대표 썸네일로 저장
- 사진 스토리라인: 사진별 소제목, 문단 포인트, 캡션을 편집하고 사진 기반 다시 쓰기에 반영
- 품질 검수 적용/되돌리기: 개선 본문과 제목 후보를 적용하고 원문으로 되돌리기
- 대표사진/워터마크: 대표사진 지정, 저장함 썸네일 우선 표시, CSS 기반 워터마크 오버레이
- 저장함: 프로젝트별 그룹, 플랫폼 필터, 발행 상태 관리
- 발행 준비: 플랫폼별 복사 순서, HTML/본문/태그 복사, 발행 완료 표시
- 사진 포함 복사: 제목, 본문, 이미지, 캡션, 링크, 태그를 HTML 또는 텍스트 fallback으로 복사
- 발행 QA: 사진 누락 검사, 빠른 복사 액션시트, AI 클릭률 코치
- 수익화 준비: 리워드 광고, 제휴 링크, 결제 Stub, 관리자용 수익화 가이드
- 발행 가능성 점검: 플랫폼별 자동 발행 가능/복사 권장/API 준비 상태 표시
- 베타 피드백: 별점, 불편사항, 기능 요청, 버그 신고 mock 수집
- 로그인: Supabase Auth 이메일 회원가입/로그인/로그아웃
- 크레딧: profiles/credit_logs 기반 차감 준비 및 로그인 사용자 실제 차감 연결
- 운영 점검: `/qa` 체크리스트 페이지

## 환경변수

`.env.local` 또는 Vercel 환경변수에 아래 값을 설정합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=

# 자동 발행 연동 준비용, 현재는 stub 상태
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
TISTORY_CLIENT_ID=
TISTORY_CLIENT_SECRET=
THREADS_CLIENT_ID=
THREADS_CLIENT_SECRET=

# 리뷰 공식 API 연결 준비용, 현재는 search-link mode
GOOGLE_PLACES_API_KEY=
KAKAO_REST_API_KEY=
```

주의: `OPENAI_API_KEY`는 서버 전용입니다. 브라우저 코드에 노출하지 마세요.

## Supabase SQL

`supabase/schema.sql`을 Supabase SQL Editor에서 실행해야 합니다.
특히 Sprint 43 이후 기능을 위해 아래 항목이 필요합니다.

- `profiles` 테이블
- `credit_logs` 테이블
- profiles/credit_logs RLS 정책
- 신규 사용자 profile 자동 생성 트리거
- authenticated 사용자별 posts RLS 정책
- Storage bucket: `trip-photos`, `blog-attachments`, `profile-images`

SQL은 앱에서 자동 실행하지 않습니다. 운영 DB 적용은 Supabase SQL Editor에서 직접 확인 후 실행하세요.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 검증

```bash
npx tsc --noEmit
npm run build
npm run lint
```

## 주요 라우트

- `/`: 홈, 플랫폼 선택
- `/write`: 콘텐츠 작성
- `/saved`: 저장함
- `/saved/[id]`: 블로그/리뷰/상세페이지 편집
- `/saved/threads/[id]`: 스레드 상세
- `/publish/[id]`: 발행 전 복사 준비
- `/dashboard`: 콘텐츠 대시보드
- `/account`: 로그인/크레딧/요금제/플랫폼 연결 준비
- `/login`: 이메일 로그인/회원가입
- `/qa`: 운영 전 체크리스트
- `/rewards`: 리워드 센터
- `/invite`: 친구 초대 준비
- `/monetization`: 관리자용 광고/제휴/결제 운영 가이드
- `/feedback`: 베타 피드백 보내기
- `/billing/success`, `/billing/fail`: 결제 Stub callback 화면

## 자동 발행 상태

네이버, 티스토리, 스레드 자동 발행은 아직 실제 OAuth/API 호출을 하지 않습니다.
현재는 아래 stub API가 준비되어 있고, 각 플랫폼 정책 확인 후 실제 OAuth와 발행 API를 연결할 수 있습니다.

- `/api/naver/callback`
- `/api/naver/publish`
- `/api/tistory/callback`
- `/api/tistory/publish`
- `/api/threads/callback`
- `/api/threads/publish`

## 알려진 제한사항

- 자동 결제는 아직 연결되지 않았습니다.
- 리뷰 공식 API는 준비층만 있으며 현재는 검색 링크 모드입니다.
- AI 이미지 생성/수정은 API route가 준비되어 있지만 키/입력/정책 실패 시 mock 안내를 반환합니다.
- AI 썸네일 PNG 다운로드는 브라우저 canvas 기반이며, mock 상태에서는 원격 이미지 CORS 정책에 따라 다운로드가 제한될 수 있습니다.
- 이미지 생성/편집과 썸네일 생성은 각 2크레딧 예정이며 mock 상태에서는 실제 차감하지 않습니다.
- 자동 발행은 준비 화면과 stub API까지만 구현되어 있습니다.
- 비로그인 guest는 기존 흐름을 유지합니다.
- 로그인 사용자별 저장과 크레딧 기능은 Supabase SQL 적용이 필요합니다.
- 사진 분석은 OpenAI API 호출 비용이 발생할 수 있습니다.
- 리워드 광고는 실제 SDK 연결 전 mock 상태입니다.
- 포인트를 크레딧으로 전환하는 기능은 UI 준비 단계이며 실제 전환은 아직 연결되지 않았습니다.

## 보안 메모

개발 중 노출된 OpenAI API Key는 반드시 폐기하고 새 키로 교체하세요.
Vercel과 로컬 `.env.local`에는 새 키만 저장하는 것을 권장합니다.

## Beta SaaS Checklist

- Pricing: `/pricing` shows Free, Pro, Creator, and Business plans. Payment buttons are disabled until checkout is connected.
- Rewards: `/rewards` uses `credit_logs` to grant check-in, ad mock, and creator mission credits.
- Writing styles: `/memory` stores local writing style profiles and applies plan-based limits from `profiles.plan`.
- Notifications: `/notifications` provides local beta notifications without requiring a new database table.
- PWA: `app/manifest.ts` exposes `/manifest.webmanifest`; `public/posty-icon.svg` is a placeholder app icon.
- Admin monitor: `/admin` shows credit usage, reward logs, plan distribution, recent content, and placeholders for missing operational logs.
- Publish package: `/publish/[id]` includes full copy, photo-inclusive HTML copy, platform copy guidance, and per-item copy checks.
- Monetization: `/monetization` documents AdMob, AdSense, Kakao AdFit, Coupang Partners, reward ad policy, and affiliate-link disclosure.

## Sprint 91~100 Beta Notes

- Publish copy supports title, body, HTML, full text, photo-inclusive HTML, image URLs, captions, and platform-specific fallback guidance.
- Reward economics are adjusted around points: 4 points equals 1 credit conceptually, with ad reward capped at 8 views per day.
- Affiliate and purchase links can be typed in editors and are surfaced with disclosure text in publish copy.
- Ad slots are placeholders only. Connect AdMob, AdSense, Kakao AdFit, or Coupang Partners after policy review.
- Payment architecture is still stubbed; keep checkout buttons disabled until Toss Payments or Stripe is wired.

## Sprint 101~110 Beta Notes

- Publish capability audit explains which platforms are copy-ready, API-limited, or token-ready.
- Threads publish now has a mock-safe API route at `/api/publish/threads`.
- Published URLs are stored in `editor_options.platformPostUrl` without requiring a new DB column.
- Rewards Center was redesigned around visible points, credit gauge, ad missions, and a 5-second mock ad completion flow.
- Checkout stub supports Toss/Stripe-ready architecture with `/api/payments/checkout` and billing callback pages.
- `FeatureGate` prepares plan-based UI gating for Pro/Creator/Business features.
- `lib/logger.ts` provides local/server logging structure for API, AI, Supabase, payment, and publish errors.
- `/feedback` collects beta feedback in localStorage until a real backend table is added.

## Sprint 111~120 Photo Publishing Notes

- Review Research lets users enter their own review memo, rating, pros/cons, and reference links. Posty AI summarizes only user-provided text and does not scrape or copy external reviews.
- Cover photos are prioritized in `/saved` thumbnails and `/publish/[id]` publish packages.
- Watermark profiles can be configured in `/profile` and render as CSS overlays in PhotoManager without modifying original images.
- Photo cards now include a compact edit panel for caption edits, replacement, cover selection, watermark scope, and AI decoration entry.
- Publish pages include a simple copy action sheet, photo inclusion checker, and AI CTR coach for title, cover image, first sentence, photo count, and CTA review.

## Sprint 121~130 Photo-First AI Notes

- `/write` includes an AI content plan before drafting, with target reader, photo storyline, section, SEO, design, and publish checks.
- Writer and polish prompts now prioritize human-like wording, user voice strength, photo-based experience, and reduced repetition/overstatement.
- BlogEditor includes a photo-first rewrite action that rewrites drafts around cover photo, body details, and closing image flow.
- Review research links open Google, Naver, and Kakao Map for user-confirmed notes only. Posty AI does not scrape or copy external reviews.
- `/api/review-sources/search` prepares Google Places, Kakao, and Naver official API integration while returning mock/search-link results today.
- `/api/images/generate` and `/api/images/edit` prepare OpenAI image generation/editing and always preserve original uploaded photos.
- Saved-post editing includes AI thumbnail preview styles: minimal, diary, review, and detail-page.
- `/api/review-content-quality` checks AI-like expressions, repetition, overstatement, photo mismatch, and SEO gaps after generation.

## Sprint 131~140 Photo AI Output Notes

- Thumbnail previews can be exported as PNG from the visible composed state without overwriting original photos.
- AI thumbnail results are saved in `editor_options.thumbnails`, with representative thumbnail selection for `/publish/[id]` and saved-card priority display.
- Quality review improvements can be applied, undone, and tracked in `editor_options.qualityReviewHistory`.
- Photo Storyline editing lets users adjust per-photo title, paragraph point, and caption before photo-based rewriting.
- Review provider adapters cover Google Places, Kakao Local, Naver Search, and manual notes in mock/search-link mode by default.
- Google Places, Kakao Local, and Naver Search adapters are API-key ready and return limited place/search metadata without scraping or copying reviews.
- Image AI credit policy is documented as 2 credits for thumbnail generation, image generation, and image editing, with no charge in mock mode.

## Supabase OAuth Redirect URI

For Google/Kakao social login, configure Supabase Auth redirect URLs with your deployed domain:

```text
https://YOUR_DOMAIN/auth/callback
http://localhost:3000/auth/callback
```

Also add the same redirect URI to each provider console when required.

## Vercel Deployment Checklist

1. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `OPENAI_API_KEY`.
2. Add OAuth provider variables when automatic publishing is connected.
3. Run `npx tsc --noEmit` and `npm run build` before deploy.
4. Confirm Supabase SQL in `supabase/schema.sql` has been applied.
5. Rotate any API keys that were exposed during development.
