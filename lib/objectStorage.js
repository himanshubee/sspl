import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.B2_S3_ENDPOINT;
const region = process.env.B2_S3_REGION || "us-east-005";
const accessKeyId = process.env.B2_KEY_ID;
const secretAccessKey = process.env.B2_APPLICATION_KEY;
const bucket = process.env.B2_BUCKET;
const defaultExpirySeconds = Number(process.env.B2_SIGNED_URL_TTL ?? 900);

if (!endpoint) {
  throw new Error("Missing B2_S3_ENDPOINT in environment configuration.");
}

if (!accessKeyId || !secretAccessKey) {
  throw new Error("Missing Backblaze B2 credentials (B2_KEY_ID/B2_APPLICATION_KEY).");
}

if (!bucket) {
  throw new Error("Missing Backblaze B2 bucket (B2_BUCKET).");
}

const s3Client = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

export async function uploadObject({ key, body, contentType, metadata }) {
  if (!key) {
    throw new Error("uploadObject requires a key.");
  }
  if (!body) {
    throw new Error("uploadObject requires a body.");
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  });

  await s3Client.send(command);
  return key;
}

export async function getSignedObjectUrl(key, expiresIn = defaultExpirySeconds) {
  if (!key) return null;
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

export function getBucketName() {
  return bucket;
}
