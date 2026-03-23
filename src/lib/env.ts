const env = {
  appName: process.env.APP_NAME ?? "OnboardKit Mailroom",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  emailDomain: process.env.EMAIL_DOMAIN ?? "onboardkit.pro",
  authSecret: process.env.AUTH_SECRET,
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
  databaseUrl: process.env.DATABASE_URL,
  resendApiKey: process.env.RESEND_API_KEY,
  resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET,
  r2AccountId: process.env.R2_ACCOUNT_ID,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  r2Bucket: process.env.R2_BUCKET,
  allowDemoIngest:
    process.env.ALLOW_DEMO_INGEST === "true" ||
    process.env.NODE_ENV !== "production",
  autoCreateOnReceive: process.env.AUTO_CREATE_ON_RECEIVE === "true",
};

function missing(keys: string[]) {
  return `Missing required environment variables: ${keys.join(", ")}`;
}

export function hasCoreConfig() {
  return Boolean(
    env.authSecret && env.adminPasswordHash && env.databaseUrl,
  );
}

export function hasStorageConfig() {
  return Boolean(
    env.r2AccountId &&
      env.r2AccessKeyId &&
      env.r2SecretAccessKey &&
      env.r2Bucket,
  );
}

export function hasResendConfig() {
  return Boolean(env.resendApiKey && env.resendWebhookSecret);
}

export function assertCoreConfig() {
  const keys = [];

  if (!env.authSecret) keys.push("AUTH_SECRET");
  if (!env.adminPasswordHash) keys.push("ADMIN_PASSWORD_HASH");
  if (!env.databaseUrl) keys.push("DATABASE_URL");

  if (keys.length > 0) {
    throw new Error(missing(keys));
  }
}

export function assertResendConfig() {
  const keys = [];

  if (!env.resendApiKey) keys.push("RESEND_API_KEY");
  if (!env.resendWebhookSecret) keys.push("RESEND_WEBHOOK_SECRET");

  if (keys.length > 0) {
    throw new Error(missing(keys));
  }
}

export function assertStorageConfig() {
  const keys = [];

  if (!env.r2AccountId) keys.push("R2_ACCOUNT_ID");
  if (!env.r2AccessKeyId) keys.push("R2_ACCESS_KEY_ID");
  if (!env.r2SecretAccessKey) keys.push("R2_SECRET_ACCESS_KEY");
  if (!env.r2Bucket) keys.push("R2_BUCKET");

  if (keys.length > 0) {
    throw new Error(missing(keys));
  }
}

export { env };
