import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { env } from "@/lib/env";
import { seedDemoMessage } from "@/lib/mailboxes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireApiSession();

    if (!env.allowDemoIngest) {
      return NextResponse.json(
        { error: "Demo ingest is disabled." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as { mailboxId?: string };

    if (!body.mailboxId) {
      return NextResponse.json(
        { error: "mailboxId is required." },
        { status: 400 },
      );
    }

    await seedDemoMessage(body.mailboxId);
    return NextResponse.json({ stored: true });
  } catch (error) {
    const status =
      error instanceof Error && error.message === "Unauthorized" ? 401 : 500;

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to seed demo mail.",
      },
      { status },
    );
  }
}
