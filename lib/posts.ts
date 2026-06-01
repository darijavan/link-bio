import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 12;

export interface PostPage {
  posts: {
    id: string;
    instagramPostId: string;
    thumbnailUrl: string;
    caption: string;
    extractedUrl: string;
    postedAt: string;
  }[];
  nextCursor: string | null;
}

function makeGetPostsPage(userId: string) {
  return unstable_cache(
    async (cursor?: string): Promise<PostPage> => {
      const where = cursor
        ? { userId, postedAt: { lt: new Date(cursor) } }
        : { userId };

      const rows = await prisma.post.findMany({
        where,
        orderBy: { postedAt: "desc" },
        take: PAGE_SIZE + 1,
        select: {
          id: true,
          instagramPostId: true,
          thumbnailUrl: true,
          caption: true,
          extractedUrl: true,
          postedAt: true,
        },
      });

      type Row = { id: string; instagramPostId: string; thumbnailUrl: string; caption: string; extractedUrl: string; postedAt: Date };
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
    [`posts-page-${userId}`],
    { tags: [`posts-${userId}`] }
  );
}

export async function getPostsPage(userId: string, cursor?: string): Promise<PostPage> {
  return makeGetPostsPage(userId)(cursor);
}
