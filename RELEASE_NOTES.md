# Posty AI Beta UX Release Candidate

## Release Focus

Posty AI is now polished for beta users: first-run onboarding, one-tap creation, stable draft recovery, safer publish copy, and mobile-first creation flow.

## Highlights

- One Tap Creation with automatic title, keywords, voice, SEO, and photo placement.
- Photo Timeline for arrival, entrance, main, detail, and closing story flow.
- AI Designer 3.0 with diary-style hand-drawn overlays, memo, tape, polaroid, hearts, and stars.
- Human Emotion Writer for more honest, varied, blogger-like writing.
- AI Cover Selection with three CTR-oriented cover candidates.
- Result Preview before generation.
- Failure Recovery that creates a temporary local draft instead of a blank screen.
- Mobile-first create flow with thumb-friendly sticky action.
- Beginner-friendly empty states.
- Labs grouping for advanced and experimental controls.
- First-run onboarding and login-free `/demo` samples.
- Local autosave recovery for `/write` drafts.
- Publish copy preview with HTML clipboard fallback to text plus image URLs.
- Mobile keyboard and safe-area spacing improvements.
- Credit-empty guidance with rewards, pricing, and ad reward education.
- First-generation beta feedback prompt with localStorage throttling.
- Lazy loading for advanced review research and optimized image preview loading.

## QA Gates

- Run `npx tsc --noEmit`.
- Run `npm run build`.
- Check `/qa`.
- Check `/onboarding`, `/demo`, `/write` quick creation, Labs, result preview, autosave recovery, save retry, and photo timeline.
- Check `/publish/[id]` copy preview and HTML fallback behavior.
- Check mobile input flow on iOS Safari or a narrow mobile viewport.
- Confirm original photos are never overwritten by AI design or image tools.

## Known Limits

- Real payment, automatic publishing, and some official provider integrations remain ready-layer or mock mode.
- Google Places snippets require `GOOGLE_PLACES_API_KEY`.
- Supabase SQL from `supabase/schema.sql` is still required for production user-scoped data and credits.
