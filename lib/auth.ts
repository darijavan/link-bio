import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/prisma";
import { CustomInstagramProvider } from "@/lib/auth/instagram-provider";

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

        await prisma.user.upsert({
          where: { instagramId },
          update: { accessToken: token, tokenExpiresAt: expiresAt },
          create: {
            instagramId,
            username,
            accessToken: token,
            tokenExpiresAt: expiresAt,
          },
        });

        // Overwrite with the long-lived token so the jwt callback sees it
        (account as Record<string, unknown>).access_token = token;
        return true;
      } catch {
        return false;
      }
    },
    async session({ session, token }) {
      if (token.sub) {
        const user = await prisma.user.findUnique({ where: { instagramId: token.sub } });
        if (user) {
          session.user.id = user.id;
          session.user.name = user.username;
        }
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account?.providerAccountId) {
        token.sub = account.providerAccountId;
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
