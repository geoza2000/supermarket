import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = join(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

// Parse current version
const [major, minor, patch] = packageJson.version.split('.').map(Number);

// Bump patch version
const newVersion = `${major}.${minor}.${patch + 1}`;
packageJson.version = newVersion;

writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`📦 Bumped website version: ${major}.${minor}.${patch} → ${newVersion}`);
