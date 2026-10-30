import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { loadSupportingArt } from '../scripts/supporting-art.mjs';
import { supportingRuntimeWitnesses } from '../scripts/supporting-runtime.mjs';

// Shared by final Web ZIP, installed Windows WebView2 and deployed Pages QA.
export async function verifySupportingPortraits({ page, project, loadFixture, reset, out, pass = console.log, dist = resolve(process.env.RESET_DIST || 'dist'), viewports = [[1280,900],[390,844],[844,390],[3840,2160]], sequences = true }) {
  await mkdir(out, { recursive: true });
  const art = await loadSupportingArt(resolve('.'));
  const policy = JSON.parse(await readFile('game/visual/r5-speaker-policy.json', 'utf8'));
  const { createProject } = await import(pathToFileURL(resolve(dist, 'lib/index.js')));
  const authored = JSON.parse(await readFile('game/content/runtime.json', 'utf8'));
  const offscreen = Object.entries(authored.stage.lines).filter(([,cue]) => cue.portrait === null).map(([id]) => id);
  const runtime = supportingRuntimeWitnesses(project, createProject, art.characters, policy, offscreen);
  const originalViewport = page.viewportSize(), records = [], sequenceRecords = [], screenshots = [];
  const shot = async name => {
    const file = `${name}.png`; await page.screenshot({ path: resolve(out, file), animations: 'disabled' });
    screenshots.push({ file, sha256: createHash('sha256').update(await readFile(resolve(out, file))).digest('hex') });
  };
  const check = async (expected, lineId, cg = null) => {
    await page.waitForFunction(({ expected, lineId, cg }) => {
      const host = document.querySelector('.vn-engine'), im = document.querySelector('.vn-portrait');
      if (host?.dataset.line !== lineId || !im) return false;
      if (!expected) return im.hidden && !im.getAttribute('src');
      const r = im.getBoundingClientRect(), css = getComputedStyle(im);
      return im.dataset.asset === expected && !im.hidden && im.complete && im.naturalWidth > 0 && im.naturalHeight > 0 && (cg || (r.width > 0 && r.height > 0 && css.visibility !== 'hidden' && css.display !== 'none'));
    }, { expected, lineId, cg });
    if(cg) await page.waitForFunction(id=>{const im=document.querySelector('.vn-cg');return im?.dataset.asset===id&&!im.hidden&&im.complete&&im.naturalWidth>0;},cg);
    const pixels = await page.locator('.vn-portrait').evaluate(im => ({ asset: im.dataset.asset ?? null, hidden: im.hidden, naturalWidth: im.naturalWidth, naturalHeight: im.naturalHeight }));
    if (expected && !cg) assert.equal(await page.locator('.vn-portrait').isVisible(), true, lineId);
    else assert.equal(await page.locator('.vn-portrait').isVisible(), false, lineId);
    assert.equal(await page.locator('#error').innerText(), '', lineId);
    return pixels;
  };
  try {
    for (const viewport of viewports) {
      if (viewport) await page.setViewportSize({ width: viewport[0], height: viewport[1] });
      const label = viewport ? viewport.join('x') : 'native';
      for (const c of art.characters) {
        const witness = runtime.witnesses[c.id], asset = project.assets.find(a => a.id === witness.portrait);
        assert.equal(art.approved.has(c.id), true, `${c.name}: approved production art required`);
        assert.equal(project.stage.speakers[c.name], c.id);
        assert.equal(asset?.kind, 'portrait');
        await loadFixture(witness.save);
        const pixels = await check(`${c.id}/neutral`, witness.lineId);
        assert.ok((await page.locator('.vn-portrait').getAttribute('src')).includes(asset.src));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${c.name}: horizontal overflow`);
        records.push({ id: c.id, name: c.name, viewport: label, sceneId: witness.sceneId, lineId: witness.lineId, runtimePortrait: witness.portrait, ...pixels });
        if (label === '390x844' || label === 'native') await shot(`${label}-${c.id}`);
      }
    }
    if (sequences) {
      if (originalViewport) await page.setViewportSize(originalViewport);
      for (const sceneId of ['morning_after','chapter5_gate','c7_morning','c7_after']) {
        await reset(); await loadFixture(runtime.sceneEntries[sceneId]);
        for (const [index, frame] of runtime.transitions[sceneId].entries()) {
          const pixels = await check(frame.portrait, frame.lineId, frame.cg);
          sequenceRecords.push({ sceneId, lineId: frame.lineId, speaker: frame.speaker, runtimePortrait: frame.portrait, ...pixels });
          if (['r1_c7_after_pre03_01','r1_c7_after_pre04_01','r1_c7_after_key01_01','r1_chapter5_gate_key01_01','c7m003'].includes(frame.lineId)) await shot(`${sceneId}-${frame.lineId}`);
          if (index < runtime.transitions[sceneId].length - 1) await page.locator('[data-control=next]').click();
        }
      }
      // A real telephone turn followed by an actual in-person heroine turn.
      await reset(); await loadFixture(runtime.sceneEntries.faceless_pattern);
      const source = project.scenes.find(s => s.id === 'faceless_pattern');
      for (const [index, line] of source.lines.entries()) {
        const cue = project.stage.lines[line.id], cg = source.cg && index >= (source.cgFrom ?? 0);
        await check(cue.portrait, line.id, cg ? source.cg : null);
        if (index < source.lines.length - 1) await page.locator('[data-control=next]').click();
      }
      // Functional speakers are checked in their actual story scene.
      await reset(); await loadFixture(runtime.sceneEntries.station_refuse);
      const station = project.scenes.find(s => s.id === 'station_refuse');
      for (const [index, line] of station.lines.entries()) {
        await check(project.stage.lines[line.id].portrait, line.id);
        if (index < station.lines.length - 1) await page.locator('[data-control=next]').click();
      }
    }
    const report = { schema: 1, status: 'PASS', version: project.version, projectSha256: createHash('sha256').update(await readFile(resolve(dist,'project.json'))).digest('hex'), supportingCharacters: 12, approved: art.approved.size, speakerMapped: 12, runtimeVisible: runtime.runtimeVisible, domVisible: new Set(records.map(r => r.id)).size, runtimeVisitedLines: runtime.visitedLines, records, sequences: sequenceRecords, screenshots, productionProjectOverride: false, evidenceMethod: 'Canonical entry/choice traversal produces replay saves; the shipped player imports them through Settings. Runtime frames and real DOM must agree. Sequential playback uses visible Next controls.', physicalDevice: false };
    await writeFile(resolve(out, 'supporting-runtime.json'), JSON.stringify(report, null, 2) + '\n');
    pass(`All 12 approved supporting speakers render real decoded portraits across ${viewports.length} viewport(s); ordered narration, protagonist, functional and offscreen turns clear stale portraits`);
    return report;
  } finally {
    if (originalViewport) await page.setViewportSize(originalViewport);
    await reset();
  }
}
