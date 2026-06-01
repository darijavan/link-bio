import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPublicProfileCacheTag } from "@/lib/public-profile";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { triggerPhrase, headerText } = await req.json();
  if (typeof triggerPhrase !== "string" || !triggerPhrase.trim()) {
    return NextResponse.json({ error: "Invalid trigger phrase" }, { status: 400 });
  }

  if (headerText !== null && headerText !== undefined && typeof headerText !== "string") {
    return NextResponse.json({ error: "Invalid header text" }, { status: 400 });
  }

  const normalizedHeaderText = typeof headerText === "string" ? headerText.trim() : null;
  if (normalizedHeaderText && normalizedHeaderText.length > 80) {
    return NextResponse.json({ error: "Header text must be 80 characters or fewer" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      triggerPhrase: triggerPhrase.trim(),
      ...(headerText !== undefined && { headerText: normalizedHeaderText || null }),
    },
    select: { username: true, triggerPhrase: true, headerText: true },
  });

  revalidateTag(getPublicProfileCacheTag(user.username), "default");

  return NextResponse.json(user);
}
