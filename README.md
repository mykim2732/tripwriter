# TripWriter

TripWriter는 네이버 블로그, 티스토리, 스레드, 리뷰, 상세페이지 콘텐츠를 만들고 편집하는 모바일 우선 AI 콘텐츠 스튜디오입니다.
사진, 키워드, 메모를 기반으로 AI 초안을 만들고, 편집기에서 사진 배치, AI 디자인, 복사 발행 준비까지 이어갈 수 있습니다.

## 주요 기능

- 플랫폼별 작성: 네이버 블로그, 티스토리, 스레드, 리뷰, 상세페이지
- AI 글 생성: 키워드, 메모, 사진 설명, 사진 분석 결과 기반 초안 생성
- AI 디자인: 글 다듬기, 소제목, 사진 설명, 이미지 꾸미기 추천
- 공통 편집기: BlogEditor, DetailEditor, ReviewEditor와 FloatingEditorToolbar
- 사진 관리: 업로드, 드래그앤드롭, 순서 변경, 설명 수정, AI 사진 분석
- 저장함: 프로젝트별 그룹, 플랫폼 필터, 발행 상태 관리
- 발행 준비: 플랫폼별 복사 순서, HTML/본문/태그 복사, 발행 완료 표시
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
- Storage bucket: `trip-photos`, `blog-attachments`

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
- 자동 발행은 준비 화면과 stub API까지만 구현되어 있습니다.
- 비로그인 guest는 기존 흐름을 유지합니다.
- 로그인 사용자별 저장과 크레딧 기능은 Supabase SQL 적용이 필요합니다.
- 사진 분석은 OpenAI API 호출 비용이 발생할 수 있습니다.

## 보안 메모

개발 중 노출된 OpenAI API Key는 반드시 폐기하고 새 키로 교체하세요.
Vercel과 로컬 `.env.local`에는 새 키만 저장하는 것을 권장합니다.
