declare module 'rdf-canonize' {
  namespace NQuads {
    function parse(nquads: string): any[];
  }

  function canonize(quads: any[], options: { algorithm: string }): Promise<string>;

  export { canonize, NQuads };
}
