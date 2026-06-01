# Plan: link-bio — Instagram Link-in-Bio SaaS

## Context

Build a multi-user SaaS in Next.js similar to linkin.bio but Instagram-only. Each user connects their Instagram Business/Creator account via OAuth, sets a trigger phrase, and gets a public page at a subdomain (e.g. `theatlantic.yoursite.com`). The page displays a 4:5 aspect-ratio grid of post thumbnails — filtered to posts whose caption contains the trigger phrase — each linked to the first bare URL found in that caption. The public page uses infinite scroll with aggressive Next.js caching, invalidated only on explicit refresh.

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: PostgreSQL via **Prisma ORM** (free tier on Neon or Supabase)
- **Auth**: **NextAuth.js** with a custom Facebook/Instagram OAuth provider
- **Styling**: Tailwind CSS
- **Background refresh**: Vercel Cron + manual API endpoint

---

## Architecture

### Subdomain Routing

`middleware.ts` reads `req.headers.host`, extracts the subdomain, and rewrites non-app subdomains to `/[username]`:

```ts
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const subdomain = host.split('.')[0]
  const isApp = ['app', 'www'].includes(subdomain) || host.startsWith('localhost')
  if (!isApp) {
    return NextResponse.rewrite(new URL(`/${subdomain}${req.nextUrl.pathname}`, req.url))
  }
}
```

### Database Schema (Prisma)

```prisma
model User {
  id             String   @id @default(cuid())
  instagramId    String   @unique
  username       String   @unique
  accessToken    String
  tokenExpiresAt DateTime
  triggerPhrase  String   @default("Link in bio 🔗")
  createdAt      DateTime @default(now())
  lastSyncedAt   DateTime?
  posts          Post[]
}

model Post {
  id              String   @id @default(cuid())
  instagramPostId String   @unique
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  thumbnailUrl    String
  caption         String
  extractedUrl    String
  postedAt        DateTime
  cachedAt        DateTime @default(now())

  @@index([userId, postedAt(sort: Desc)])
}
```

### Key App Routes

| Route | Purpose |
|---|---|
| `/` | Landing + "Connect Instagram" CTA |
| `/api/auth/[...nextauth]` | NextAuth OAuth callbacks |
| `/dashboard` | Trigger phrase settings, page URL, manual sync button |
| `/api/sync` | POST — manual refresh for the authenticated user |
| `/api/cron/refresh` | GET — background job, guarded by `CRON_SECRET` |
| `/api/posts/[username]` | GET — paginated posts feed (used by infinite scroll) |
| `/[username]` | Public link-in-bio page (SSR first batch + client infinite scroll) |

---

## Implementation Steps

### 1. Project Bootstrap

```bash
npx create-next-app@latest link-bio --typescript --tailwind --app
npm install prisma @prisma/client next-auth @auth/prisma-adapter
npx prisma init
```

### 2. Instagram OAuth (NextAuth)

- Facebook App → Instagram Graph API product
- Scopes: `instagram_basic`, `pages_show_list`
- `app/api/auth/[...nextauth]/route.ts`: custom provider pointing to Facebook OAuth
- After `signIn` callback: exchange short-lived token for long-lived (60-day) via `GET https://graph.instagram.com/access_token`
- Upsert `User` row in Postgres on first sign-in

### 3. Post Sync Logic (`lib/instagram.ts`)

```ts
const URL_REGEX = /https?:\/\/[^\s)>\]"']+/g

async function syncPostsForUser(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
  const media = await fetchUserMedia(user.accessToken)
  const filtered = media
    .filter(p => p.caption?.includes(user.triggerPhrase))
    .map(p => ({ ...p, extractedUrl: p.caption.match(URL_REGEX)?.[0] }))
    .filter(p => p.extractedUrl)
  await prisma.$transaction(
    filtered.map(p =>
      prisma.post.upsert({
        where: { instagramPostId: p.id },
        update: { thumbnailUrl: p.media_url, caption: p.caption, extractedUrl: p.extractedUrl, cachedAt: new Date() },
        create: { userId, instagramPostId: p.id, thumbnailUrl: p.media_url, caption: p.caption, extractedUrl: p.extractedUrl!, postedAt: new Date(p.timestamp) },
      })
    )
  )
  await prisma.user.update({ where: { id: userId }, data: { lastSyncedAt: new Date() } })
  revalidateTag(`posts-${userId}`)
}
```

`fetchUserMedia` calls `GET https://graph.instagram.com/me/media?fields=id,caption,media_url,thumbnail_url,timestamp`.

### 4. Refresh Endpoints

**`/api/sync` (POST, authenticated)**

- Gets session user, calls `syncPostsForUser(userId)`
- Returns `{ synced: number, updatedAt: string }`

**`/api/cron/refresh` (GET)**

- Validates `Authorization: Bearer <CRON_SECRET>`
- Fetches all users via `prisma.user.findMany()`, calls `syncPostsForUser` for each
- Also refreshes tokens expiring within 7 days via `GET https://graph.instagram.com/refresh_access_token`

### 5. Paginated Posts API (`/api/posts/[username]`)

```
GET /api/posts/theatlantic?cursor=<lastPostedAt ISO>&limit=12
```

- Resolves username → userId via `prisma.user.findUnique({ where: { username } })`
- Queries posts with cursor-based pagination: `where: { userId, postedAt: { lt: cursor } }, orderBy: { postedAt: 'desc' }, take: 13` (take 13, return 12 + set `nextCursor` if 13th exists)
- Response: `{ posts: Post[], nextCursor: string | null }`
- Cached with `unstable_cache` tagged `posts-<userId>`; `syncPostsForUser` calls `revalidateTag('posts-<userId>')` to bust it

### 6. Public Page (`app/[username]/page.tsx`)

- **Server component**: fetches first 12 posts using the same cached query function
- Passes them to `<PostGrid>` client component
- Cards: `aspect-[4/5]` Tailwind class, `object-cover` on Next.js `<Image>`, wrapped in `<a href={extractedUrl} target="_blank" rel="noopener noreferrer">`

### 7. Infinite Scroll (`components/PostGrid.tsx`)

- Client component with `IntersectionObserver` on a sentinel div
- On trigger: fetches `/api/posts/[username]?cursor=<last postedAt>&limit=12`
- Appends posts to local state; hides sentinel when `nextCursor` is null
- Deduplicates by `instagramPostId`

### 8. Dashboard (`app/dashboard/page.tsx`)

- Protected by NextAuth session check
- Editable trigger phrase → `PATCH /api/user/settings` → updates `User.triggerPhrase`
- "Sync now" button → `POST /api/sync`, shows `lastSyncedAt`
- Displays the user's public subdomain URL

---

## Caching Strategy

| Layer | Mechanism | Invalidation |
|---|---|---|
| `/api/posts/[username]` + SSR first batch | `unstable_cache` with `tags: ['posts-<userId>']` | `revalidateTag` in `syncPostsForUser` |
| Prisma client | Connection pooling (PgBouncer on Neon/Supabase) | n/a |
| Instagram API | No cache — always fresh on sync | n/a |

---

## Environment Variables

```bash
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
CRON_SECRET=
```

---

## Verification

1. `npx prisma migrate dev` → inspect schema in Prisma Studio
2. Sign in with a test Instagram Business account → verify `users` row created with long-lived token
3. `POST /api/sync` → verify `posts` rows contain only trigger-phrase-matching posts, each with `extractedUrl`
4. Visit `/<username>` → first 12 posts render server-side; scroll to bottom → next batch loads via `IntersectionObserver`
5. Sync again → `revalidateTag` fires, next page load reflects fresh data
6. Set `tokenExpiresAt` to 3 days out, hit cron endpoint → verify token is refreshed in DB
