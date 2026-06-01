import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface PublicProfile {
  id: string;
  username: string;
  logoUrl: string | null;
}

export function getPublicProfileCacheTag(username: string) {
  return `public-profile-${username}`;
}

function makeGetPublicProfile(username: string) {
  return unstable_cache(
    async (): Promise<PublicProfile | null> => {
      return prisma.user.findUnique({
        where: { username },
        select: { id: true, username: true, logoUrl: true },
      });
    },
    [`public-profile-${username}`],
    {
      revalidate: 3600,
      tags: [getPublicProfileCacheTag(username)],
    }
  );
}

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  return makeGetPublicProfile(username)();
}
