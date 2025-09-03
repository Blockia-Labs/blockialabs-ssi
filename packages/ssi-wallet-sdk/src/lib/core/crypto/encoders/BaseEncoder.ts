/**
 * Abstract base class for encoding operations
 */
export abstract class BaseEncoder {
  protected abstract encode(data: Uint8Array): string;
}
