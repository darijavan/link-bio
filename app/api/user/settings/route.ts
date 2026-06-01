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

  const { triggerPhrase, logoUrl } = await req.json();
  if (typeof triggerPhrase !== "string" || !triggerPhrase.trim()) {
    return NextResponse.json({ error: "Invalid trigger phrase" }, { status: 400 });
  }

  if (logoUrl !== null && logoUrl !== undefined && typeof logoUrl !== "string") {
    return NextResponse.json({ error: "Invalid logo URL" }, { status: 400 });
  }

  const normalizedLogoUrl = typeof logoUrl === "string" ? logoUrl.trim() : null;
  if (normalizedLogoUrl) {
    try {
      const parsedLogoUrl = new URL(normalizedLogoUrl);
      if (parsedLogoUrl.protocol !== "https:") {
        return NextResponse.json({ error: "Logo URL must use HTTPS" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid logo URL" }, { status: 400 });
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      triggerPhrase: triggerPhrase.trim(),
      ...(logoUrl !== undefined && { logoUrl: normalizedLogoUrl || null }),
    },
    select: { username: true, triggerPhrase: true, logoUrl: true },
  });

  revalidateTag(getPublicProfileCacheTag(user.username), "default");

  return NextResponse.json(user);
}
