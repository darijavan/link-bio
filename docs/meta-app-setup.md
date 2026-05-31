# Meta App Setup Guide

Step-by-step guide to create a Meta developer app for ig-bio, based on the current [Instagram API with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/) documentation. This flow does **not** require a Facebook Page — only an Instagram Professional account.

---

## Prerequisites

- A Facebook account (personal is fine)
- An Instagram account switched to **Professional** (Business or Creator)

### Switch your Instagram account to Professional

1. Open Instagram on mobile → **Settings & Privacy → Account type and tools → Switch to Professional Account**
2. Choose **Creator** or **Business** — either works
3. Pick a category (any) → tap **Done**

---

## Part 1 — Create the Meta Developer App

### 1. Register as a Meta Developer

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **Get Started** in the top right
3. Log in with your Facebook account
4. Accept the developer terms and verify your phone number if prompted

### 2. Create the App

1. In the [App Dashboard](https://developers.facebook.com/apps), click **Create App**
2. When asked "What do you want your app to do?", select **Other**
3. Select app type **Business**
4. Fill in:
   - **App name**: e.g. `ig-bio`
   - **App contact email**: your email
5. Click **Create App** (you may be asked to re-enter your Facebook password)

### 3. Add the Instagram Product

1. On the App Dashboard, scroll down to find **Instagram** in the product list
2. Click **Set up** on the Instagram card
3. You will land on the Instagram setup page — choose **API setup with Instagram login** (not "Facebook Login")

---

## Part 2 — Configure Instagram Login

### 4. Set OAuth Redirect URIs

This is where you tell Meta which URLs are allowed to receive the auth callback.

1. In the left sidebar, go to **Instagram → API setup with Instagram login**
2. Find the **Business login settings** section
3. Under **OAuth redirect URIs**, add:

   ```
   https://yourdomain.com/api/auth/callback/instagram
   ```

   For **local development**, also add:

   ```
   http://localhost:3000/api/auth/callback/instagram
   ```

   > Both can exist at the same time. Meta allows `localhost` URIs in Development mode.

4. Click **Save changes**

### 5. Note your App Credentials

1. Go to **App Settings → Basic** in the left sidebar
2. Copy **App ID** → this is your `FACEBOOK_APP_ID`
3. Click **Show** next to **App Secret** → this is your `FACEBOOK_APP_SECRET`
4. Paste both into your `.env` file:

   ```bash
   FACEBOOK_APP_ID="123456789012345"
   FACEBOOK_APP_SECRET="abc123..."
   ```

### 6. Add Your Instagram Account as a Test User

While the app is in **Development mode**, only accounts explicitly added as testers or admins can authorize it.

1. Go to **App Roles → Roles** in the left sidebar
2. Under **Instagram Testers**, click **Add Instagram Testers**
3. Enter your Instagram username and send the invite
4. On your Instagram mobile app, go to **Settings → Apps and Websites → Tester Invites** and accept the invite

> You only need this step in Development mode. Once the app goes Live, anyone can authorize it.

---

## Part 3 — Local Development

Local testing **is possible** as long as your Instagram account is added as a tester (Step 6 above).

### 7. Configure your `.env`

```bash
DATABASE_URL="your-neon-or-supabase-connection-string"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
FACEBOOK_APP_ID="your-app-id"
FACEBOOK_APP_SECRET="your-app-secret"
CRON_SECRET="any-random-string"
```

### 8. Run the database migration

```bash
pnpx prisma migrate dev --name init
```

### 9. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), click **Connect with Instagram**, and authorize with your Instagram tester account. You should land on `/dashboard`.

### 10. Test a sync

In the Dashboard, click **Sync now**. For posts to appear, at least one of your Instagram posts must contain the trigger phrase (default: `Link in bio 🔗`) and have a URL somewhere in the caption.

---

## Part 4 — Deploy to Vercel (Free)

If you'd rather skip local setup and go straight to production:

### 11. Push to GitHub

```bash
git add .
git commit -m "initial setup"
git push origin main
```

### 12. Import the project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub (free Hobby plan is enough)
2. Select the `ig-bio` repository → click **Import**
3. Leave the framework as **Next.js** — Vercel detects it automatically
4. Before deploying, expand **Environment Variables** and add all six from your `.env`:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | your Neon/Supabase connection string |
   | `NEXTAUTH_SECRET` | output of `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | `https://your-project.vercel.app` |
   | `FACEBOOK_APP_ID` | from Meta App Dashboard |
   | `FACEBOOK_APP_SECRET` | from Meta App Dashboard |
   | `CRON_SECRET` | any random string |

5. Click **Deploy**

### 13. Add your Vercel URL as a redirect URI

Once deployed, copy your Vercel URL (e.g. `https://ig-bio-abc.vercel.app`) and go back to Meta App Dashboard:

1. **Instagram → API setup with Instagram login → Business login settings → OAuth redirect URIs**
2. Add: `https://your-project.vercel.app/api/auth/callback/instagram
`
3. Save changes

Update `NEXTAUTH_URL` in Vercel environment variables to match this URL, then **redeploy** (Settings → Environment Variables → save → Deployments → Redeploy).

### 14. Run the database migration on your hosted DB

If you're using Neon or Supabase, migrations run automatically on the first deploy via the Prisma migrate step, or you can run it manually:

```bash
DATABASE_URL="your-production-url" pnpx prisma migrate deploy
```

---

## Part 5 — Going Live (for other users)

By default the app is in **Development mode** — only you (and added testers) can sign in. To allow anyone to connect their Instagram account:

### 15. Request required permissions

1. Go to **App Review → Permissions and Features**
2. Request `instagram_business_basic` — click **Request** and follow the submission form
3. Meta will ask for a screencast showing how your app uses the permission

### 16. Switch the app to Live mode

1. Go to the top of the App Dashboard
2. Toggle the app from **Development** to **Live**
3. Confirm the dialog

> In Live mode, any Instagram Professional account (Business or Creator) can connect to your app without needing a tester invite.

---

## OAuth Flow Reference

For reference, this is the full flow that `lib/auth.ts` implements:

```
1. User clicks "Connect with Instagram"
   → Redirected to: https://www.instagram.com/oauth/authorize
       ?client_id=<APP_ID>
       &redirect_uri=<CALLBACK_URL>
       &response_type=code
       &scope=instagram_business_basic

2. User approves → redirected back to /api/auth/callback/instagram?code=<CODE>

3. Server POSTs to https://api.instagram.com/oauth/access_token
   → Receives short-lived token (1 hour)

4. Server GETs https://graph.instagram.com/access_token
       ?grant_type=ig_exchange_token&client_secret=<SECRET>&access_token=<SHORT>
   → Receives long-lived token (60 days)

5. Token + Instagram user ID stored in the User table
```
