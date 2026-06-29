# Changelog

## Sprint 41~50

### Sprint 41: Floating editor toolbar
- Added a shared FloatingEditorToolbar to BlogEditor, DetailEditor, and ReviewEditor.
- Unified the fixed bottom editing toolbar experience.
- Recovered broken ReviewEditor TSX and labels.

### Sprint 42: Supabase Auth
- Added email signup and login flow on /login.
- Added account session and logout display on /account.
- Prepared the app for user-scoped saves and credits.

### Sprint 43: Profiles/Credits schema
- Added profiles and credit_logs SQL to supabase/schema.sql.
- Added RLS policies and a new-user profile trigger.
- Added ensureProfile and credit types in lib/credits.ts.

### Sprint 44: Credit consumption
- Connected 1-credit consumption for AI post generation, AI design, and AI photo analysis for signed-in users.
- Added authFetch for Supabase bearer-token API calls.
- Preserved the guest flow.

### Sprint 45: Publishing stubs
- Added Naver, Tistory, and Threads OAuth callback stubs.
- Added publish API stubs for each platform.
- Added platform connection preparation cards.

### Sprint 46: Copy publishing workflow
- Added platform-specific copy steps to /publish/[id].
- Covered blog, Threads, review, and detail-page publishing flows.

### Sprint 47: Saved data normalization
- Strengthened normalizePost and editor_options fallbacks.
- Stabilized platform, contentType, selectedTitle, captions, analysis, decorators, links, detailPage, and reviewPage restoration.

### Sprint 48: Shared states
- Added LoadingCard, ErrorCard, and EmptyState.
- Unified loading, error, and empty states across key pages.

### Sprint 49: QA page
- Added /qa with operational checks for Supabase, Auth, AI features, saved posts, publishing, and credits.

### Sprint 50: Release docs
- Updated README with environment variables, Supabase SQL, verification steps, and limitations.

## Sprint 51~60

### Sprint 51: AI Rewrite Pro
- Added /api/rewrite-post.
- Added one-click rewrite options for multiple styles.

### Sprint 52: AI Trend
- Added /api/trend-suggestions.
- Added trend keywords, expressions, content angles, and title ideas UI.

### Sprint 53: AI Thumbnail
- Added /api/generate-thumbnail-plan.
- Added ThumbnailStudio for cover-image layout planning.

### Sprint 54: AI Template Market
- Added TemplateMarket.
- Added multiple design templates such as diary, cafe, Notion, news, and magazine styles.

### Sprint 55: SEO Coach 2.0
- Added one-click SEO improvements for titles, keywords, CTAs, and quick fixes.

### Sprint 56: AI Image Studio
- Added CSS-based white-pen decorations, memo notes, and masking tape overlays.

### Sprint 57: Workspace
- Added /workspace project grouping.
- Grouped related blog, thread, review, and detail-page content.

### Sprint 58: Calendar
- Added /calendar for publishing preparation.
- Added status views for drafts, scheduled items, and published content.

### Sprint 59: AI Memory
- Added /memory for tone, CTA, design, and photo-style preferences.
- Uses localStorage for now and is ready for Supabase user storage later.

### Sprint 60: Beta Release
- Added /onboarding and /faq.
- Updated release documentation.
- Strengthened OAuth callback and fixed editor-toolbar foundations.

## Sprint 61~70

### Sprint 61: Social signup
- Cleaned up Google/Kakao social-login wording and flow.
- Ensured OAuth login can create a profile automatically.

### Sprint 62: Random nickname
- Added random Posty-style nickname generation when display_name is empty.

### Sprint 63~64: Profile settings and avatar
- Added /profile.
- Added nickname, avatar, bio, content fields, and preferred tone settings.
- Connected profile-images Storage upload support.

### Sprint 65: Account page
- Rebuilt /account as a SaaS-style my page.
- Shows profile, provider, plan, credits, monthly usage, and content count.

### Sprint 66~67: Admin foundation
- Added /admin.
- Added profiles.role based access checks and admin metric cards.

### Sprint 68: User content filtering
- Saved and loaded signed-in user posts by auth.uid.
- Kept guest content isolated from signed-in content.

### Sprint 69: Onboarding profile
- Added /onboarding/profile with nickname, interests, and preferred tone steps.

### Sprint 70: Stability
- Cleaned up Posty AI branding and broken copy.
- Updated README, CHANGELOG, and QA checklist.

## Sprint 71~80

### Sprint 71: Settings Modal
- Added SettingsModal with Posty settings, role settings, account settings, theme settings, notices, support, and logout.
- Connected it from /account.

### Sprint 72: Role / Persona Settings
- Added local role/persona settings for default AI behavior, emoji level, sentence length, heading style, design style, and recommended platform.
- Saved profile tone into the existing preferred_tone field without requiring new SQL.

### Sprint 73: My Writing Styles
- Rebuilt /memory with writing-style profiles.
- Free plan supports one saved writing style locally, ready for Pro/Creator expansion.
- /write can select a saved writing style and pass it into generation reference text.

### Sprint 74: Writing Style Analyzer API
- Added /api/analyze-writing-style.
- Converts pasted samples into tone, sentence, emoji, paragraph, title, CTA, do/don't rules.

### Sprint 75: Reward Center
- Added /rewards with daily check-in, ad mock reward, profile completion, writing-style, first publish, and invite placeholder rewards.

### Sprint 76: Reward Credit Logic
- Added lib/rewards.ts.
- Uses existing profiles.credits and credit_logs to grant rewards and prevent duplicate daily rewards.

### Sprint 77: Theme Settings
- Added light/system/dark theme setting in SettingsModal.
- Added basic dark-mode CSS variables and card readability rules.

### Sprint 78: Admin Dashboard Plus
- Expanded /admin with reward logs, platform ratio, recent users, recent content, and error-log placeholder.

### Sprint 79: Customer Center / Notices
- Added /notices and /support pages.
- Support form stores a local placeholder draft until email/ticket backend is connected.

### Sprint 80: Branding Polish
- Extended QA checklist with settings, writing styles, rewards, notices/support, and admin checks.
- Updated README and CHANGELOG.

## Next

- Real OAuth publishing integration.
- Paid subscription and checkout.
- Server-side atomic credit RPC.
- Published URL tracking.
- Deeper profile, workspace, and project management.

## Sprint 81~90

### Sprint 81: Pricing Page
- Added `/pricing` with Free, Pro, Creator, and Business beta plan cards.
- Connected pricing links from account and rewards flows.

### Sprint 82: Credit Guard UX
- Added `CreditEmptyCard` for low-credit states.
- Improved credit-empty API messaging with reward and pricing actions.

### Sprint 83: Writing Style Limits
- Added plan-based writing style limits: Free 1, Pro 3, Creator 5, Business 10.
- Updated `/memory` with usage badges and plan-aware upgrade guidance.

### Sprint 84: Writing Style Apply Quality
- Added writing style strength selection in `/write`.
- Strengthened generation and polish prompts so saved style profiles affect tone without copying samples.

### Sprint 85: Rewards Real UX
- Polished `/rewards` with ad reward remaining count, claimed states, animation, and recent reward history.

### Sprint 86: Notification Center
- Added `/notifications` and `NotificationBell` for beta notices and credit/product updates.

### Sprint 87: App Shell Polish
- Updated mobile bottom navigation with Home, Write, Saved, Rewards, and Account.
- Added safe-area spacing and Posty AI metadata.

### Sprint 88: PWA Preparation
- Added `app/manifest.ts` and `public/posty-icon.svg`.
- Added home-screen install guidance on the homepage.

### Sprint 89: Admin Reward/Credit Monitor
- Expanded `/admin` with credit usage, reward amount, ad reward clicks, plan distribution, and recent credit logs.

### Sprint 90: Beta Launch QA
- Expanded `/qa`, README, and release documentation for pricing, rewards, memory, PWA, notifications, and OAuth redirect checks.
