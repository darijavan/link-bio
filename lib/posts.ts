import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 12;

export interface PostPage {
  posts: {
    id: string;
    instagramPostId: string;
    thumbnailUrl: string;
    mediaType: string;
    caption: string;
    extractedUrl: string;
    postedAt: string;
  }[];
  nextCursor: string | null;
}

export type PostMediaFilter = "VIDEO";

function makeGetPostsPage(userId: string, mediaType?: PostMediaFilter) {
  return unstable_cache(
    async (cursor?: string): Promise<PostPage> => {
      const where = {
        userId,
        ...(mediaType ? { mediaType } : {}),
        ...(cursor ? { postedAt: { lt: new Date(cursor) } } : {}),
      };

      const rows = await prisma.post.findMany({
        where,
        orderBy: { postedAt: "desc" },
        take: PAGE_SIZE + 1,
        select: {
          id: true,
          instagramPostId: true,
          thumbnailUrl: true,
          mediaType: true,
          caption: true,
          extractedUrl: true,
          postedAt: true,
        },
      });

      type Row = { id: string; instagramPostId: string; thumbnailUrl: string; mediaType: string; caption: string; extractedUrl: string; postedAt: Date };
      const hasMore = rows.length > PAGE_SIZE;
      const posts = (rows as Row[]).slice(0, PAGE_SIZE).map((p) => ({
        ...p,
        postedAt: p.postedAt.toISOString(),
      }));

      return {
        posts,
        nextCursor: hasMore ? posts[posts.length - 1].postedAt : null,
      };
    },
    [`posts-page-${userId}-${mediaType ?? "ALL"}`],
    { tags: [`posts-${userId}`] }
  );
}

export async function getPostsPage(
  userId: string,
  cursor?: string,
  mediaType?: PostMediaFilter
): Promise<PostPage> {
  return makeGetPostsPage(userId, mediaType)(cursor);
}
