import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  rm,
  cp
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

const eggPath = 'eggs/bots/discord-nodejs/egg.json';

const baseFiles = [
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

async function fixture(change) {
  const root = await mkdtemp(
    join(tmpdir(), 'tyravex-eggs-test-')
  );

  try {
    for (const file of baseFiles) {
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
      await change(root);
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

async function edit(root, path, modify) {
  const file = join(root, path);

  const value = JSON.parse(
    await readFile(file, 'utf8')
  );

  modify(value);

  await writeFile(
    file,
    JSON.stringify(value, null, 2) + '\n'
  );
}

function rejects(name, change, expected) {
  test(name, async () => {
    const result = await fixture(change);

    assert.notEqual(
      result.status,
      0,
      result.stdout
    );

    assert.match(
      result.stderr,
      expected
    );
  });
}

test('accepts the canonical registry and Eggs', async () => {
  const result = await fixture();

  assert.equal(
    result.status,
    0,
    result.stderr
  );

  assert.match(
    result.stdout,
    /OK: 6 Egg\(s\) validated/
  );
});

rejects('rejects duplicate registry IDs', async root => {
  await edit(root, 'registry.json', registry => {
    registry.eggs.push({
      ...registry.eggs[0],
      path: 'eggs/bots/another/egg.json'
    });
  });
}, /duplicate id/);

rejects('rejects duplicate registry paths', async root => {
  await edit(root, 'registry.json', registry => {
    registry.eggs.push({
      ...registry.eggs[0],
      id: 'tyravex.other.nodejs'
    });
  });
}, /duplicate path/);

rejects('rejects traversal paths', async root => {
  await edit(root, 'registry.json', registry => {
    registry.eggs[0].path = '../secrets.json';
  });
}, /unsafe path/);

rejects('rejects registry metadata mismatch', async root => {
  await edit(root, 'registry.json', registry => {
    registry.eggs[0].version = '2.0.0';
  });
}, /version does not match egg/);

rejects('rejects unsupported install mode', async root => {
  await edit(root, eggPath, egg => {
    egg.install.mode = 'shell';
  });
}, /unsupported install mode/);

rejects('rejects unexpected startup command', async root => {
  await edit(root, eggPath, egg => {
    egg.startup.command = 'sh -c evil';
  });
}, /unexpected property command/);

rejects('rejects duplicate environment variables', async root => {
  await edit(root, eggPath, egg => {
    egg.variables.push({
      ...egg.variables[0]
    });
  });
}, /duplicate variable name/);

rejects('rejects unregistered Egg manifests', async root => {
  const extra = join(
    root,
    'eggs/bots/unlisted/egg.json'
  );

  await mkdir(
    dirname(extra),
    { recursive: true }
  );

  await cp(
    join(root, eggPath),
    extra
  );
}, /not listed in registry/);

rejects('rejects unknown manifest properties', async root => {
  await edit(root, eggPath, egg => {
    egg.runAsRoot = true;
  });
}, /unexpected property runAsRoot/);
