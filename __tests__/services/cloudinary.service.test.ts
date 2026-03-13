import {
  CloudinaryService,
  ImageFolder,
} from '../../src/shared/abstractions/cloudinary.service';
import cloudinary from '../../src/config/cloudinary';

jest.mock('../../src/config/cloudinary', () => ({
  uploader: {
    upload: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe('CloudinaryService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should upload an image and return url and publicId', async () => {
      const mockCloudinaryResponse = {
        secure_url: 'https://cloudinary.com/test-image.jpg',
        public_id: 'profile/test-image',
      };

      (cloudinary.uploader.upload as jest.Mock).mockResolvedValue(
        mockCloudinaryResponse,
      );

      const result = await CloudinaryService.uploadImage(
        'test/path/image.jpg',
        ImageFolder.PROFILE,
      );

      expect(cloudinary.uploader.upload).toHaveBeenCalledWith(
        'test/path/image.jpg',
        {
          folder: ImageFolder.PROFILE,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
      );

      expect(result).toEqual({
        url: mockCloudinaryResponse.secure_url,
        publicId: mockCloudinaryResponse.public_id,
      });
    });

    it('should throw an error if Cloudinary upload fails', async () => {
      (cloudinary.uploader.upload as jest.Mock).mockRejectedValue(
        new Error('Upload failed'),
      );

      await expect(
        CloudinaryService.uploadImage(
          'test/path/image.jpg',
          ImageFolder.PROFILE,
        ),
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('deleteImage', () => {
    it('should delete an image using publicId', async () => {
      const mockDeleteResponse = { result: 'ok' };

      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue(
        mockDeleteResponse,
      );

      const result = await CloudinaryService.deleteImage('profile/test-image');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        'profile/test-image',
        {
          resource_type: 'image',
          invalidate: true,
        },
      );

      expect(result).toEqual(mockDeleteResponse);
    });

    it('should throw an error if Cloudinary destroy fails', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(
        CloudinaryService.deleteImage('profile/test-image'),
      ).rejects.toThrow('Delete failed');
    });
  });
});
