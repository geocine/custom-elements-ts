// Stub committed so the IDE / type checker has something to resolve.
// The real, populated module is emitted by `tools/generate-sources.js`
// into `.tmp/site/source-viewer/sources.generated.ts` at build/dev time
// and is what the bundler actually picks up.

export interface SourceFile {
  name: string;
  source: string;
}

export const SOURCES: Record<string, SourceFile[]> = {};
