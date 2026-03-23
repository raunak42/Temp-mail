import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/auth";
import { resolveAttachmentDownload } from "@/lib/mailboxes";

export const runtime = "nodejs";

type AttachmentRouteProps = {
  params: Promise<{
    attachmentId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: AttachmentRouteProps,
) {
  try {
    await requireApiSession();

    const { attachmentId } = await params;
    const file = await resolveAttachmentDownload(attachmentId);

    if (!file) {
      return NextResponse.json(
        { error: "Attachment not found." },
        { status: 404 },
      );
    }

    let body = file.body as BodyInit | null;

    if (
      body &&
      typeof body === "object" &&
      "transformToWebStream" in body &&
      typeof body.transformToWebStream === "function"
    ) {
      body = body.transformToWebStream();
    }

    return new Response(body, {
      headers: {
        "content-type": file.contentType,
        "content-disposition": `inline; filename="${file.filename ?? "attachment"}"`,
      },
    });
  } catch (error) {
    const status =
      error instanceof Error && error.message === "Unauthorized" ? 401 : 500;

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to fetch attachment.",
      },
      { status },
    );
  }
}
