import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

class R2Storage {
  private client: S3Client | null = null;
  private config: R2Config | null = null;

  initialize(config: R2Config) {
    this.config = config;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  isInitialized(): boolean {
    return this.client !== null && this.config !== null;
  }

  private getClient(): S3Client {
    if (!this.client || !this.config) {
      throw new Error('R2Storage not initialized. Call initialize() first.');
    }
    return this.client;
  }

  private getBucket(): string {
    if (!this.config) {
      throw new Error('R2Storage not initialized. Call initialize() first.');
    }
    return this.config.bucketName;
  }

  async generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600
  ): Promise<PresignedUrlResult> {
    const command = new PutObjectCommand({
      Bucket: this.getBucket(),
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.getClient(), command, { expiresIn });

    return {
      uploadUrl,
      key,
      expiresIn,
    };
  }

  async generatePresignedDownloadUrl(
    key: string,
    expiresIn = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.getBucket(),
      Key: key,
    });

    return getSignedUrl(this.getClient(), command, { expiresIn });
  }

  async generateStreamingUrl(
    key: string,
    expiresIn = 7200
  ): Promise<string> {
    // Generate a signed URL for video streaming with longer expiry
    return this.generatePresignedDownloadUrl(key, expiresIn);
  }

  async uploadFile(
    key: string,
    body: ReadableStream | Blob | ArrayBuffer | Buffer,
    contentType: string
  ): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.getBucket(),
      Key: key,
      Body: body as any,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    });

    await this.getClient().send(command);

    const url = this.config?.publicUrl
      ? `${this.config.publicUrl}/${key}`
      : await this.generatePresignedDownloadUrl(key, 3600);

    const size = body instanceof Blob ? body.size :
      body instanceof ArrayBuffer ? body.byteLength :
      body instanceof Buffer ? body.length : 0;

    return {
      key,
      url,
      size,
      contentType,
    };
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.getBucket(),
      Key: key,
    });

    await this.getClient().send(command);
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.getBucket(),
        Key: key,
      });
      await this.getClient().send(command);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    if (this.config?.publicUrl) {
      return `${this.config.publicUrl}/${key}`;
    }
    return `https://${this.config?.accountId}.r2.cloudflarestorage.com/${this.config?.bucketName}/${key}`;
  }
}

export const r2Storage = new R2Storage();

// Helper functions for drama/episode uploads
export function generateDramaVideoKey(dramaId: string, episodeNumber: number, fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'mp4';
  return `dramas/${dramaId}/episodes/ep-${episodeNumber.toString().padStart(3, '0')}.${ext}`;
}

export function generateDramaPosterKey(dramaId: string, fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  return `dramas/${dramaId}/poster.${ext}`;
}

export function generateDramaBackdropKey(dramaId: string, fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  return `dramas/${dramaId}/backdrop.${ext}`;
}

export function generateEpisodeThumbnailKey(dramaId: string, episodeNumber: number, fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  return `dramas/${dramaId}/episodes/ep-${episodeNumber.toString().padStart(3, '0')}-thumb.${ext}`;
}

export function generateSubtitleKey(dramaId: string, episodeNumber: number, language: string, fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'vtt';
  return `dramas/${dramaId}/episodes/ep-${episodeNumber.toString().padStart(3, '0')}-${language}.${ext}`;
}

// Initialize R2 from environment variables.
// Supports both the R2_* naming and the CLOUDFLARE_R2_* / CLOUDFLARE_ACCOUNT_ID naming.
export function initializeR2FromEnv(): void {
  const accountId =
    process.env.R2_ACCOUNT_ID ||
    process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId =
    process.env.R2_ACCESS_KEY_ID ||
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY ||
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucketName =
    process.env.R2_BUCKET_NAME ||
    process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicUrl =
    process.env.R2_PUBLIC_URL ||
    process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.warn('R2 credentials not fully configured. Video uploads will not work.');
    return;
  }

  r2Storage.initialize({
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl,
  });

  console.log('R2 Storage initialized successfully');
}