import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/prisma";

async function exchangeForLongLivedToken(shortLivedToken: string): Promise<{ token: string; expiresAt: Date }> {
  const res = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.FACEBOOK_APP_SECRET}&access_token=${shortLivedToken}`
  );
  if (!res.ok) throw new Error("Failed to exchange Instagram token");
  const data = await res.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  return { token: data.access_token, expiresAt };
}

async function fetchInstagramProfile(accessToken: string): Promise<{ id: string; username: string }> {
  const res = await fetch(
    `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
  );
  if (!res.ok) throw new Error("Failed to fetch Instagram profile");
  return res.json();
}

const config: NextAuthConfig = {
  providers: [
    {
      id: "instagram",
      name: "Instagram",
      type: "oauth",
      authorization: {
        url: "https://api.instagram.com/oauth/authorize",
        params: {
          scope: "instagram_basic,pages_show_list",
          response_type: "code",
        },
      },
      token: "https://api.instagram.com/oauth/access_token",
      userinfo: {
        url: "https://graph.instagram.com/me",
        params: { fields: "id,username" },
      },
      clientId: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.username,
          email: null,
          image: null,
        };
      },
    },
  ],
  callbacks: {
    async signIn({ account }) {
      if (!account || account.provider !== "instagram") return false;

      try {
        const { token, expiresAt } = await exchangeForLongLivedToken(account.access_token!);
        const profile = await fetchInstagramProfile(token);

        await prisma.user.upsert({
          where: { instagramId: profile.id },
          update: { accessToken: token, tokenExpiresAt: expiresAt },
          create: {
            instagramId: profile.id,
            username: profile.username,
            accessToken: token,
            tokenExpiresAt: expiresAt,
          },
        });

        // Store the long-lived token on the account object for the jwt callback
        (account as Record<string, unknown>).access_token = token;
        account.providerAccountId = profile.id;
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
