import logger from '../logger/logger';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { Types } from 'mongoose';
import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

ffmpeg.setFfmpegPath(ffmpegPath);

class BlobStorageService {
  private readonly blobService: BlobServiceClient;
  private readonly waveformContainer: ContainerClient;

  constructor() {
    this.blobService = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING as string,
    );
    this.waveformContainer = this.blobService.getContainerClient(
      process.env.AZURE_STORAGE_CONTAINER_NAME as string,
    );
  }

  private async generateWaveForm(
    audioFile: Express.Multer.File,
    numSamples: number = 300,
  ): Promise<number[]> {
    const tempPath = join(tmpdir(), `${Date.now()}_${audioFile.originalname}`);
    writeFileSync(tempPath, audioFile.buffer);

    return new Promise((resolve, reject) => {
      const waveform: number[] = [];
      const stream = new PassThrough();

      ffmpeg(tempPath)
        .audioChannels(1)
        .audioFrequency(8000)
        .format('s16le')
        .on('start', (cmd) => console.log('ffmpeg cmd:', cmd))
        .on('error', (err) => {
          unlinkSync(tempPath);
          reject(err);
        })
        .on('end', () => {
          unlinkSync(tempPath);
          const sectionLen = Math.floor(waveform.length / numSamples);
          const samples: number[] = [];

          for (let i = 0; i < numSamples; i++) {
            let sum = 0;
            const start = i * sectionLen;
            for (let j = start; j < start + sectionLen; j++) {
              sum += waveform[j] * waveform[j];
            }
            const rms = Math.sqrt(sum / sectionLen);
            samples.push(parseFloat(((rms / 32768) * 10000).toFixed(6)));
          }

          resolve(samples);
        })
        .pipe(stream);

      stream.on('data', (chunk: Buffer) => {
        for (let i = 0; i < chunk.length; i += 2) {
          waveform.push(chunk.readInt16LE(i));
        }
      });

      stream.on('error', (err) => {
        unlinkSync(tempPath);
        reject(err);
      });
    });
  }

  async uploadWaveToBlob(
    audioFile: Express.Multer.File,
    trackId: Types.ObjectId,
  ) {
    console.log('ffmpeg path:', ffmpegPath);
    const waveformData = await this.generateWaveForm(audioFile);
    const filename = `${trackId.toString()}.json`;
    const content = JSON.stringify(waveformData);

    const blockBlob = this.waveformContainer.getBlockBlobClient(filename);
    await blockBlob.upload(content, Buffer.byteLength(content), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });
    logger.info('[blob]: uploaded waveform json file to blob');
    return blockBlob.url;
  }

  async deleteWaveFromBlob(trackId: Types.ObjectId) {
    const filename = `${trackId.toString()}.json`;
    const blockBlobClient = this.waveformContainer.getBlockBlobClient(filename);
    await blockBlobClient.delete();
    logger.info('[blob]: deleted waveform json from blob');
  }
}

const blobStorageService = new BlobStorageService();
export default blobStorageService;
