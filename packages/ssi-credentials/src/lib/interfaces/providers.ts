export interface ISchemaVerifier {
  /**
   * Validates a credential against a schema
   * @param credential The credential to validate
   * @param schemaId The ID of the schema to validate against
   * @returns Promise resolving to the validated credential
   * @throws ValidationError if the credential is invalid
   */
  validate<T extends object>(content: T, schemaId: string): Promise<T>;
}
