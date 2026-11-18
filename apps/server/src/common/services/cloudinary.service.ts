import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface ImageUpload {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly configured: boolean;

  constructor(config: ConfigService) {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET');
    this.configured = Boolean(cloudName && apiKey && apiSecret);

    if (this.configured) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
    } else {
      this.logger.warn('Cloudinary is not configured; image uploads will be unavailable.');
    }
  }

  async uploadImage(file: ImageUpload, folder: string): Promise<string> {
    if (!this.configured) throw new Error('Cloudinary is not configured');
    if (!file.mimetype.startsWith('image/')) throw new Error('Only image files can be uploaded');
    if (file.buffer.byteLength === 0) throw new Error('Cannot upload an empty image');

    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    try {
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: `jaynstan/${folder}`,
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        transformation: [
          { width: 1600, height: 1600, crop: 'limit' },
          { quality: 'auto:good', fetch_format: 'auto' },
        ],
      });
      return result.secure_url;
    } catch (error) {
      this.logger.error(`Cloudinary upload failed: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  async uploadProfileImage(file: ImageUpload): Promise<string> {
    return this.uploadImage(file, 'profiles');
  }

  async deleteImage(imageUrl: string): Promise<void> {
    if (!this.configured) return;
    const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
    if (!match) return;
    const publicId = decodeURIComponent(match[1]);
    if (!publicId.startsWith('jaynstan/')) throw new Error('Can only delete images in the JaynStan folder');
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
    if (result.result !== 'ok' && result.result !== 'not found') {
      this.logger.warn(`Cloudinary delete returned ${result.result}.`);
    }
  }
}
