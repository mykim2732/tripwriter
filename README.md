# TripWriter

TripWriter는 네이버 블로그, 티스토리, 스레드, 리뷰, 상세페이지까지 한 번에 만들고 편집하는 모바일 우선 AI 콘텐츠 스튜디오입니다.

## 주요 기능

- 플랫폼별 작성: 네이버 블로그, 티스토리, 스레드, 리뷰, 상세페이지
- AI 초안 생성: 키워드, 메모, 사진 설명, 사진 분석 결과 기반
- 모바일 에디터: BlogEditor, DetailEditor, ReviewEditor
- 사진 관리: 업로드, 드래그앤드롭, 순서 변경, 설명 수정, AI 사진 분석
- AI 디자인: 글 다듬기, 사진 설명, 이미지 데코레이터, 리뷰/상세페이지 카드화
- 저장함/발행 준비: 플랫폼별 필터, 복사해서 발행하기, 발행 상태 관리
- 크레딧 기반 준비: Free/Pro/Creator 요금제 UI와 API 비용 메타데이터

## Sprint 36~40 요약

- Sprint 36: 리뷰 전용 `ReviewEditor` 분리, 리뷰 카드형 편집/복사 UX 추가
- Sprint 37: 생성 전 사진 분석 결과가 AI 글 생성에 전달되도록 연결
- Sprint 38: 공통 `PhotoManager` UX 정리 및 에디터별 사진 관리 경험 통일
- Sprint 39: 크레딧/요금제 UI와 API 크레딧 비용 헤더 준비
- Sprint 40: 사진 분석 API 메시지 안정화, README 출시 전 문서화

## 환경변수

`.env.local`에 아래 값을 설정합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 작업을 붙일 때 사용합니다. 브라우저 코드에 노출하지 마세요.

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
```

## 배포 전 확인사항

- Vercel 환경변수에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY` 설정
- Supabase `posts` 테이블과 Storage bucket 정책 적용
- OpenAI API 키는 노출된 적이 있다면 반드시 새 키로 교체
- 자동 발행 기능은 각 플랫폼 API 정책 확인 후 연결
- 실제 크레딧 차감/결제는 로그인과 DB 스키마 설계 후 활성화
