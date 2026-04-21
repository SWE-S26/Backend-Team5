import { initializeConfig } from '../../config/initializeConfig';
import FormData from 'form-data';
import crypto from 'crypto';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export type PublitioUploadResult = {
  audioLink: string;
  id: string;
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
  private CLOUD_NUM: number = 0;

  private getNextKey(): { apiKey: string; secret: string } {
    const index = this.CLOUD_NUM;
    this.CLOUD_NUM = (this.CLOUD_NUM + 1) % this.PUBLITO_KEYS.length;

    return {
      apiKey: this.PUBLITO_KEYS[index] as string,
      secret: this.PUBLITO_SECRETS[index] as string,
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
    const { apiKey, secret } = this.getNextKey();
    const nonce = this.generateAPINonce();
    const timestamp = this.generateUNIXTimestamp();
    const signature = this.generateAPISignature(nonce, timestamp, secret);
    return {
      api_key: apiKey,
      api_nonce: nonce,
      api_timestamp: timestamp,
      api_signature: signature,
    };
  }

  async uploadAudioTrack(audioFile: Express.Multer.File) {
    const formData = new FormData();
    const authParams = this.generateReqAuthHeaders();

    formData.append('file', audioFile.buffer, {
      filename: audioFile.originalname,
    });
    for (const [key, value] of Object.entries(authParams)) {
      formData.append(key, value);
    }

    const res = await axios.post(
      'https://api.publit.io/v1/files/create',
      formData,
      {
        headers: formData.getHeaders(),
      },
    );

    const { id, url_preview } = res.data as { id: string; url_preview: string };

    const audioInfo: PublitioUploadResult = {
      id: id,
      audioLink: url_preview,
    };

    return audioInfo;
  }

  async deleteAudioTrack(audioId: string) {
    const authParams = this.generateReqAuthHeaders();
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

  async testDelete(audioId: string) {
    try {
      // delete from Publitio
      const result = await publitioMediaStorage.deleteAudioTrack(audioId);
      console.log('Publitio response:', result);
    } catch (err: any) {
      console.error('Error deleting file:', err.message);
    }
  }
}

const publitioMediaStorage = new PublitioMediaStorage();
export default publitioMediaStorage;
