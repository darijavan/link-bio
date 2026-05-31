import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPostsPage } from "@/lib/posts";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;

  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const page = await getPostsPage(user.id, cursor);
  return NextResponse.json(page);
}
