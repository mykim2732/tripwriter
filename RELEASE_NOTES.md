# Posty AI MVP Release Candidate

## Release Focus

Posty AI is now optimized around one-tap content creation: photos, place/product name, and a short memo should be enough to produce a usable first draft.

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

## QA Gates

- Run `npx tsc --noEmit`.
- Run `npm run build`.
- Check `/qa`.
- Check `/write` quick creation, Labs, result preview, recovery draft, and photo timeline.
- Confirm original photos are never overwritten by AI design or image tools.

## Known Limits

- Real payment, automatic publishing, and some official provider integrations remain ready-layer or mock mode.
- Google Places snippets require `GOOGLE_PLACES_API_KEY`.
- Supabase SQL from `supabase/schema.sql` is still required for production user-scoped data and credits.
