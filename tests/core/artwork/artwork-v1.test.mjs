import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import { parseArtwork, validateArtworkFile } from '../../../src/core/artwork/artwork-v1.mjs';
const image = Buffer.from('repository asset bytes'), sha256 = createHash('sha256').update(image).digest('hex');
test('artwork accepts a bounded relative reference and rejects unsafe paths', () => {
  assert.equal(parseArtwork({ banner: { path: 'artwork/banner.webp', sha256 } }).length, 1);
  for (const path of ['../escape.png','/root.png','https://example.org/x.png','artwork/x.svg','artwork/../x.png']) assert.throws(() => parseArtwork({ icon: { path, sha256 } }));
});
test('artwork files must exist and match their declared digest', async () => {
  const root = await mkdtemp(join(tmpdir(),'tyravex-egg-artwork-'));
  try {
    await mkdir(join(root,'artwork')); await writeFile(join(root,'artwork/banner.webp'),image);
    await validateArtworkFile(root,{path:'artwork/banner.webp',sha256});
    await assert.rejects(validateArtworkFile(root,{path:'artwork/banner.webp',sha256:'b'.repeat(64)}));
    await assert.rejects(validateArtworkFile(root,{path:'artwork/missing.webp',sha256}));
  } finally { await rm(root,{recursive:true,force:true}); }
});
test('v1 schema accepts optional Egg and profile artwork without relaxing closed objects', async () => {
  const schema = JSON.parse(await readFile(new URL('../../../schemas/v1/egg.schema.json',import.meta.url),'utf8'));
  const egg = JSON.parse(await readFile(new URL('../../../eggs/bots/discord-nodejs/egg.json',import.meta.url),'utf8'));
  const validate = new Ajv2020({strict:true,allErrors:true}).compile(schema);
  egg.artwork={banner:{path:'artwork/banner.webp',sha256}};
  egg.profiles[0].artwork={icon:{path:'artwork/icon.png',sha256}};
  assert.equal(validate(egg),true,JSON.stringify(validate.errors));
  egg.artwork.banner.sha256='invalid';assert.equal(validate(egg),false);
});
