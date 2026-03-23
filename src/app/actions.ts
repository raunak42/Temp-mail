"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, createSession, requireSession, verifyPassword } from "@/lib/auth";
import { env, hasCoreConfig } from "@/lib/env";
import { createMailbox, seedDemoMessage, toggleMailboxStatus } from "@/lib/mailboxes";

export type ActionState = {
  error: string | null;
  success?: boolean;
  mailboxId?: string;
};

export async function loginAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!hasCoreConfig()) {
    return {
      error: "Core configuration is missing. Add the required env vars first.",
    };
  }

  const password = String(formData.get("password") ?? "").trim();

  if (!password) {
    return {
      error: "Enter the admin password to unlock the dashboard.",
    };
  }

  const isValid = await verifyPassword(password);

  if (!isValid) {
    return {
      error: "Incorrect password.",
    };
  }

  await createSession();
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function createMailboxAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();

  const preferredLocalPart = String(formData.get("preferredLocalPart") ?? "");
  const label = String(formData.get("label") ?? "");
  const notes = String(formData.get("notes") ?? "");

  try {
    const mailbox = await createMailbox({
      preferredLocalPart: preferredLocalPart || undefined,
      label: label || undefined,
      notes: notes || undefined,
    });

    revalidatePath("/", "layout");

    return {
      error: null,
      success: true,
      mailboxId: mailbox.id,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to create mailbox.",
    };
  }
}

export async function toggleMailboxStatusAction(formData: FormData) {
  await requireSession();

  const mailboxId = String(formData.get("mailboxId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  if (!mailboxId) {
    redirect(redirectTo);
  }

  await toggleMailboxStatus(mailboxId);
  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function demoIngestAction(formData: FormData) {
  await requireSession();

  const mailboxId = String(formData.get("mailboxId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  if (!env.allowDemoIngest || !mailboxId) {
    redirect(redirectTo);
  }

  await seedDemoMessage(mailboxId);
  revalidatePath("/", "layout");
  redirect(redirectTo);
}
