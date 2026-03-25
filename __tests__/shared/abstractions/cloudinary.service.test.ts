import {
  CloudinaryService,
  ImageFolder,
} from '../../../src/shared/abstractions/cloudinary.service';
import cloudinary from '../../../src/config/cloudinary';

jest.mock('../../../src/config/cloudinary', () => ({
  uploader: {
    destroy: jest.fn(),
    upload_stream: jest.fn(),
  },
}));

describe('CloudinaryService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should upload an image buffer and return url and publicId', async () => {
      const mockCloudinaryResponse = {
        secure_url: 'https://cloudinary.com/test-image.jpg',
        public_id: 'profile/test-image',
      };

      // Mock the upload_stream method
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options: any, callback: Function) => {
          // Return an object with .end(buffer) method
          return {
            end: (buffer: Buffer) => {
              callback(null, mockCloudinaryResponse);
            },
          };
        },
      );

      const buffer = Buffer.from('fake image data');

      const result = await CloudinaryService.uploadImage(
        buffer,
        ImageFolder.PROFILE,
      );

      // Check that upload_stream was called with correct options
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        {
          folder: ImageFolder.PROFILE,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        expect.any(Function),
      );

      // Check that the service returns the mapped result
      expect(result).toEqual({
        url: mockCloudinaryResponse.secure_url,
        publicId: mockCloudinaryResponse.public_id,
      });
    });

    it('should throw an error if Cloudinary upload_stream returns an error', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options: any, callback: Function) => ({
          end: (buffer: Buffer) => {
            callback(new Error('Upload failed'), undefined);
          },
        }),
      );

      const buffer = Buffer.from('fake image data');

      await expect(
        CloudinaryService.uploadImage(buffer, ImageFolder.PROFILE),
      ).rejects.toThrow('Upload failed');
    });

    it('should throw an error if Cloudinary upload_stream returns no result', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options: any, callback: Function) => ({
          end: (buffer: Buffer) => {
            callback(null, undefined);
          },
        }),
      );

      const buffer = Buffer.from('fake image data');

      await expect(
        CloudinaryService.uploadImage(buffer, ImageFolder.PROFILE),
      ).rejects.toThrow('Cloudinary upload failed: no result returned');
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
