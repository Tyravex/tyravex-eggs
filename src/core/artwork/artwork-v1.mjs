import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { assertSafeFile } from '../security/safe-file.mjs';

export function parseArtwork(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !Object.keys(value).length || Object.keys(value).some(key => !['banner','icon'].includes(key))) throw new Error('invalid artwork declaration');
  const refs = [];
  for (const image of Object.values(value)) {
    if (!image || typeof image !== 'object' || Array.isArray(image) || Object.keys(image).length !== 2 || Object.keys(image).some(key => !['path','sha256'].includes(key)) ||
      typeof image.path !== 'string' || image.path.length > 300 || !/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_.-]+)*\.(?:png|jpe?g|webp)$/.test(image.path) || image.path.split('/').some(part => part === '.' || part === '..') ||
      typeof image.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(image.sha256)) throw new Error('invalid artwork image reference');
    refs.push({ path: image.path, sha256: image.sha256 });
  }
  return refs;
}

export async function validateArtworkFile(root, ref) {
  parseArtwork({ banner: ref });
  await assertSafeFile(root, ref.path);
  const handle = await open(resolve(root, ref.path), constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const info = await handle.stat();
    if (!info.isFile() || !info.size || info.size > 5*1024*1024) throw new Error('artwork exceeds the 5 MiB limit or is empty');
    const hash = createHash('sha256'); let size = 0;
    for await (const chunk of handle.createReadStream({ autoClose: false })) { size += chunk.length; if (size > 5*1024*1024) throw new Error('artwork exceeds limit'); hash.update(chunk); }
    if (hash.digest('hex') !== ref.sha256) throw new Error('artwork SHA-256 mismatch');
  } finally { await handle.close(); }
}
