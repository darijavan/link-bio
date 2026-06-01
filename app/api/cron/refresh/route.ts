import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncPostsForUser, refreshTokenIfNeeded } from "@/lib/instagram";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({ select: { id: true } });
  const results = await Promise.allSettled(
    (users as { id: string }[]).map(async (user) => {
      await refreshTokenIfNeeded(user.id);
      return syncPostsForUser(user.id);
    })
  );

  const succeeded = results.filter((r: PromiseSettledResult<number>) => r.status === "fulfilled").length;
  return NextResponse.json({ total: users.length, succeeded });
}
