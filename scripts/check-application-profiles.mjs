import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateApplicationProfiles } from '../src/core/profiles/application-catalog.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const result = await validateApplicationProfiles(root);
console.log(`OK: ${result.count} application profiles, ${result.installable} with installer contracts`);
