import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refreshProfilePicture } from "@/lib/instagram";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, profilePictureUrl: true },
  });
  if (!user?.profilePictureUrl) {
    return new NextResponse(null, { status: 404 });
  }

  let imageRes = await fetch(user.profilePictureUrl, { cache: "no-store" });

  if (!imageRes.ok) {
    const freshUrl = await refreshProfilePicture(user.id);
    if (!freshUrl) return new NextResponse(null, { status: 502 });
    imageRes = await fetch(freshUrl, { cache: "no-store" });
    if (!imageRes.ok) return new NextResponse(null, { status: 502 });
  }

  const contentType = imageRes.headers.get("content-type") ?? "image/jpeg";
  const body = imageRes.body;

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
