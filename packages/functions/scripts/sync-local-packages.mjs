import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) return copyDir(srcPath, destPath);
      if (entry.isFile()) return fs.copyFile(srcPath, destPath);
    })
  );
}

async function main() {
  const sharedDir = path.resolve(__dirname, '../../shared');
  const destDir = path.resolve(__dirname, '../local-packages/shared');

  const srcDist = path.join(sharedDir, 'dist');
  const srcPkg = path.join(sharedDir, 'package.json');

  try {
    await fs.access(srcDist);
  } catch {
    throw new Error('Missing shared/dist. Run "npm run build:shared" first.');
  }

  await fs.rm(destDir, { recursive: true, force: true });
  await fs.mkdir(destDir, { recursive: true });
  await fs.copyFile(srcPkg, path.join(destDir, 'package.json'));
  await copyDir(srcDist, path.join(destDir, 'dist'));

  console.log('✔ Synced shared package');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
