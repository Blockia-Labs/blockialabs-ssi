import axios from 'axios';
import jsonld from 'jsonld';
import rdfCanonize from 'rdf-canonize';
import { checkHash } from './hash-validator.js';

/**
 * URL to hash mapping type
 */
export interface UrlHashes {
  [key: string]: string;
}

/**
 * Create document loader with hash verification
 *
 * @param urlHashes - Map of URLs to their expected hashes
 * @returns A document loader function for jsonld
 */
export function createDocumentLoader(urlHashes: UrlHashes = {}): (url: string) => Promise<any> {
  return async (url: string) => {
    try {
      // Attempt to fetch the context with timeout
      const response = await axios.get(url, {
        timeout: 10000,
        headers: { Accept: 'application/ld+json, application/json' },
      });

      if (response.status !== 200) {
        throw new Error(`Failed to load context: ${url} (${response.status})`);
      }

      // Get the context data as string for consistent hash checking
      const contextData =
        typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

      // Verify hash if one exists for this URL
      if (urlHashes[url]) {
        if (!checkHash(urlHashes[url], 'sha256', contextData)) {
          throw new Error(`Context integrity check failed for: ${url}`);
        }
      }

      // Return the document in the format expected by jsonld library
      return {
        contextUrl: null,
        document: typeof response.data === 'string' ? JSON.parse(response.data) : response.data,
        documentUrl: url,
      };
    } catch (error) {
      console.error(`Error loading context from ${url}:`, error);
      throw error;
    }
  };
}

/**
 * Canonicalize a document
 *
 * @param document - Document to canonicalize
 * @param urlHashes - Hash verification for document contexts
 * @returns Canonicalized document as string
 */
export async function jsonLdCanonicalize(
  document: Record<string, any>,
  urlHashes: UrlHashes = {},
): Promise<string> {
  // Create document loader with hash verification
  const documentLoader = createDocumentLoader(urlHashes);

  try {
    // Convert to N-Quads representation
    const nquads = await jsonld.toRDF(document, {
      format: 'application/n-quads',
      documentLoader,
    });

    if (!nquads) {
      throw new Error('Failed to convert document to N-Quads');
    }

    // Parse N-Quads string into quads
    const parsedQuads = rdfCanonize.NQuads.parse(nquads as string);

    // Canonize using RDFC-1.0 algorithm
    return await rdfCanonize.canonize(parsedQuads, { algorithm: 'RDFC-1.0' });
  } catch (error) {
    if (error && typeof error === 'object' && 'details' in error) {
      const err = error as { details: { cause: any } };
      if (err.details?.cause) {
        throw err.details.cause;
      }
    }
    throw error;
  }
}
