import cloudinary, {
  UploadApiResponse,
  UploadApiErrorResponse,
} from '../../config/cloudinary';

export enum ImageFolder {
  PROFILE = 'profile',
  AUDIO = 'audio',
  PLAYLIST = 'playlist',
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

export class CloudinaryService {
  static async uploadImage(
    buffer: Buffer,
    folder: ImageFolder,
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            use_filename: true,
            unique_filename: true,
            overwrite: false,
          },
          (
            error: UploadApiErrorResponse | undefined,
            result: UploadApiResponse | undefined,
          ) => {
            if (error) return reject(error);
            if (!result) {
              return reject(
                new Error('Cloudinary upload failed: no result returned'),
              );
            }
            return resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          },
        )
        .end(buffer);
    });
  }

  static async deleteImage(publicId: string): Promise<{ result: string }> {
    const options = {
      resource_type: 'image',
      invalidate: true,
    };
    const result = await cloudinary.uploader.destroy(publicId, options);
    return result;
  }
}
