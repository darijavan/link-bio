# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm exec tsc --noEmit  # Type check without building

pnpx prisma generate   # Regenerate client after schema changes
pnpx prisma migrate dev --name <name>  # Create and apply a migration
pnpx prisma studio     # Visual DB browser
```

## Architecture

**link-bio** is a multi-user SaaS where Instagram Business/Creator accounts connect via OAuth and get a public link-in-bio page at `yoursite.com/:username`. Posts are filtered by a per-user trigger phrase; the first bare URL in the caption becomes the outbound link.

### Routing

Path-based — no proxy/middleware needed. `app/[username]/page.tsx` handles public profile pages at `/:username`. Explicit routes (`/dashboard`, `/api/...`) take precedence over the dynamic segment in Next.js's routing hierarchy.

### Database

Prisma 7 with `@prisma/adapter-pg` (driver adapter — required in Prisma 7, no URL-based connection). Schema is in `prisma/schema.prisma`; the generated client lives in `app/generated/prisma/` (gitignored). Always import from `@/lib/prisma` — never instantiate `PrismaClient` directly. DB URL and migrations config live in `prisma.config.ts`.

### Auth

NextAuth v5 (`next-auth@beta`) with a custom Instagram OAuth provider. Facebook App credentials are used (`FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`). On sign-in, the short-lived token is exchanged for a 60-day long-lived token and stored on the `User` row. The session `user.id` maps to `User.id` in Postgres (not the NextAuth internal session ID).

### Data sync

`lib/instagram.ts` contains all Instagram Graph API calls. `syncPostsForUser(userId)` fetches media, filters by trigger phrase, extracts the first URL via regex, upserts posts, and calls `revalidateTag("posts-<userId>", "default")` to bust the Next.js cache.

Token refresh runs in the cron job (`/api/cron/refresh`) — tokens within 7 days of expiry are refreshed via the Instagram refresh endpoint.

### Caching

Post queries use `unstable_cache` (from `next/cache`) tagged `posts-<userId>`. Both the SSR first-page load (`app/[username]/page.tsx`) and the paginated API (`/api/posts/[username]`) share the same cached function from `lib/posts.ts`. The cache is invalidated only when a sync runs.

### Public page

`app/[username]/page.tsx` is a server component that renders the first 12 posts. It passes them to `<PostGrid>` (client component in `components/PostGrid.tsx`) which handles infinite scroll via `IntersectionObserver`. Cards use `aspect-[4/5]` (portrait 4:5 ratio).

### Key env vars

`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `CRON_SECRET`

The cron job runs hourly via Vercel Cron (`vercel.json`) and is authenticated with `Authorization: Bearer <CRON_SECRET>`.
