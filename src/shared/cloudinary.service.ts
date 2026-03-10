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
    return result.secure_url;
  }
}
