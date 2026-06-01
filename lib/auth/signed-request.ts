import { createHmac, timingSafeEqual } from "crypto";

interface SignedRequestPayload {
  user_id: string;
  algorithm: string;
  issued_at: number;
}

export function parseSignedRequest(signedRequest: string, appSecret: string): SignedRequestPayload {
  const [encodedSig, encodedPayload] = signedRequest.split(".");
  if (!encodedSig || !encodedPayload) throw new Error("Malformed signed_request");

  const expectedSig = createHmac("sha256", appSecret)
    .update(encodedPayload)
    .digest();

  const receivedSig = Buffer.from(encodedSig, "base64url");

  if (
    receivedSig.length !== expectedSig.length ||
    !timingSafeEqual(receivedSig, expectedSig)
  ) {
    throw new Error("Invalid signed_request signature");
  }

  const payload = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8")
  ) as SignedRequestPayload;

  if (payload.algorithm !== "HMAC-SHA256") {
    throw new Error("Unexpected algorithm in signed_request");
  }

  return payload;
}
