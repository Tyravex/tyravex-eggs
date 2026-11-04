import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const load = async p => JSON.parse(await readFile(resolve(root, p), 'utf8'));
const errors = [];
for (const [file, expected] of [
  ['schemas/v1/egg.schema.json', ['schemaVersion', 'id', 'name', 'description', 'version', 'category', 'runtime', 'install', 'startup', 'variables']],
  ['schemas/v1/registry.schema.json', ['schemaVersion', 'eggs']]
]) {
  const schema = await load(file);
  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') errors.push(`${file}: unexpected JSON Schema draft`);
  if (schema.type !== 'object' || schema.additionalProperties !== false) errors.push(`${file}: root must be a closed object`);
  for (const field of expected) {
    if (!schema.required?.includes(field) || !schema.properties?.[field]) errors.push(`${file}: missing required property ${field}`);
  }
  if (schema.properties?.schemaVersion?.const !== 1) errors.push(`${file}: schemaVersion must be 1`);
}
if (errors.length) {
  console.error(errors.map(e => `ERROR ${e}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('OK: v1 schema contract checks passed');
}
