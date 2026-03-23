import { NextResponse } from "next/server";
import { ingestResendEvent } from "@/lib/mailboxes";
import { verifyResendWebhook } from "@/lib/resend";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.text();
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing webhook signature headers." },
      { status: 400 },
    );
  }

  try {
    const event = verifyResendWebhook(payload, {
      id: svixId,
      timestamp: svixTimestamp,
      signature: svixSignature,
    });

    const result = await ingestResendEvent(event);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid webhook request.",
      },
      { status: 400 },
    );
  }
}
