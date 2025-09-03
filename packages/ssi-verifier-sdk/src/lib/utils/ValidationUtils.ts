/**
 * Utility class for input validation
 */
export class ValidationUtils {
  /**
   * Validate that all required options are present
   * @param options Options object to validate
   * @param required Array of required option names
   * @throws Error if any required option is missing
   */
  static validateOptions(options: Record<string, any>, required: string[]): void {
    const missing = required.filter((key) => options[key] === undefined);

    if (missing.length > 0) {
      throw new Error(`Missing required options: ${missing.join(', ')}`);
    }
  }

  /**
   * Validate a required value
   * @param value The value to validate
   * @param name The name of the value (for error messages)
   * @returns The validated value
   * @throws Error if the value is empty
   */
  static validateRequired(value: any, name: string): any {
    if (value === undefined || value === null || value === '') {
      throw new Error(`${name} is required`);
    }
    return value;
  }

  /**
   * Validate a URL
   * @param url The URL to validate
   * @param name The name of the URL (for error messages)
   * @returns The validated URL
   * @throws Error if the URL is invalid
   */
  static validateUrl(url: string, name: string): string {
    try {
      this.validateRequired(url, name);
      new URL(url);
      return url;
    } catch (error) {
      throw new Error(`Invalid ${name}: ${url}`);
    }
  }
}
