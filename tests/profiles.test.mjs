import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const eggPath = 'eggs/bots/discord-nodejs/egg.json';
const files = ['registry.json', eggPath, 'schemas/v1/egg.schema.json', 'schemas/v1/registry.schema.json', 'scripts/validate.mjs'];
async function run(change) {
  const root = await mkdtemp(join(tmpdir(), 'tyravex-profiles-'));
  try {
    for (const file of files) { await mkdir(dirname(join(root,file)),{recursive:true}); await cp(join(repo,file),join(root,file)); }
    if (change) {
      const file = join(root,eggPath);
      const egg = JSON.parse(await readFile(file,'utf8'));
      change(egg);
      await writeFile(file,JSON.stringify(egg,null,2)+'\n');
    }
    return spawnSync(process.execPath,[join(root,'scripts/validate.mjs')],{cwd:root,encoding:'utf8',timeout:10000});
  } finally { await rm(root,{recursive:true,force:true}); }
}
function reject(name, change, pattern) { test(name,async()=>{const r=await run(change);assert.notEqual(r.status,0);assert.match(r.stderr,pattern);}); }
test('validates Discord Node.js profiles',async()=>{const r=await run();assert.equal(r.status,0,r.stderr);});
reject('rejects duplicate profile IDs',e=>{e.profiles[1].id=e.profiles[0].id;},/duplicate profile id/);
reject('rejects unknown default profile',e=>{e.defaultProfile='unknown';},/default profile not listed/);
reject('rejects traversal in entrypoint',e=>{e.profiles[1].startup.entrypoint='../bot.js';},/invalid entrypoint/);
reject('rejects shell startup',e=>{e.profiles[1].startup.mode='shell';},/unsupported startup mode/);
reject('rejects unknown runtime version',e=>{e.profiles[1].runtimeVersion='99';},/profile runtime version not listed/);
reject('rejects duplicate runtime versions',e=>{e.runtime.versions[1].version='20';},/duplicate runtime version/);
reject('rejects unexpected startup commands',e=>{e.profiles[1].startup.command='sh -c whoami';},/unexpected property command/);
reject('rejects mismatched default image',e=>{e.runtime.image='node:20-bookworm-slim';},/default runtime image mismatch/);
