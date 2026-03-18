import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import { env } from './env';

export const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true, // required for MinIO
});

const BUCKET = env.S3_BUCKET;

/**
 * Ensure the app-builds bucket exists. Call once on startup.
 */
export async function ensureBucket(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    console.log(`[S3] Bucket "${BUCKET}" not found, creating...`);
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
    console.log(`[S3] Bucket "${BUCKET}" created.`);
  }
}

/**
 * Upload a file to S3/MinIO.
 */
export async function uploadFile(
  key: string,
  body: string | Buffer,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: 'public-read',
    })
  );

  // Return the public URL
  const publicBase = env.S3_PUBLIC_URL || env.S3_ENDPOINT;
  return `${publicBase}/${BUCKET}/${key}`;
}

/**
 * Get a file from S3/MinIO.
 */
export async function getFile(key: string): Promise<string | null> {
  try {
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
    return response.Body?.transformToString() ?? null;
  } catch {
    return null;
  }
}

/**
 * Build the public URL for a stored file.
 */
export function getPublicUrl(key: string): string {
  const publicBase = env.S3_PUBLIC_URL || env.S3_ENDPOINT;
  return `${publicBase}/${BUCKET}/${key}`;
}

/**
 * Generate the storage key for an app bundle.
 */
export function appBundleKey(appId: string, version: number): string {
  return `apps/${appId}/v${version}/index.html`;
}

/**
 * Generate the storage key for an app source snapshot.
 */
export function appSourceKey(appId: string, version: number): string {
  return `apps/${appId}/v${version}/source.json`;
}
