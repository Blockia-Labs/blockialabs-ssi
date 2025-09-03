import type { QRCodeToDataURLOptions } from 'qrcode';
import { QRCodeOptions } from '../types/issuer.js';

/**
 * Generate a QR code as a data URI string
 * @param text Content to encode in the QR code
 * @param options QR code generation options
 * @returns Promise resolving to the QR code as a data URI string
 */
export async function generateQRCode(text: string, options?: QRCodeOptions): Promise<string> {
  try {
    // Dynamic import of qrcode
    const QRCode = await import('qrcode');

    // Convert generic options to qrcode-specific options
    const qrOptions: QRCodeToDataURLOptions = {
      width: options?.size || 300,
      margin: options?.margin || 4,
      color: {
        dark: options?.colorDark || '#000000',
        light: options?.colorLight || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    };

    // Generate a data URL for the QR code
    return QRCode.toDataURL(text, qrOptions);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error(
      `Failed to generate QR code: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
