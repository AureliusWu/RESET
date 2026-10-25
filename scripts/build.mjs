import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const root = resolve(new URL('..', import.meta.url).pathname);
const lock = JSON.parse(await readFile(resolve(root, 'ENGINE.lock.json'), 'utf8'));
const engine = resolve(process.env.VN_ENGINE_PATH || resolve(root, '..', 'VN-Engine-v2'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', encoding: 'utf8' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.ALLOW_ENGINE_DRIFT !== '1') {
  const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: engine, encoding: 'utf8' });
  if (head.status !== 0) throw new Error('VN Engine v2 repository is unavailable; set VN_ENGINE_PATH.');
  if (head.stdout.trim() !== lock.commit) throw new Error(`VN Engine v2 must be at ${lock.commit}; set ALLOW_ENGINE_DRIFT=1 only for deliberate engine development.`);
}

run(npm, ['run', 'build'], engine);
await rm(resolve(root, 'dist'), { recursive: true, force: true });
run(process.execPath, [resolve(engine, 'tools/package-game.mjs'), resolve(root, 'game/project.json'), resolve(root, 'dist')], root);
console.log('回留 build completed with VN Engine v2 ' + lock.version + ' @ ' + lock.commit.slice(0, 12));
