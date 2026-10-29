import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

// Native decoder coverage is shared with the actual Windows final-ZIP test.
export async function verifyMusicDecoding(page, pass) {
  const results = await page.evaluate(async () => {
    const metadata = await (await fetch('./music-manifest.json')).json();
    const context = new OfflineAudioContext(2, 1, metadata.sampleRate), results = [];
    for (const track of metadata.tracks) {
      const response = await fetch(track.src); if (!response.ok) throw Error(`Audio fetch failed: ${track.id}`);
      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      if (buffer.numberOfChannels !== 2 || buffer.sampleRate !== metadata.sampleRate || buffer.length !== track.frames) throw Error(`Native decode mismatch: ${track.id}`);
      results.push({ id: track.id, duration: buffer.duration, frames: buffer.length });
    }
    return results;
  });
  assert.equal(results.length, 14);
  pass?.('All 14 final-package BGM files decode in the platform audio decoder with exact stereo PCM frames');
  return results;
}

// Observes real Web Audio calls and an output tap; does not replace decoding,
// source nodes, playback, scheduling, suspend/resume or the audio destination.
function installProbe() {
  const Native = window.AudioContext;
  const probe = window.__resetMusicProbe = { contexts: [], starts: [], stops: [], buses: [], taps: [], decodes: 0 };
  window.AudioContext = class extends Native {
    constructor(...args) {
      super(...args); probe.contexts.push(this);
      const tap = this.createAnalyser(), sink = this.createGain(); tap.fftSize = 2048;
      sink.gain.value = 0; tap.connect(sink).connect(this.destination); probe.taps.push(tap);
      const createGain = this.createGain.bind(this);
      this.createGain = () => {
        const node = createGain(), connect = node.connect.bind(node);
        node.connect = (...args) => { if (args[0] === this.destination) { connect(tap); probe.buses.push(node); } return connect(...args); };
        return node;
      };
      const createSource = this.createBufferSource.bind(this);
      this.createBufferSource = () => {
        const source = createSource(), start = source.start.bind(source), stop = source.stop.bind(source);
        source.start = (...args) => { probe.starts.push({ frames: source.buffer?.length, duration: source.buffer?.duration, loop: source.loop, time: this.currentTime }); return start(...args); };
        source.stop = (...args) => { probe.stops.push({ time: this.currentTime }); return stop(...args); };
        return source;
      };
      const decode = this.decodeAudioData.bind(this);
      this.decodeAudioData = (...args) => { probe.decodes++; return decode(...args); };
    }
  };
}

async function run() {
  const engine = resolve(process.env.VN_ENGINE_PATH || '../VN-Engine-v2');
  const { chromium } = await import(pathToFileURL(resolve(engine, 'node_modules/playwright/index.mjs')));
  const dist = resolve(process.env.RESET_DIST || 'dist'), out = resolve('test-results/music-r1');
  const fixtures = JSON.parse(await readFile('test-results/route-fixtures.json', 'utf8'));
  const metadata = JSON.parse(await readFile(resolve(dist, 'music-manifest.json'), 'utf8'));
  await mkdir(out, { recursive: true });
  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (!path.startsWith('/play/')) throw Error('scope');
      const file = resolve(dist, path.slice(6) || 'index.html');
      if (!file.startsWith(dist + sep)) throw Error('outside package');
      const bytes = await readFile(file);
      const type = { '.html':'text/html', '.mjs':'text/javascript', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.webmanifest':'application/manifest+json', '.wav':'audio/wav', '.webp':'image/webp', '.png':'image/png', '.svg':'image/svg+xml' }[extname(file)] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type':type }); res.end(bytes);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/play/`, checks = [], errors = [];
  let browser;
  try {
    browser = await chromium.launch({ headless:true, args:['--no-sandbox'] });
    for (const mobile of [false, true]) {
      const context = await browser.newContext({ viewport:mobile ? {width:390,height:844} : {width:1280,height:900}, isMobile:mobile, hasTouch:mobile });
      await context.addInitScript(installProbe);
      await context.addInitScript(() => {
        if (!localStorage.getItem('vn-engine:reset:settings')) localStorage.setItem('vn-engine:reset:settings', JSON.stringify({textDelayMs:0,reducedMotion:true,music:true,voiceEnabled:false,soundEffects:false,volume:.2}));
      });
      const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
      const pass = name => { checks.push({platform:mobile?'mobile-emulation':'desktop-browser',name}); console.log('PASS',mobile?'mobile':'desktop',name); };
      const control = id => page.locator(`[data-control="${id}"]`);
      const close = () => page.getByRole('button',{name:'关闭',exact:true}).click();
      const enter = async () => { await page.locator('[data-reset-enter]').click(); await page.locator('.reset-title-gate').waitFor({state:'detached'}); };
      const load = async id => {
        const save = fixtures.witnesses[id]; assert.ok(save, `Missing canonical witness: ${id}`);
        await control('settings').click();
        await page.locator('input[type=file]').setInputFiles({name:'music-witness.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(save))});
        await page.locator('.vn-modal').waitFor({state:'hidden'});
        await page.waitForFunction(id => document.querySelector('.vn-engine')?.dataset.scene === id, id);
      };
      const active = async id => {
        const duration = metadata.tracks.find(track => track.id === id).loopEnd;
        await page.waitForFunction(duration => { const p = window.__resetMusicProbe; return p.contexts.some(c => c.state === 'running') && Math.abs((p.starts.at(-1)?.duration ?? 0) - duration) < .001; },duration);
      };
      await page.goto(url); await page.locator('[data-reset-enter]').waitFor(); await enter();
      await control('sound').click(); await active('music-memory-rain');
      if (!mobile) await verifyMusicDecoding(page, pass);
      // An analyser observes real rendered output, not just a created source.
      await page.waitForFunction(() => {
        const p = window.__resetMusicProbe;
        return p.taps.some(tap => { const values = new Float32Array(tap.fftSize); tap.getFloatTimeDomainData(values); return values.some(v => Math.abs(v) > .0001); });
      });
      pass('User gesture starts the real audio graph and produces nonzero rendered output');
      await load('c4_linwan_1'); await active('music-linwan-dream');
      const before = await page.evaluate(() => window.__resetMusicProbe.starts.length);
      for (const scene of ['c4_linwan_2','end_linwan']) { await load(scene); await active('music-linwan-dream'); }
      assert.equal(await page.evaluate(() => window.__resetMusicProbe.starts.length), before);
      pass('Character route and its normal ending retain one continuous source without restarting the same theme');
      await control('settings').click();
      await page.waitForFunction(() => window.__resetMusicProbe.contexts.every(c => c.state === 'suspended'));
      const pausedAt = await page.evaluate(() => window.__resetMusicProbe.contexts[0].currentTime);
      await page.waitForTimeout(180);
      assert.equal(await page.evaluate(() => window.__resetMusicProbe.contexts[0].currentTime), pausedAt);
      await page.getByLabel('音乐与音效音量',{exact:true}).fill('0.35');
      await page.getByLabel('背景音乐',{exact:true}).uncheck(); await close();
      assert.equal(await page.evaluate(() => window.__resetMusicProbe.buses.at(-1).gain.value), 0);
      await control('settings').click(); await page.getByLabel('背景音乐',{exact:true}).check(); await close();
      await active('music-linwan-dream');
      assert.ok(Math.abs(await page.evaluate(() => window.__resetMusicProbe.buses.at(-1).gain.value) - .35) < .001);
      pass('Settings pauses the context, mute silences its bus, and resume restores the saved gain');
      for (const [scene, theme] of [['c4_xiaoman_1','music-xiaoman-forward'],['end_xiaoman','music-xiaoman-forward'],['c4_xuqi_1','music-xuqi-night'],['end_xuqi','music-xuqi-night'],['c4_tinglan_1','music-tinglan-archive'],['end_tinglan','music-tinglan-archive'],['c4_tangli_1','music-tangli-road'],['end_tangli','music-tangli-road'],['c4_nanxing_1','music-nanxing-message'],['end_nanxing','music-nanxing-message'],['faceless_pattern','music-fracture-pulse'],['c5_anchor_truth','music-no-save'],['c7_morning','music-tomorrow']]) {
        await load(scene); await active(theme);
        assert.equal(await page.evaluate(() => window.__resetMusicProbe.starts.at(-1).loop), true);
      }
      pass('Six character endings, combat, no-save and True End select their real looping score sources');
      const counts = await page.evaluate(() => ({starts:window.__resetMusicProbe.starts.length,stops:window.__resetMusicProbe.stops.length}));
      assert.ok(counts.stops >= counts.starts - 1, 'obsolete music sources must be released');
      await page.waitForFunction(async () => { const registration = await navigator.serviceWorker.getRegistration(); return registration?.active?.state === 'activated'; },null,{timeout:45000});
      // Explicitly wait for every audio and its source manifest in CacheStorage.
      await page.waitForFunction(async () => {
        const metadata = await (await fetch('./music-manifest.json')).json();
        for (const track of metadata.tracks) if (!await caches.match(new URL(track.src,location.href).href)) return false;
        return Boolean(await caches.match(new URL('music-manifest.json',location.href).href));
      },null,{timeout:45000});
      await context.setOffline(true); await page.reload(); await enter(); await control('sound').click();
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('vn-engine:reset:settings')).volume), .35);
      await load('c4_tangli_1'); await active('music-tangli-road');
      await load('c7_morning'); await active('music-tomorrow');
      if (!mobile) await verifyMusicDecoding(page, pass);
      pass('Offline reload retains music settings, decodes cached scores and plays route/ending music');
      await context.close();
    }
    assert.deepEqual(errors,[]);
    await writeFile(resolve(out,'browser-report.json'),JSON.stringify({schema:1,status:'PASS',browser:await browser.version(),checks,errors,physicalDevices:'NOT_RUN',subjectiveListening:'NOT_CLAIMED'},null,2)+'\n');
  } catch (error) {
    await writeFile(resolve(out,'browser-failure.json'),JSON.stringify({status:'FAIL',error:error.stack,checks,errors},null,2)+'\n'); throw error;
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await run();
