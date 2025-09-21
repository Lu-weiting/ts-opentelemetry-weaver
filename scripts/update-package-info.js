#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Read package.json
const packageJsonPath = join(rootDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

// Read span-injector.ts
const spanInjectorPath = join(rootDir, 'src/transformer/span-injector.ts');
let content = readFileSync(spanInjectorPath, 'utf8');

// Update package version and name
content = content.replace(
  /const PACKAGE_VERSION = '[^']*';/,
  `const PACKAGE_VERSION = '${packageJson.version}';`
);

content = content.replace(
  /const PACKAGE_NAME = '[^']*';/,
  `const PACKAGE_NAME = '${packageJson.name}';`
);

// Write back to file
writeFileSync(spanInjectorPath, content, 'utf8');

console.log(`Updated package info: ${packageJson.name}@${packageJson.version}`);
