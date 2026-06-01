import { NextRequest, NextResponse } from "next/server";
import { getPostsPage } from "@/lib/posts";
import { getPublicProfile } from "@/lib/public-profile";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;

  const user = await getPublicProfile(username);
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const page = await getPostsPage(user.id, cursor);
  return NextResponse.json(page);
}
