import { CredentialOffer } from '../types/offer.js';

/**
 * Create a credential offer URI according to OpenID4VCI spec
 * @param offer Credential offer payload
 * @param options Optional parameters for URI construction
 * @returns Credential offer URI
 */
export function createCredentialOfferURI(
  offer: CredentialOffer,
  options?: { scheme?: string; baseUri?: string; offerUri?: string },
): string {
  // Default scheme is openid-credential-offer
  const scheme = options?.scheme || 'openid-credential-offer';

  // Default baseUri is empty (no path)
  const baseUri = options?.baseUri || '';

  // Construct the base part of the URI
  const baseUriPart = baseUri ? `${baseUri}` : '';

  // If offerUri is provided, create a reference URI
  if (options?.offerUri) {
    // Check if the offerUri already contains credential_offer_uri
    if (options.offerUri.includes('credential_offer_uri=')) {
      return options.offerUri;
    }
    return `${scheme}://${baseUriPart}?credential_offer_uri=${encodeURIComponent(
      options.offerUri,
    )}`;
  }

  // Otherwise create a direct offer URI
  const encodedOffer = encodeURIComponent(JSON.stringify(offer));
  return `${scheme}://${baseUriPart}?credential_offer=${encodedOffer}`;
}
