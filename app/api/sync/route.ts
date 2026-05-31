import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncPostsForUser } from "@/lib/instagram";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const synced = await syncPostsForUser(session.user.id);
  return NextResponse.json({ synced, updatedAt: new Date().toISOString() });
}
