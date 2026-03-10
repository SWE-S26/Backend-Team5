import { overwrite } from 'zod';
import cloudinary from '../config/cloudinary';

export class CloudinaryService {
  static async uploadImage(filePath: string) {
    const options = {
      folder: 'images',
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

  static async deleteFile(
    publicId: string,
    resource_type: 'image' | 'video' = 'image',
  ) {
    const options = {
      resource_type: resource_type,
      invalidate: true,
    };
    await cloudinary.uploader.destroy(publicId, options);
  }
}
