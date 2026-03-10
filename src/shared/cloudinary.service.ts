import cloudinary from '../config/cloudinary';

export enum ImageFolder {
  PROFILE = 'profile',
  AUDIO = 'audio',
  PLAYLIST = 'playlist',
}

interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

export class CloudinaryService {
  static async uploadImage(
    filePath: string,
    folder: ImageFolder,
  ): Promise<CloudinaryUploadResult> {
    const options = {
      folder,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    };
    const result = await cloudinary.uploader.upload(filePath, options);
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
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
