import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import Ajv from 'ajv/dist/2020.js';
import { readSafeJson } from '../security/safe-file.mjs';

export async function validateApplicationProfiles(root) {
  const read = (path) => readSafeJson(root, path);
  const registry = await read('registry.json');
  const catalog = await read('applications.json');
  const ajv = new Ajv({ strict: true });
  const validateCatalog = ajv.compile(await read('schemas/v1/applications.schema.json'));
  const validateEgg = ajv.compile(await read('schemas/v1/egg.schema.json'));
  assert.ok(validateCatalog(catalog), JSON.stringify(validateCatalog.errors));
  const seen = new Set(); const sources = [];
  async function visit(path) {
    for (const entry of await readdir(resolve(root, path), { withFileTypes: true })) {
      const child = `${path}/${entry.name}`;
      assert.ok(!entry.isSymbolicLink(), `Profile symlinks are forbidden: ${child}`);
      if (entry.isDirectory()) { await visit(child); continue; }
      assert.ok(entry.isFile() && entry.name.endsWith('.json'), `Unexpected profile file: ${child}`);
      const source = await read(child);
      assert.ok(Object.keys(source).every((key) => ['application', 'eggId', 'profile'].includes(key)), `Unknown profile field: ${child}`);
      const app = source.application;
      assert.ok(app && !seen.has(app.id), `Missing or duplicate application: ${child}`); seen.add(app.id);
      const url = new URL(app.upstreamUrl);
      assert.ok(url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && !url.port, `Invalid upstream URL: ${child}`);
      if (app.status === 'INSTALLABLE') {
        assert.equal(source.eggId, app.eggKey); assert.equal(source.profile?.id, app.profileId);
        const target = registry.eggs.find((egg) => egg.id === source.eggId);
        assert.ok(target, `Unknown profile Egg: ${source.eggId}`);
        const egg = await read(target.path);
        assert.ok(validateEgg(egg), JSON.stringify(validateEgg.errors));
        assert.ok(source.profile.application, `Application metadata missing: ${child}`);
        assert.deepEqual(egg.profiles.find((profile) => profile.id === source.profile.id), source.profile, `Embedded profile differs: ${child}`);
      } else assert.ok(!source.profile && !source.eggId, `Preview must not contain an executable profile: ${child}`);
      sources.push(app);
    }
  }
  await visit('profiles');
  const byId = (a, b) => a.id.localeCompare(b.id);
  assert.deepEqual(sources.sort(byId), [...catalog.applications].sort(byId), 'Application index differs from authoring profiles');
  return { count: sources.length, installable: sources.filter((app) => app.status === 'INSTALLABLE').length };
}
