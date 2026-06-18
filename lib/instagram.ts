import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

const URL_REGEX = /https?:\/\/[^\s)>\]"']+/g;

interface InstagramMedia {
  id: string;
  caption?: string;
  media_url: string;
  media_type?: string;
  thumbnail_url?: string;
  timestamp: string;
}

interface InstagramMediaPage {
  data?: InstagramMedia[];
  paging?: {
    next?: string;
  };
}

function buildMediaUrl(accessToken: string): string {
  const url = new URL("https://graph.instagram.com/me/media");
  url.search = new URLSearchParams({
    fields: "id,caption,media_url,media_type,thumbnail_url,timestamp",
    access_token: accessToken,
    limit: "100",
  }).toString();

  return url.toString();
}

async function fetchUserMediaPage(url: string): Promise<InstagramMediaPage> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Instagram API error: ${res.status}`);
  return res.json();
}

export async function fetchUserMedia(accessToken: string): Promise<InstagramMedia[]> {
  const media: InstagramMedia[] = [];
  let nextUrl: string | null = buildMediaUrl(accessToken);

  while (nextUrl) {
    const page = await fetchUserMediaPage(nextUrl);
    media.push(...(page.data ?? []));
    nextUrl = page.paging?.next ?? null;
  }

  return media;
}

export async function syncPostsForUser(userId: string): Promise<number> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  let synced = 0;
  let nextUrl: string | null = buildMediaUrl(user.accessToken);

  while (nextUrl) {
    const page = await fetchUserMediaPage(nextUrl);
    const filtered = (page.data ?? [])
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
              mediaType: p.media_type ?? "IMAGE",
              caption: p.caption ?? "",
              extractedUrl: p.extractedUrl,
              cachedAt: new Date(),
            },
            create: {
              userId,
              instagramPostId: p.id,
              thumbnailUrl: p.imageUrl,
              mediaType: p.media_type ?? "IMAGE",
              caption: p.caption ?? "",
              extractedUrl: p.extractedUrl,
              postedAt: new Date(p.timestamp),
            },
          })
        )
      );
      synced += filtered.length;
    }

    nextUrl = page.paging?.next ?? null;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { lastSyncedAt: new Date() },
  });

  revalidateTag(`posts-${userId}`, "default");
  return synced;
}

export async function refreshProfilePicture(userId: string): Promise<string | null> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { accessToken: true },
  });

  const url = new URL("https://graph.instagram.com/me");
  url.search = new URLSearchParams({
    fields: "profile_picture_url",
    access_token: user.accessToken,
  }).toString();

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const data = await res.json();
  const profilePictureUrl: string | null = data.profile_picture_url ?? null;

  await prisma.user.update({
    where: { id: userId },
    data: { profilePictureUrl },
  });

  return profilePictureUrl;
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
