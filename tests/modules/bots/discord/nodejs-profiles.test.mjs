import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  cp,
  readFile,
  writeFile,
  rm
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../..'
);

const eggPath = 'eggs/bots/discord-nodejs/egg.json';

const files = [
  'registry.json',
  eggPath,
  'eggs/bots/discord-python/egg.json',
  'eggs/bots/telegram-python/egg.json',
  'eggs/bots/telegram-nodejs/egg.json',
  'eggs/applications/universal-nodejs/egg.json',
  'eggs/applications/universal-python/egg.json',
  'schemas/v1/egg.schema.json',
  'schemas/v1/registry.schema.json',
  'scripts/validate.mjs',
  'src/core/registry/registry-v1.mjs',
  'src/core/security/safe-file.mjs'
];

async function run(change) {
  const root = await mkdtemp(
    join(tmpdir(), 'tyravex-profiles-')
  );

  try {
    for (const file of files) {
      await mkdir(
        dirname(join(root, file)),
        { recursive: true }
      );

      await cp(
        join(repo, file),
        join(root, file)
      );
    }

    if (change) {
      const file = join(root, eggPath);

      const egg = JSON.parse(
        await readFile(file, 'utf8')
      );

      change(egg);

      await writeFile(
        file,
        JSON.stringify(egg, null, 2) + '\n'
      );
    }

    return spawnSync(
      process.execPath,
      [join(root, 'scripts/validate.mjs')],
      {
        cwd: root,
        encoding: 'utf8',
        timeout: 10000
      }
    );
  } finally {
    await rm(root, {
      recursive: true,
      force: true
    });
  }
}

function reject(name, change, pattern) {
  test(name, async () => {
    const result = await run(change);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, pattern);
  });
}

test('validates Discord Node.js profiles', async () => {
  const result = await run();

  assert.equal(
    result.status,
    0,
    result.stderr
  );
});

reject(
  'rejects duplicate profile IDs',
  egg => {
    egg.profiles[1].id = egg.profiles[0].id;
  },
  /duplicate profile id/
);

reject(
  'rejects unknown default profile',
  egg => {
    egg.defaultProfile = 'unknown';
  },
  /default profile not listed/
);

reject(
  'rejects traversal in entrypoint',
  egg => {
    egg.profiles[1].startup.entrypoint = '../bot.js';
  },
  /invalid entrypoint/
);

reject(
  'rejects shell startup',
  egg => {
    egg.profiles[1].startup.mode = 'shell';
  },
  /unsupported startup mode/
);

reject(
  'rejects unknown runtime version',
  egg => {
    egg.profiles[1].runtimeVersion = '99';
  },
  /profile runtime version not listed/
);

reject(
  'rejects duplicate runtime versions',
  egg => {
    egg.runtime.versions[1].version = '20';
  },
  /duplicate runtime version/
);

reject(
  'rejects unexpected startup commands',
  egg => {
    egg.profiles[1].startup.command = 'sh -c whoami';
  },
  /unexpected property command/
);

reject(
  'rejects mismatched default image',
  egg => {
    egg.runtime.image = 'node:20-bookworm-slim';
  },
  /default runtime image mismatch/
);
