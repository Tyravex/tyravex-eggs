import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import { loadCatalog, findEgg } from '../../../../src/core/catalog/catalog.mjs';

const load = async (path) => JSON.parse(await readFile(new URL(`../../../../${path}`, import.meta.url), 'utf8'));
const path = 'eggs/bots/discord-casewise/egg.json';

test('CaseWise has a registry entry matching its versioned manifest', async () => {
    const egg = await load(path);
    const registry = await load('registry.json');
    const entry = registry.eggs.find((item) => item.id === 'tyravex.discord.casewise');
    assert.equal(entry.path, path);
    for (const key of ['id', 'name', 'description', 'category', 'version']) assert.equal(entry[key], egg[key]);
    assert.equal(findEgg(await loadCatalog(), egg.id).path, path);
});

test('CaseWise validates against the canonical v1 JSON schema', async () => {
    const schema = await load('schemas/v1/egg.schema.json');
    const validate = new Ajv2020({ strict: true }).compile(schema);
    assert.equal(validate(await load(path)), true, JSON.stringify(validate.errors));
});

test('CaseWise starts its actual entrypoint and declares the application secrets', async () => {
    const egg = await load(path);
    assert.deepEqual(egg.startup, { mode: 'node-file', entrypoint: 'src/index.js' });
    assert.equal(egg.runtime.defaultVersion, '22');
    assert.equal(egg.runtime.image, 'node:22-bookworm-slim');
    assert.deepEqual(egg.install, { mode: 'nodejs', packageManager: 'npm' });
    const profile = egg.profiles.find((item) => item.id === egg.defaultProfile);
    assert.deepEqual(profile.startup, egg.startup);
    assert.equal(profile.runtimeVersion, '22');
    for (const name of ['TOKEN', 'MONGO_URI']) assert.deepEqual(egg.variables.find((item) => item.name === name), { name, type: 'secret', required: true });
    assert.deepEqual(egg.variables.find((item) => item.name === 'DEVELOPERMODE'), { name: 'DEVELOPERMODE', type: 'string', required: false });
    for (const variable of egg.variables) assert.deepEqual(Object.keys(variable).sort(), ['name', 'required', 'type']);
});
