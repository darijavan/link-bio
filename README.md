# link-bio

A multi-user Instagram link-in-bio SaaS. Connect your Instagram Business or Creator account, set a trigger phrase, and get a public page at `yoursite.com/<your-username>` that automatically displays posts matching that phrase — each card linking to the URL found in the caption.

## How it works

1. A user signs in with their Instagram account (via Facebook OAuth / Instagram Graph API)
2. They set a **trigger phrase** (e.g. `Link in bio 🔗`) in their dashboard
3. Posts whose caption contains that phrase are synced to the database, with the first URL in the caption extracted as the outbound link
4. Their public page at `<username>.yoursite.com` shows a 4:5 portrait grid of post thumbnails with infinite scroll

## Tech stack

- **Next.js 16** (App Router, Turbopack)
- **PostgreSQL** via **Prisma 7** + `@prisma/adapter-pg`
- **NextAuth v5** with a custom Instagram OAuth provider
- **Tailwind CSS v4**
- **Vercel Cron** for hourly post syncing

## Local setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Copy `.env` and fill in the values:

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."          # generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
INSTAGRAM_APP_ID="..."          # Instagram > API setup with Instagram login > Business login settings
INSTAGRAM_APP_SECRET="..."      # same location — not the general Facebook App Secret
CRON_SECRET="..."              # any random string
```

To get `INSTAGRAM_APP_ID` / `INSTAGRAM_APP_SECRET`, see [`docs/meta-app-setup.md`](./docs/meta-app-setup.md). Note these are the **Instagram** App ID and Secret found under Instagram → API setup with Instagram login → Business login settings — not the general Facebook App ID at the top of the Meta dashboard.

### 3. Set up the database

```bash
pnpx prisma migrate dev --name init
```

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

To test subdomain routing locally, add an entry to `/etc/hosts`:

```
127.0.0.1 testuser.localhost
```

Then visit `http://testuser.localhost:3000` after syncing that account.

## Key commands

```bash
pnpm dev                             # Dev server (Turbopack)
pnpm build                           # Production build
pnpm lint                            # ESLint
pnpm exec tsc --noEmit               # Type check

pnpx prisma generate                 # Regenerate client after schema changes
pnpx prisma migrate dev --name <n>   # Create and apply a migration
pnpx prisma studio                   # Visual DB browser
```

## API endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/sync` | Sync posts for the signed-in user |
| `GET` | `/api/cron/refresh` | Hourly cron — refresh all users (requires `Authorization: Bearer <CRON_SECRET>`) |
| `GET` | `/api/posts/[username]?cursor=&limit=12` | Paginated posts feed (used by infinite scroll) |
| `PATCH` | `/api/user/settings` | Update trigger phrase |

## Deployment

Deploy to Vercel. Set all environment variables in the Vercel dashboard, then configure a wildcard domain (`*.yoursite.com`) pointing to your deployment. The cron job in `vercel.json` runs the refresh endpoint hourly.
