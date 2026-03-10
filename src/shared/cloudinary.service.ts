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

  static async uploadAudio(filePath: string) {
    const options = {
      folder: 'audios',
      resourse_type: 'video',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      format: 'mp3',
    };
    const result = await cloudinary.uploader.upload(filePath, options);

    return {
      url: result.secure_url,
      duration: result.audio_duration,
      publicId: result.public_id,
    };
  }
}
