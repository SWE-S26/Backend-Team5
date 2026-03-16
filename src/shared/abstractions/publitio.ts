import { initializeConfig } from '../../config/initializeConfig';
import crypto from 'crypto';

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
    const encrypt = publitioNonce + unixTimestamp + this.PUBLITO_SECRET;
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
}
