import { readdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import Ajv from 'ajv/dist/2020.js';
import { readSafeJson } from '../src/core/security/safe-file.mjs';
import { validateRegistryV1 } from '../src/core/registry/registry-v1.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const initial = await validateRegistryV1(root);
assert.ok(initial.valid, initial.errors.join('\n'));
const read = (path) => readSafeJson(root, path);
const sources = [];
async function visit(path) {
  for (const entry of await readdir(resolve(root, path), { withFileTypes: true })) {
    assert.ok(!entry.isSymbolicLink(), 'Profile symlinks are forbidden');
    const child = `${path}/${entry.name}`;
    if (entry.isDirectory()) await visit(child);
    else { assert.ok(entry.isFile() && entry.name.endsWith('.json')); sources.push(await read(child)); }
  }
}
await visit('profiles');
const registry = await read('registry.json');
const ajv = new Ajv({ strict: true });
const catalog = { schemaVersion: 1, applications: sources.map((source) => source.application).sort((a, b) => a.id.localeCompare(b.id)) };
const checkCatalog = ajv.compile(await read('schemas/v1/applications.schema.json'));
assert.ok(checkCatalog(catalog), JSON.stringify(checkCatalog.errors));
assert.equal(new Set(catalog.applications.map((app) => app.id)).size, sources.length, 'Duplicate application ID');
const checkEgg = ajv.compile(await read('schemas/v1/egg.schema.json'));
const outputs = [];
for (const entry of registry.eggs) {
  const manifest = await read(entry.path);
  const additions = sources.filter((source) => source.application.status === 'INSTALLABLE' && source.eggId === entry.id);
  if (!additions.length && !manifest.profiles?.some((profile) => profile.application)) continue;
  const generic = (manifest.profiles ?? []).filter((profile) => !profile.application);
  for (const source of additions) {
    assert.equal(source.application.eggKey, source.eggId);
    assert.equal(source.application.profileId, source.profile?.id);
    assert.ok(!generic.some((profile) => profile.id === source.profile.id), 'Application conflicts with a generic profile');
  }
  manifest.profiles = [...generic, ...additions.map((source) => source.profile)];
  assert.ok(checkEgg(manifest), JSON.stringify(checkEgg.errors));
  outputs.push([entry.path, manifest]);
}
for (const source of sources) {
  assert.ok(source.application.status !== 'INSTALLABLE' || registry.eggs.some((entry) => entry.id === source.eggId), 'Application target Egg is not registered');
  assert.ok(source.application.status !== 'PREVIEW' || (!source.profile && !source.eggId), 'Preview cannot contain executable settings');
}
// All generated data is checked before replacing any tracked output.
for (const [path, value] of [...outputs, ['applications.json', catalog]]) await writeFile(resolve(root, path), JSON.stringify(value, null, 2) + '\n');
console.log(`Generated ${sources.length} application entries and ${outputs.length} Egg profile bundle(s). Bump the affected Egg versions before publishing changes.`);
