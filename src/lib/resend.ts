import { Resend } from "resend";
import { assertResendConfig, env } from "@/lib/env";

function createClient() {
  assertResendConfig();
  return new Resend(env.resendApiKey);
}

let client: Resend | null = null;

export function getResend() {
  if (!client) {
    client = createClient();
  }

  return client;
}

export function verifyResendWebhook(payload: string, headers: {
  id: string;
  timestamp: string;
  signature: string;
}) {
  return getResend().webhooks.verify({
    payload,
    headers,
    webhookSecret: env.resendWebhookSecret!,
  });
}

export async function getReceivedEmail(emailId: string) {
  const response = await getResend().emails.receiving.get(emailId);

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data;
}

export async function listReceivedAttachments(emailId: string) {
  const response = await getResend().emails.receiving.attachments.list({
    emailId,
    limit: 100,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data.data;
}
