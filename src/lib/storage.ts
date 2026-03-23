import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { assertStorageConfig, env, hasStorageConfig } from "@/lib/env";

function createClient() {
  assertStorageConfig();

  return new S3Client({
    region: "auto",
    endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.r2AccessKeyId!,
      secretAccessKey: env.r2SecretAccessKey!,
    },
  });
}

let client: S3Client | null = null;

function getClient() {
  if (!client) {
    client = createClient();
  }

  return client;
}

export async function uploadAttachment(
  key: string,
  body: Buffer,
  contentType: string,
) {
  if (!hasStorageConfig()) {
    return null;
  }

  await getClient().send(
    new PutObjectCommand({
      Bucket: env.r2Bucket!,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return key;
}

export async function getAttachmentStream(key: string) {
  const response = await getClient().send(
    new GetObjectCommand({
      Bucket: env.r2Bucket!,
      Key: key,
    }),
  );

  return response;
}
