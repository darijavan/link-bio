import { NextRequest, NextResponse } from "next/server";
import { getPostsPage } from "@/lib/posts";
import { getPublicProfile } from "@/lib/public-profile";

const ALLOWED_MEDIA_FILTERS = new Set(["VIDEO"]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const mediaType = req.nextUrl.searchParams.get("mediaType") ?? undefined;

  if (mediaType && !ALLOWED_MEDIA_FILTERS.has(mediaType)) {
    return NextResponse.json({ error: "Invalid mediaType" }, { status: 400 });
  }

  const user = await getPublicProfile(username);
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const page = await getPostsPage(user.id, cursor, mediaType as "VIDEO" | undefined);
  return NextResponse.json(page);
}
