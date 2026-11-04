import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const readJson = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const fail = (where, message) => errors.push(`${where}: ${message}`);
const object = (obj, required, optional, where) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) { fail(where, 'expected object'); return false; }
  for (const key of Object.keys(obj)) if (![...required, ...optional].includes(key)) fail(where, `unexpected property ${key}`);
  for (const key of required) if (!(key in obj)) fail(where, `missing property ${key}`);
  return true;
};
const allowed = (obj, keys, where) => object(obj, keys, [], where);
const str = (v, min = 1, max = 500) => typeof v === 'string' && v.length >= min && v.length <= max;
const idOk = (v) => str(v) && /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(v);
const versionOk = (v) => str(v) && /^\d+\.\d+\.\d+$/.test(v);
const runtimeVersionOk = (v) => typeof v === 'string' && /^[0-9]+$/.test(v);
const profileIdOk = (v) => typeof v === 'string' && /^[a-z][a-z0-9-]*$/.test(v);
const categories = new Set(['bots', 'games', 'applications']);
const entrypointOk = (v) => typeof v === 'string' && v.length <= 160 && /^[a-zA-Z0-9_./-]+\.[cm]?js$/.test(v) && !v.startsWith('/') && !v.split('/').some(x => x === '.' || x === '..' || x === '');
const validateStartup = (startup, where) => {
  if (!object(startup, ['mode'], ['entrypoint'], where)) return;
  if (startup.mode === 'npm-start') {
    if ('entrypoint' in startup) fail(where, 'npm-start must not define entrypoint');
  } else if (startup.mode === 'node-file') {
    if (!entrypointOk(startup.entrypoint)) fail(where, 'invalid entrypoint');
  } else fail(where, 'unsupported startup mode');
};
const validateEgg = (egg, where) => {
  if (!object(egg, ['schemaVersion', 'id', 'name', 'description', 'version', 'category', 'runtime', 'install', 'startup', 'variables'], ['profiles', 'defaultProfile'], where)) return;
  if (egg.schemaVersion !== 1) fail(where, 'schemaVersion must be 1');
  if (!idOk(egg.id)) fail(where, 'invalid id');
  if (!str(egg.name, 3, 100)) fail(where, 'invalid name');
  if (!str(egg.description, 0, 500)) fail(where, 'invalid description');
  if (!versionOk(egg.version)) fail(where, 'invalid version');
  if (!categories.has(egg.category)) fail(where, 'invalid category');
  const runtimeVersions = new Set();
  if (object(egg.runtime, ['type', 'image', 'workingDirectory'], ['versions', 'defaultVersion'], `${where}.runtime`)) {
    if (egg.runtime.type !== 'docker' || !str(egg.runtime.image, 1, 255) || egg.runtime.workingDirectory !== '/app') fail(where, 'invalid runtime');
    if ('versions' in egg.runtime || 'defaultVersion' in egg.runtime) {
      if (!Array.isArray(egg.runtime.versions) || egg.runtime.versions.length < 1 || egg.runtime.versions.length > 12) fail(where, 'invalid runtime versions');
      else for (const [i, v] of egg.runtime.versions.entries()) {
        const vw = `${where}.runtime.versions[${i}]`;
        if (!allowed(v, ['version', 'image'], vw)) continue;
        if (!runtimeVersionOk(v.version) || !str(v.image, 1, 255)) fail(vw, 'invalid runtime version');
        if (runtimeVersions.has(v.version)) fail(vw, 'duplicate runtime version');
        runtimeVersions.add(v.version);
      }
      if (!runtimeVersions.has(egg.runtime.defaultVersion)) fail(where, 'default runtime version not listed');
      const defaultImage = egg.runtime.versions?.find(v => v.version === egg.runtime.defaultVersion)?.image;
      if (defaultImage !== egg.runtime.image) fail(where, 'default runtime image mismatch');
    }
  }
  if (allowed(egg.install, ['mode', 'packageManager'], `${where}.install`)) {
    if (egg.install.mode !== 'nodejs' || egg.install.packageManager !== 'npm') fail(where, 'unsupported install mode');
  }
  validateStartup(egg.startup, `${where}.startup`);
  if ('profiles' in egg || 'defaultProfile' in egg) {
    if (!Array.isArray(egg.profiles) || egg.profiles.length < 1 || egg.profiles.length > 16) fail(where, 'invalid profiles');
    else {
      const ids = new Set();
      for (const [i, profile] of egg.profiles.entries()) {
        const pw = `${where}.profiles[${i}]`;
        if (!object(profile, ['id', 'name', 'startup'], ['runtimeVersion'], pw)) continue;
        if (!profileIdOk(profile.id) || !str(profile.name, 3, 100)) fail(pw, 'invalid profile metadata');
        if (ids.has(profile.id)) fail(pw, 'duplicate profile id');
        ids.add(profile.id);
        validateStartup(profile.startup, `${pw}.startup`);
        if ('runtimeVersion' in profile && !runtimeVersions.has(profile.runtimeVersion)) fail(pw, 'profile runtime version not listed');
      }
      if (!ids.has(egg.defaultProfile)) fail(where, 'default profile not listed');
    }
  }
  if (!Array.isArray(egg.variables) || egg.variables.length > 32) fail(where, 'invalid variables');
  else {
    const names = new Set();
    for (const [i, variable] of egg.variables.entries()) {
      const vwhere = `${where}.variables[${i}]`;
      if (!allowed(variable, ['name', 'type', 'required'], vwhere)) continue;
      if (!str(variable.name) || !/^[A-Z][A-Z0-9_]*$/.test(variable.name)) fail(vwhere, 'invalid name');
      if (!['string', 'secret'].includes(variable.type)) fail(vwhere, 'invalid type');
      if (typeof variable.required !== 'boolean') fail(vwhere, 'required must be boolean');
      if (names.has(variable.name)) fail(vwhere, 'duplicate variable name');
      names.add(variable.name);
    }
  }
};
const registry = await readJson('registry.json');
if (allowed(registry, ['schemaVersion', 'eggs'], 'registry')) {
  if (registry.schemaVersion !== 1) fail('registry', 'schemaVersion must be 1');
  if (!Array.isArray(registry.eggs)) fail('registry', 'eggs must be an array');
  else {
    const ids = new Set(); const paths = new Set();
    for (const [i, entry] of registry.eggs.entries()) {
      const where = `registry.eggs[${i}]`;
      if (!allowed(entry, ['id', 'name', 'description', 'category', 'version', 'path'], where)) continue;
      if (!idOk(entry.id) || !str(entry.name, 3, 100) || !str(entry.description, 0, 500) || !versionOk(entry.version) || !categories.has(entry.category)) fail(where, 'invalid metadata');
      if (ids.has(entry.id)) fail(where, 'duplicate id'); ids.add(entry.id);
      if (paths.has(entry.path)) fail(where, 'duplicate path'); paths.add(entry.path);
      if (typeof entry.path !== 'string' || !/^eggs\/[a-z0-9-]+\/[a-z0-9-]+\/egg\.json$/.test(entry.path)) { fail(where, 'unsafe path'); continue; }
      try {
        const egg = await readJson(entry.path);
        validateEgg(egg, entry.path);
        for (const field of ['id', 'name', 'description', 'category', 'version']) if (entry[field] !== egg[field]) fail(where, `${field} does not match egg`);
      } catch (error) { fail(where, `cannot read egg: ${error.message}`); }
    }
    const discover = async (dir) => {
      for (const item of await readdir(resolve(root, dir), { withFileTypes: true })) {
        const path = `${dir}/${item.name}`;
        if (item.isDirectory()) await discover(path);
        else if (item.isFile() && item.name === 'egg.json' && !paths.has(path)) fail(path, 'not listed in registry');
        else if (item.isSymbolicLink()) fail(path, 'symlinks are not supported');
      }
    };
    await discover('eggs');
  }
}
for (const path of ['schemas/v1/egg.schema.json', 'schemas/v1/registry.schema.json']) {
  try { await readJson(path); } catch (error) { fail(path, error.message); }
}
if (errors.length) { console.error(errors.map(e => `ERROR ${e}`).join('\n')); process.exitCode = 1; }
else console.log(`OK: ${registry.eggs.length} Egg(s) validated (format v1)`);
