import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
    validateRegistryV2
} from '../src/core/registry/registry-v2.mjs';

export {
    validateRegistryV2
} from '../src/core/registry/registry-v2.mjs';

async function main() {
    const result = await validateRegistryV2();

    if (result.valid) {
        console.log(
            `OK: ${result.count} Egg(s) validated (registry v2)`
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
