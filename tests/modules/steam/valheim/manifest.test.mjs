import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { validateEggV2 } from '../../../../src/core/validation/egg-v2.mjs';
const egg = JSON.parse(await readFile(new URL('../../../../eggs-v2/games/valheim-vanilla/egg.json', import.meta.url)));
test('Valheim has a valid schema, anonymous Steam recipe and dedicated server App ID', () => {
  assert.equal(validateEggV2(egg).valid, true);
  assert.equal(egg.provisioning.appId, 896660);
  assert.equal(egg.provisioning.login, 'anonymous');
  assert.equal(egg.provisioning.stopSignal, 'SIGINT');
  assert.equal(egg.provisioning.stopTimeoutSeconds, 120);
});
test('Valheim declares exactly two UDP ports and never embeds a password', () => {
  assert.deepEqual(egg.network.ports.map(p => [p.protocol, p.containerPort]), [['udp',2456],['udp',2457]]);
  assert.deepEqual(egg.variables.find(v => v.name === 'VALHEIM_PASSWORD'), { name:'VALHEIM_PASSWORD',type:'secret',required:true });
  assert.ok(egg.lifecycle.start.args.includes('{{VALHEIM_PASSWORD}}'));
  assert.ok(egg.lifecycle.start.args.includes('/app/project/saves'));
});
test('Valheim artwork matches its checksum and uses a digest-pinned runtime', async () => {
  const bytes = await readFile(new URL('../../../../' + egg.artwork.banner.path, import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), egg.artwork.banner.sha256);
  assert.match(egg.runtime.reference, /@sha256:[a-f0-9]{64}$/);
});
test('Steam schema rejects other applications and implicit authenticated logins', () => {
  for (const changes of [{appId: 1}, {login:'account'}, {architecture:'arm64'}, {branch:'beta'}]) {
    const invalid = structuredClone(egg); Object.assign(invalid.provisioning, changes);
    assert.equal(validateEggV2(invalid).valid, false);
  }
});
