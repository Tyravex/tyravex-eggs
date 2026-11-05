import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  validateRegistryV1
} from '../src/core/registry/registry-v1.mjs';

export {
  validateRegistryV1
} from '../src/core/registry/registry-v1.mjs';

async function main() {
  const result = await validateRegistryV1();

  if (result.valid) {
    console.log(
      `OK: ${result.count} Egg(s) validated (format v1)`
    );
    return;
  }

  for (const error of result.errors) {
    console.error(`ERROR ${error}`);
  }

  process.exitCode = 1;
}

const invokedDirectly =
  process.argv[1] &&
  import.meta.url === pathToFileURL(
    resolve(process.argv[1])
  ).href;

if (invokedDirectly) {
  await main();
}
