// This file creates module aliases for serverless environments like Vercel
// to handle imports that would normally be resolved via tsconfig paths

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Map module aliases for shared code
globalThis.__moduleAliases = {
  '@shared': resolve(__dirname, '../shared'),
  '@server': resolve(__dirname),
};

// Simple implementation to handle "@shared" style imports
const originalImport = globalThis.import;

if (originalImport) {
  globalThis.import = function customImport(specifier, ...rest) {
    // Check if this is an aliased import
    if (specifier.startsWith('@shared/')) {
      const resolvedPath = specifier.replace('@shared/', `${__dirname}/../shared/`);
      return originalImport(resolvedPath, ...rest);
    }
    
    if (specifier.startsWith('@server/')) {
      const resolvedPath = specifier.replace('@server/', `${__dirname}/`);
      return originalImport(resolvedPath, ...rest);
    }
    
    // Pass through to the original import
    return originalImport(specifier, ...rest);
  };
}