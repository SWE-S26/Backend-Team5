import { initializeConfig } from '../../config/initializeConfig';
import FormData from 'form-data';
import crypto from 'crypto';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

class PublitioMediaStorage {
  private readonly PUBLITO_KEY = process.env.PUBLITO_KEY;
  private readonly PUBLITO_SECRET = process.env.PUBLITO_SECRET;

  private generateAPINonce() {
    const MIN = 10000000;
    const MAX = 99999999;
    const publitioNonce = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
    return publitioNonce.toString();
  }

  private generateUNIXTimestamp() {
    return Math.floor(Date.now() / 1000).toString();
  }

  private generateAPISignature(publitioNonce: string, unixTimestamp: string) {
    const encrypt = unixTimestamp + publitioNonce + this.PUBLITO_SECRET;
    const signature = crypto.createHash('sha1').update(encrypt).digest('hex');
    return signature;
  }

  private generateReqAuthHeaders() {
    const nonce = this.generateAPINonce();
    const timestamp = this.generateUNIXTimestamp();
    const signature = this.generateAPISignature(nonce, timestamp);
    return {
      api_key: this.PUBLITO_KEY,
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

    return res.data;
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
