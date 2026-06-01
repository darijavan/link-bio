import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

const URL_REGEX = /https?:\/\/[^\s)>\]"']+/g;

interface InstagramMedia {
  id: string;
  caption?: string;
  media_url: string;
  thumbnail_url?: string;
  timestamp: string;
}

export async function fetchUserMedia(accessToken: string): Promise<InstagramMedia[]> {
  const url = new URL("https://graph.instagram.com/me/media");
  url.search = new URLSearchParams({
    fields: "id,caption,media_url,thumbnail_url,timestamp",
    access_token: accessToken,
    limit: "100",
  }).toString();

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Instagram API error: ${res.status}`);
  const data = await res.json();
  return data.data ?? [];
}

export async function syncPostsForUser(userId: string): Promise<number> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const media = await fetchUserMedia(user.accessToken);

  const filtered = media
    .filter((p) => p.caption?.includes(user.triggerPhrase))
    .map((p) => ({
      ...p,
      extractedUrl: p.caption?.match(URL_REGEX)?.[0] ?? null,
      imageUrl: p.thumbnail_url ?? p.media_url,
    }))
    .filter((p): p is typeof p & { extractedUrl: string } => p.extractedUrl !== null);

  if (filtered.length > 0) {
    await prisma.$transaction(
      filtered.map((p) =>
        prisma.post.upsert({
          where: { instagramPostId: p.id },
          update: {
            thumbnailUrl: p.imageUrl,
            caption: p.caption ?? "",
            extractedUrl: p.extractedUrl,
            cachedAt: new Date(),
          },
          create: {
            userId,
            instagramPostId: p.id,
            thumbnailUrl: p.imageUrl,
            caption: p.caption ?? "",
            extractedUrl: p.extractedUrl,
            postedAt: new Date(p.timestamp),
          },
        })
      )
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { lastSyncedAt: new Date() },
  });

  revalidateTag(`posts-${userId}`, "default");
  return filtered.length;
}

export async function refreshTokenIfNeeded(userId: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  if (user.tokenExpiresAt > sevenDaysFromNow) return;

  const url = new URL("https://graph.instagram.com/refresh_access_token");
  url.search = new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: user.accessToken,
  }).toString();

  const res = await fetch(url);
  if (!res.ok) return;

  const data = await res.json();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  await prisma.user.update({
    where: { id: userId },
    data: { accessToken: data.access_token, tokenExpiresAt: expiresAt },
  });
}
