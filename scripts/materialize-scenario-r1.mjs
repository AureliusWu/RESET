import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, fileURLToPath } from 'node:path';
import { gunzipSync } from 'node:zlib';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const payloadDir = resolve(root, 'game/scenario-r1-payload');
const output = resolve(root, 'game/content/zzzzz-scenario-r1.generated.json');
const expectedSha256 = 'd8d034329279060ea7190b4dc3c239d0de0d04b6da2105854fa7a11c38ddb7e0';

const files = (await readdir(payloadDir))
  .filter(name => /^part-\d+\.b64$/.test(name))
  .sort((a, b) => a.localeCompare(b, 'en'));

if (!files.length) throw new Error('Scenario R1 payload is missing');

let encoded = '';
for (const file of files) encoded += (await readFile(resolve(payloadDir, file), 'utf8')).trim();

const json = gunzipSync(Buffer.from(encoded, 'base64'));
const sha256 = createHash('sha256').update(json).digest('hex');
if (sha256 !== expectedSha256) {
  throw new Error(`Scenario R1 payload SHA256 mismatch: expected ${expectedSha256}, got ${sha256}`);
}

const pack = JSON.parse(json.toString('utf8'));
if (pack.id !== 'scenario-reconstruction-r1') throw new Error(`Unexpected R1 pack id: ${pack.id}`);
if (!Array.isArray(pack.replaceScenes) || pack.replaceScenes.length !== 82) {
  throw new Error(`Scenario R1 must replace exactly 82 scenes; got ${pack.replaceScenes?.length ?? 0}`);
}
if (new Set(pack.replaceScenes.map(scene => scene.id)).size !== 82) {
  throw new Error('Scenario R1 contains duplicate scene ids');
}

await mkdir(resolve(root, 'game/content'), { recursive: true });
await writeFile(output, `${json.toString('utf8')}\n`);
console.log(JSON.stringify({ status: 'scenario-r1-materialized', parts: files.length, scenes: 82, sha256 }));
