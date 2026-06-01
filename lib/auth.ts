import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CustomInstagramProvider } from "@/lib/auth/instagram-provider";
import { getPublicProfileCacheTag } from "@/lib/public-profile";

async function exchangeForLongLivedToken(shortLivedToken: string): Promise<{ token: string; expiresAt: Date }> {
  const clientSecret = process.env.INSTAGRAM_APP_SECRET;
  if (!clientSecret) throw new Error("Missing INSTAGRAM_APP_SECRET");

  const url = new URL("https://graph.instagram.com/access_token");
  url.search = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: clientSecret,
    access_token: shortLivedToken,
  }).toString();

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to exchange Instagram token");
  const data = await res.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  return { token: data.access_token, expiresAt };
}

const config: NextAuthConfig = {
  providers: [
    CustomInstagramProvider({
      clientId: process.env.INSTAGRAM_APP_ID,
      clientSecret: process.env.INSTAGRAM_APP_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ account, user }) {
      if (!account || account.provider !== "instagram") return false;

      try {
        const { token, expiresAt } = await exchangeForLongLivedToken(account.access_token!);

        // user.name is set to the Instagram username by our provider's profile() callback
        const username = user.name!;
        const instagramId = account.providerAccountId!;

        const dbUser = await prisma.user.upsert({
          where: { instagramId },
          update: { accessToken: token, tokenExpiresAt: expiresAt },
          create: {
            instagramId,
            username,
            accessToken: token,
            tokenExpiresAt: expiresAt,
          },
          select: { id: true, username: true },
        });

        user.id = dbUser.id;
        user.name = dbUser.username;
        revalidateTag(getPublicProfileCacheTag(dbUser.username), "default");

        // Overwrite with the long-lived token so the jwt callback sees it
        (account as Record<string, unknown>).access_token = token;
        return true;
      } catch {
        return false;
      }
    },
    async session({ session, token }) {
      if (typeof token.userId === "string") {
        session.user.id = token.userId;
      }
      if (typeof token.username === "string") {
        session.user.name = token.username;
      }
      return session;
    },
    async jwt({ token, account, user }) {
      if (account?.providerAccountId) {
        token.sub = account.providerAccountId;
        token.userId = user.id;
        token.username = user.name;
      } else if (token.sub && !token.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { instagramId: token.sub },
          select: { id: true, username: true },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.username = dbUser.username;
        }
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
