import { ServiceType } from '../../constants/ServiceType.js';

/**
 * @file Defines the IService interface, representing a service endpoint associated with a DID document.
 * @module IService
 */

/**
 * Represents a service endpoint, which provides a means of interacting with the DID subject.
 * Service endpoints define how other entities can communicate with or access resources related to the DID.
 *
 * @interface IService
 */
export interface IService {
  /**
   * Identifier for the service.
   *
   * @type {string}
   * @description This MUST be a URI that uniquely identifies the service within the context of the DID document.
   * @example "did:example:123#linked-domain"
   */
  id: string;

  /**
   * Type of service.
   *
   * @type {ServiceType | string | string[]}
   * @description This MUST be a value from the {@link ServiceType} enum, a string, or an array of strings
   * representing the type of service provided by this endpoint.
   * @example "LinkedDomains"
   */
  type: ServiceType | string | string[];

  /**
   * Service endpoint URL or object.
   *
   * @type {string | object | (string | object)[]}
   * @description This MUST be a URI or an object conforming to service endpoint specifications,
   * defining the location or mechanism for accessing the service. It can be a string, an object,
   * or an array of strings and objects, allowing for multiple endpoints or complex configurations.
   */
  serviceEndpoint: string | object | (string | object)[];
}
