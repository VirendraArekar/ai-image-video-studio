import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly localUploadDir: string;
  private s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly useS3: boolean;

  constructor() {
    this.localUploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.localUploadDir)) {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
    }

    this.bucketName = process.env.S3_BUCKET || '';
    const s3Endpoint = process.env.S3_ENDPOINT;
    const s3Region = process.env.S3_REGION || 'us-east-1';
    const accessKeyId = process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.S3_SECRET_KEY;

    if (this.bucketName && accessKeyId && secretAccessKey) {
      this.useS3 = true;
      this.s3Client = new S3Client({
        region: s3Region,
        endpoint: s3Endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: !!s3Endpoint, // Required for MinIO
      });
      this.logger.log(`StorageService initialized with S3/MinIO bucket: ${this.bucketName}`);
    } else {
      this.useS3 = false;
      this.logger.log(`StorageService initialized with local filesystem: ${this.localUploadDir}`);
    }
  }

  async saveBase64File(
    base64Data: string,
    mimeType: string,
    category: 'images' | 'videos' | 'thumbnails' = 'images',
  ): Promise<{ storagePath: string; publicUrl: string; fileSize: number }> {
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = this.getExtensionFromMime(mimeType);
    const filename = `${category}/${uuidv4()}.${ext}`;

    if (this.useS3 && this.s3Client) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: filename,
          Body: buffer,
          ContentType: mimeType,
          ACL: 'public-read',
        }),
      );
      const publicUrl = process.env.S3_PUBLIC_URL
        ? `${process.env.S3_PUBLIC_URL}/${filename}`
        : `https://${this.bucketName}.s3.amazonaws.com/${filename}`;
      return {
        storagePath: filename,
        publicUrl,
        fileSize: buffer.length,
      };
    } else {
      // Local storage
      const fullDir = path.join(this.localUploadDir, category);
      if (!fs.existsSync(fullDir)) {
        fs.mkdirSync(fullDir, { recursive: true });
      }
      const filePath = path.join(this.localUploadDir, filename);
      fs.writeFileSync(filePath, buffer);

      const baseUrl = process.env.BACKEND_PUBLIC_URL || '';
      const publicUrl = baseUrl ? `${baseUrl}/uploads/${filename}` : `/uploads/${filename}`;
      return {
        storagePath: filePath,
        publicUrl,
        fileSize: buffer.length,
      };
    }
  }

  async saveBuffer(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string,
    category: 'uploads' | 'references' = 'uploads',
  ): Promise<{ storagePath: string; publicUrl: string; fileSize: number }> {
    const ext = path.extname(originalFilename).replace('.', '') || this.getExtensionFromMime(mimeType);
    const filename = `${category}/${uuidv4()}.${ext}`;

    if (this.useS3 && this.s3Client) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: filename,
          Body: buffer,
          ContentType: mimeType,
          ACL: 'public-read',
        }),
      );
      const publicUrl = process.env.S3_PUBLIC_URL
        ? `${process.env.S3_PUBLIC_URL}/${filename}`
        : `https://${this.bucketName}.s3.amazonaws.com/${filename}`;
      return {
        storagePath: filename,
        publicUrl,
        fileSize: buffer.length,
      };
    } else {
      const fullDir = path.join(this.localUploadDir, category);
      if (!fs.existsSync(fullDir)) {
        fs.mkdirSync(fullDir, { recursive: true });
      }
      const filePath = path.join(this.localUploadDir, filename);
      fs.writeFileSync(filePath, buffer);

      const baseUrl = process.env.BACKEND_PUBLIC_URL || '';
      const publicUrl = baseUrl ? `${baseUrl}/uploads/${filename}` : `/uploads/${filename}`;
      return {
        storagePath: filePath,
        publicUrl,
        fileSize: buffer.length,
      };
    }
  }

  private getExtensionFromMime(mime: string): string {
    switch (mime) {
      case 'image/png':
        return 'png';
      case 'image/jpeg':
      case 'image/jpg':
        return 'jpg';
      case 'image/webp':
        return 'webp';
      case 'image/svg+xml':
        return 'svg';
      case 'video/mp4':
        return 'mp4';
      case 'video/webm':
        return 'webm';
      case 'video/quicktime':
        return 'mov';
      default:
        return 'bin';
    }
  }
}
