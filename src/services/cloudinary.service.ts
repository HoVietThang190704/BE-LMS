import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

import { config } from '../config';
import { logger } from '../shared/utils/logger';

const isCloudinaryConfigured = Boolean(
  config.CLOUDINARY_CLOUD_NAME &&
  config.CLOUDINARY_API_KEY &&
  config.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
    secure: true
  });
} else {
  logger.warn('Cloudinary credentials are missing. Falling back to local disk storage for uploads.');
}

const LOCAL_PREFIX = 'local';
const LOCAL_UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads', LOCAL_PREFIX);

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export class CloudinaryService {
  private static async ensureLocalDir(folder: string) {
    const dirPath = path.resolve(LOCAL_UPLOAD_ROOT, folder);
    await fs.mkdir(dirPath, { recursive: true });
    return dirPath;
  }

  private static resolveExtension(mimeType?: string, originalName?: string) {
    if (mimeType && mimeType.includes('/')) {
      const [, ext] = mimeType.split('/');
      if (ext) {
        return ext === 'jpeg' ? 'jpg' : ext;
      }
    }

    if (originalName) {
      const parsed = path.extname(originalName).replace('.', '');
      if (parsed) {
        return parsed;
      }
    }

    return 'jpg';
  }

  private static async saveToLocal(
    buffer: Buffer,
    folder: string,
    metadata: { mimeType?: string; originalName?: string }
  ): Promise<UploadResult> {
    const safeFolder = folder.replace(/^\/+/, '').replace(/\.\./g, '') || 'posts';
    const targetDir = await this.ensureLocalDir(safeFolder);
    const extension = this.resolveExtension(metadata.mimeType, metadata.originalName);
    const fileName = `${randomUUID()}.${extension}`;
    const filePath = path.join(targetDir, fileName);

    await fs.writeFile(filePath, buffer);

    const relativePublicId = path.posix.join(LOCAL_PREFIX, safeFolder.replace(/\\/g, '/'), fileName);
    const relativeUrl = path.posix.join('/uploads', relativePublicId);

    return {
      url: relativeUrl,
      publicId: relativePublicId,
      width: 0,
      height: 0,
      format: extension,
      bytes: buffer.length
    };
  }

  private static async deleteLocalAsset(publicId: string) {
    const normalized = publicId.replace(/^\/+/, '');
    const relativePath = normalized.startsWith(`${LOCAL_PREFIX}/`) ? normalized : `${LOCAL_PREFIX}/${normalized}`;
    const diskPath = path.resolve(process.cwd(), 'uploads', relativePath);
    try {
      await fs.unlink(diskPath);
      logger.info(`Deleted local image: ${relativePath}`);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        logger.error('Error deleting local image:', error);
        throw new Error('Failed to delete local image');
      }
    }
  }

  /**
   * Upload a single image to Cloudinary
   */
  static async uploadImage(
    buffer: Buffer,
    folder: string = 'posts',
    publicId?: string,
    metadata: { mimeType?: string; originalName?: string } = {}
  ): Promise<UploadResult> {
    if (!isCloudinaryConfigured) {
      return this.saveToLocal(buffer, folder, metadata);
    }

    try {
      return await new Promise((resolve, reject) => {
        const uploadOptions: Record<string, unknown> = {
          folder: `fresh-food/${folder}`,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' }, // Max size
            { quality: 'auto:good' }, // Auto quality
            { fetch_format: 'auto' } // Auto format (WebP when supported)
          ]
        };

        if (publicId) {
          // allow passing custom public id for stable naming
          (uploadOptions as any).public_id = publicId;
        }

        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              logger.error('Cloudinary upload error:', error);
              reject(error);
            } else if (result) {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes
              });
            } else {
              reject(new Error('Upload failed - no result'));
            }
          }
        );

        uploadStream.end(buffer);
      });
    } catch (error) {
      logger.error('Error uploading to Cloudinary:', error);

      try {
        logger.warn('Falling back to local storage for image upload.');
        return await this.saveToLocal(buffer, folder, metadata);
      } catch (localError) {
        logger.error('Local storage fallback failed:', localError);
      }

      throw new Error('Failed to upload image');
    }
  }

  /**
   * Upload multiple images to Cloudinary
   */
  static async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'posts'
  ): Promise<UploadResult[]> {
    try {
      const uploadPromises = files.map(file => {
        // create lightweight unique public id; avoid using original filename directly
        const randomId = `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        return this.uploadImage(file.buffer, folder, randomId, {
          mimeType: file.mimetype,
          originalName: file.originalname
        });
      });
      return await Promise.all(uploadPromises);
    } catch (error) {
      logger.error('Error uploading multiple images:', error);
      throw new Error('Failed to upload images');
    }
  }

  /**
   * Delete an image from Cloudinary
   */
  static async deleteImage(publicId: string): Promise<void> {
    const isLocalAsset = publicId.startsWith(`${LOCAL_PREFIX}/`);

    if (!isCloudinaryConfigured || isLocalAsset) {
      await this.deleteLocalAsset(publicId);
      return;
    }

    try {
      await cloudinary.uploader.destroy(publicId);
      logger.info(`Deleted image: ${publicId}`);
    } catch (error) {
      logger.error('Error deleting from Cloudinary:', error);
      throw new Error('Failed to delete image');
    }
  }

  /**
   * Delete multiple images from Cloudinary
   */
  static async deleteMultipleImages(publicIds: string[]): Promise<void> {
    try {
      const deletePromises = publicIds.map(id => this.deleteImage(id));
      await Promise.all(deletePromises);
    } catch (error) {
      logger.error('Error deleting multiple images:', error);
      throw new Error('Failed to delete images');
    }
  }

  /**
   * Get optimized image URL with transformations
   */
  static getOptimizedUrl(
    publicId: string,
    width?: number,
    height?: number
  ): string {
    if (!isCloudinaryConfigured || publicId.startsWith(`${LOCAL_PREFIX}/`)) {
      const relative = publicId.replace(/^\/+/, '');
      const normalized = relative.startsWith(`${LOCAL_PREFIX}/`) ? relative : `${LOCAL_PREFIX}/${relative}`;
      return path.posix.join('/uploads', normalized);
    }

    return cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto:good',
      fetch_format: 'auto'
    });
  }
}
