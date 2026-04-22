import { initializeConfig } from '../../config/initializeConfig';
import FormData from 'form-data';
import crypto from 'crypto';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import logger from '../logger/logger';

interface PublitioResponse {
  success: boolean;
  code: number;
  id: string;
  public_id: string | null;
  title: string;
  description: string;
  tags: string;
  type: string;
  extension: string;
  size: number;
  width: number;
  height: number;
  privacy: string;
  option_download: string;
  option_ad: string;
  option_transform: string;
  wm_id: string | null;
  url_preview: string;
  url_thumbnail: string;
  url_download: string;
  versions: number;
  hits: number;
  created_at: string;
  updated_at: string;
}

export type PublitioUploadResult = {
  audioLink: string;
  id: string;
  cloudIndex: number;
  downloadLink: string;
};

class PublitioMediaStorage {
  private readonly PUBLITO_KEYS = [
    process.env.PUBLITO_KEY,
    process.env.PUBLITO_KEY2,
    process.env.PUBLITO_KEY3,
    process.env.PUBLITO_KEY4,
  ];
  private readonly PUBLITO_SECRETS = [
    process.env.PUBLITO_SECRET,
    process.env.PUBLITO_SECRET2,
    process.env.PUBLITO_SECRET3,
    process.env.PUBLITO_SECRET4,
  ];
  private CLOUD_NUM: number = 3;

  private getNextKey(): { apiKey: string; secret: string; index: number } {
    const index = this.CLOUD_NUM;
    this.CLOUD_NUM = (this.CLOUD_NUM + 1) % this.PUBLITO_KEYS.length;

    return {
      apiKey: this.PUBLITO_KEYS[index] as string,
      secret: this.PUBLITO_SECRETS[index] as string,
      index: index,
    };
  }

  private generateAPINonce() {
    const MIN = 10000000;
    const MAX = 99999999;
    const publitioNonce = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
    return publitioNonce.toString();
  }

  private generateUNIXTimestamp() {
    return Math.floor(Date.now() / 1000).toString();
  }

  private generateAPISignature(
    publitioNonce: string,
    unixTimestamp: string,
    PUBLITO_SECRET: string,
  ) {
    const encrypt = unixTimestamp + publitioNonce + PUBLITO_SECRET;
    const signature = crypto.createHash('sha1').update(encrypt).digest('hex');
    return signature;
  }

  private generateReqAuthHeaders() {
    const { index, apiKey, secret } = this.getNextKey();
    const nonce = this.generateAPINonce();
    const timestamp = this.generateUNIXTimestamp();
    const signature = this.generateAPISignature(nonce, timestamp, secret);
    return {
      authParams: {
        api_key: apiKey,
        api_nonce: nonce,
        api_timestamp: timestamp,
        api_signature: signature,
      },
      index,
    };
  }

  private generateReqAuthHeadersWithIndex(index: number) {
    const nonce = this.generateAPINonce();
    const timestamp = this.generateUNIXTimestamp();
    const signature = this.generateAPISignature(
      nonce,
      timestamp,
      this.PUBLITO_SECRETS[index] as string,
    );
    return {
      api_key: this.PUBLITO_KEYS[index],
      api_nonce: nonce,
      api_timestamp: timestamp,
      api_signature: signature,
    };
  }

  async uploadAudioTrack(audioFile: Express.Multer.File) {
    const formData = new FormData();
    const { index, authParams } = this.generateReqAuthHeaders();

    formData.append('file', audioFile.buffer, {
      filename: audioFile.originalname,
    });
    for (const [key, value] of Object.entries(authParams)) {
      formData.append(key, value);
    }

    const res = await axios.post<PublitioResponse>(
      'https://api.publit.io/v1/files/create',
      formData,
      {
        headers: formData.getHeaders(),
      },
    );

    if (!res.data.success) {
      logger.error('[media]: track upload service publitio not available');
      throw new Error(`track upload service publitio not available`);
    }

    const { id, url_preview, url_download } = res.data as {
      id: string;
      url_preview: string;
      url_download: string;
    };

    const audioInfo: PublitioUploadResult = {
      id: id,
      audioLink: url_preview,
      cloudIndex: index,
      downloadLink: url_download,
    };
    logger.info('[track]: Audio Uploaded To Cloud');
    return audioInfo;
  }

  async deleteAudioTrack(audioId: string, index: number) {
    const authParams = this.generateReqAuthHeadersWithIndex(index);
    const res = await axios.delete(
      `https://api.publit.io/v1/files/delete/${audioId}`,
      {
        params: authParams,
      },
    );

    return res.data;
  }

  async testUpload() {
    try {
      // Path to your local file
      const filePath = path.join(__dirname, 'distrack.mp3');

      // Read the file into a buffer
      const fileBuffer = fs.readFileSync(filePath);

      // Simulate a Multer file object
      const fakeMulterFile = {
        originalname: 'distrack.mp3',
        buffer: fileBuffer,
        mimetype: 'audio/mpeg',
        size: fileBuffer.length,
        fieldname: 'file',
        encoding: '7bit',
      } as Express.Multer.File;
      console.log('Upload');
      // Upload to Publitio
      const result =
        await publitioMediaStorage.uploadAudioTrack(fakeMulterFile);
      console.log('Publitio response:', result);
    } catch (err: any) {
      console.error('Error uploading file:', err.message);
    }
  }

  async testDelete(audioId: string, index: number) {
    try {
      // delete from Publitio
      const result = await publitioMediaStorage.deleteAudioTrack(
        audioId,
        index,
      );
      console.log('Publitio response:', result);
    } catch (err: any) {
      console.error('Error deleting file:', err.message);
    }
  }
}

const publitioMediaStorage = new PublitioMediaStorage();
export default publitioMediaStorage;
