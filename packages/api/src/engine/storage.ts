import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../lib/env';

const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO
});

const BUCKET = env.S3_BUCKET;

/**
 * Upload the HTML bundle and source snapshot to S3/MinIO.
 * Returns the public URL of the HTML bundle.
 */
export async function uploadBundle(
  appId: string,
  version: number,
  html: string,
  source: Record<string, string>,
): Promise<string> {
  const basePath = `apps/${appId}/v${version}`;

  // Upload HTML bundle
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `${basePath}/index.html`,
      Body: html,
      ContentType: 'text/html; charset=utf-8',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  // Upload source snapshot for iteration context
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `${basePath}/source.json`,
      Body: JSON.stringify(source),
      ContentType: 'application/json',
    }),
  );

  return getBundleUrl(appId, version);
}

/**
 * Get the public URL for a bundle.
 * Uses S3_PUBLIC_URL if set (e.g., CDN or reverse proxy), otherwise builds from endpoint.
 */
export function getBundleUrl(appId: string, version: number): string {
  const path = `apps/${appId}/v${version}/index.html`;

  if (env.S3_PUBLIC_URL) {
    return `${env.S3_PUBLIC_URL.replace(/\/$/, '')}/${path}`;
  }

  // Default: direct MinIO/S3 URL
  return `${env.S3_ENDPOINT.replace(/\/$/, '')}/${BUCKET}/${path}`;
}

/**
 * Retrieve the source snapshot for an app version (used for iteration).
 */
export async function getSourceSnapshot(
  appId: string,
  version: number,
): Promise<Record<string, string> | null> {
  try {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: `apps/${appId}/v${version}/source.json`,
      }),
    );

    const body = await result.Body?.transformToString('utf-8');
    if (!body) return null;

    return JSON.parse(body);
  } catch (err: any) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw err;
  }
}
