import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSignedRequest } from "@/lib/auth/signed-request";

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const signedRequest = body.get("signed_request");

    if (typeof signedRequest !== "string") {
      return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
    }

    const payload = parseSignedRequest(signedRequest, process.env.FACEBOOK_APP_SECRET!);

    // Clear the access token — future syncs will fail gracefully
    await prisma.user.updateMany({
      where: { instagramId: payload.user_id },
      data: { accessToken: "", tokenExpiresAt: new Date(0) },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
