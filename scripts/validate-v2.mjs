import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
    validateEggV2File
} from '../src/core/validation/egg-v2.mjs';

export {
    validateEggV2,
    validateEggV2File
} from '../src/core/validation/egg-v2.mjs';

async function main() {
    const files = process.argv.slice(2);

    if (files.length === 0) {
        console.error(
            'Usage: node scripts/validate-v2.mjs <manifest.json> [...]'
        );
        process.exitCode = 1;
        return;
    }

    let failures = 0;

    for (const file of files) {
        try {
            const result = await validateEggV2File(resolve(file));

            if (result.valid) {
                console.log(`OK: ${file}`);
            } else {
                failures++;

                for (const error of result.errors) {
                    console.error(
                        `ERROR ${file} ${error.path}: ${error.message}`
                    );
                }
            }
        } catch (error) {
            failures++;
            console.error(`ERROR ${file}: ${error.message}`);
        }
    }

    if (failures > 0) {
        process.exitCode = 1;
    }
}

const invokedDirectly = process.argv[1] &&
    import.meta.url === pathToFileURL(
        resolve(process.argv[1])
    ).href;

if (invokedDirectly) {
    await main();
}
