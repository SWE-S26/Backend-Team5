// jest.setup.ts
// Runs before each test suite — registers a mock for blob.service
// so the Azure BlobServiceClient constructor never executes.

jest.mock('./src/shared/abstractions/blob.service', () => ({
  __esModule: true,
  default: {
    uploadWaveform: jest.fn().mockResolvedValue('https://fake/waveform.json'),
    uploadTrack: jest.fn().mockResolvedValue('https://fake/track.mp3'),
    uploadImage: jest.fn().mockResolvedValue('https://fake/image.jpg'),
    deleteBlob: jest.fn().mockResolvedValue(undefined),
    deleteWaveFromBlob: jest.fn().mockResolvedValue(undefined),
    uploadWaveToBlob: jest.fn().mockResolvedValue(undefined),
  },
}));
