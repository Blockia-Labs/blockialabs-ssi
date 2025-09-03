import { QRCodeOptions } from 'qrcode';

/**
 * Options for OpenID4VP QR code generation
 */
export interface OpenID4VPOptions extends QRCodeOptions {
  request_uri_method?: 'get' | 'post';
}

/**
 * Result of QR code generation
 */
export interface QRCodeResult {
  qrCode: string; // The QR code as a data URL
  url: string; // The URL encoded in the QR code
}

/**
 * Utility class for generating QR codes
 */
export class QRCodeGenerator {
  /**
   * Generate a QR code as a data URI string
   * @param text Content to encode in the QR code
   * @param options QR code generation options
   * @returns Promise resolving to the QR code as a data URI string
   */
  static async generate(text: string, options?: QRCodeOptions): Promise<string> {
    try {
      // Dynamic import of qrcode
      const QRCode = await import('qrcode');

      // Generate a data URL for the QR code
      return QRCode.toDataURL(text, options);
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error(
        `Failed to generate QR code: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Generate an OpenID4VP QR code and URL
   * @param requestUri The request URI to encode in the QR code
   * @param clientId The client identifier
   * @param options Additional QR code and OpenID4VP specific options
   * @returns Promise resolving to object containing the QR code data URL and the URL
   */
  static async generateOpenID4VP(
    requestUri: string,
    clientId: string,
    options?: OpenID4VPOptions,
  ): Promise<QRCodeResult> {
    // Build the OpenID4VP URL parameters
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('request_uri', requestUri);

    // Add request_uri_method if provided
    if (options?.request_uri_method) {
      params.append('request_uri_method', options.request_uri_method);
    } else {
      params.append('request_uri_method', 'post'); // Default is POST
    }

    // Construct the OpenID4VP deep link URL
    const openId4VPUrl = `openid4vp://?${params.toString()}`;

    // Generate the QR code with the URL
    const qrCode = await this.generate(openId4VPUrl, options);

    return {
      qrCode,
      url: openId4VPUrl,
    };
  }
}
