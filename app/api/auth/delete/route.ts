import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSignedRequest } from "@/lib/auth/signed-request";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const signedRequest = body.get("signed_request");

    if (typeof signedRequest !== "string") {
      return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
    }

    const payload = parseSignedRequest(signedRequest, process.env.FACEBOOK_APP_SECRET!);

    // Delete user and all associated posts (cascade is configured in the schema)
    await prisma.user.deleteMany({
      where: { instagramId: payload.user_id },
    });

    const confirmationCode = randomBytes(12).toString("hex");
    const baseUrl = process.env.NEXTAUTH_URL;

    return NextResponse.json({
      url: `${baseUrl}/deletion-status?code=${confirmationCode}&id=${payload.user_id}`,
      confirmation_code: confirmationCode,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
