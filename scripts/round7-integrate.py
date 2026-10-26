from pathlib import Path


def patch(path, old, new):
    p = Path(path)
    s = p.read_text(encoding='utf-8')
    if s.count(old) != 1:
        raise SystemExit(f'{path}: expected one patch target, got {s.count(old)} for {old[:80]!r}')
    p.write_text(s.replace(old, new), encoding='utf-8')


patch(
    'scripts/build.mjs',
    "import { readFile, rm, writeFile, readdir, copyFile } from 'node:fs/promises';",
    "import { readFile, rm, writeFile, readdir, copyFile, mkdir } from 'node:fs/promises';"
)
patch(
    'scripts/build.mjs',
    "  for (const file of ['README.md', 'LICENSE.md', 'CHANGELOG_v1.2.0-dev.md']) {",
    "  const uiRuntimeDir = resolve(root, 'game/assets/4k/runtime/ui'), uiOutputDir = resolve(output, 'assets/4k/runtime/ui');\n"
    "  await mkdir(uiOutputDir, { recursive: true });\n"
    "  for (const file of ['title-key-visual.webp','save-anomaly.webp','ending-collection-header.webp','cg-gallery-header.webp','combat-hud-key-visual.webp']) {\n"
    "    await copyFile(resolve(uiRuntimeDir, file), resolve(uiOutputDir, file));\n"
    "  }\n"
    "  for (const file of ['README.md', 'LICENSE.md', 'CHANGELOG_v1.2.0-dev.md']) {"
)
patch(
    'scripts/build.mjs',
    "for (const file of ['combat.mjs','meta.mjs','archive.mjs','archive-data.mjs','experience.css','experience.mjs','pwa.mjs']) {",
    "for (const file of ['combat.mjs','meta.mjs','archive.mjs','archive-data.mjs','experience.css','experience.mjs','ui.mjs','pwa.mjs']) {"
)
patch(
    'scripts/build.mjs',
    "const [{mountCombatBridge},{mountMetaBridge},{mountArchiveBridge},{mountExperienceBridge}]=await Promise.all([import('./combat.mjs'),import('./meta.mjs'),import('./archive.mjs'),import('./experience.mjs')]);const combat=mountCombatBridge(game),meta=mountMetaBridge(game),archive=mountArchiveBridge(game,project,meta),experience=mountExperienceBridge(game,project);window.addEventListener('pagehide',event=>{if(!event.persisted){experience.dispose();archive.dispose();meta.dispose();combat.dispose();game.dispose();}});",
    "const [{mountCombatBridge},{mountMetaBridge},{mountArchiveBridge},{mountExperienceBridge},{mountUiBridge}]=await Promise.all([import('./combat.mjs'),import('./meta.mjs'),import('./archive.mjs'),import('./experience.mjs'),import('./ui.mjs')]);const combat=mountCombatBridge(game),meta=mountMetaBridge(game),archive=mountArchiveBridge(game,project,meta),experience=mountExperienceBridge(game,project),ui=mountUiBridge(game);window.addEventListener('pagehide',event=>{if(!event.persisted){ui.dispose();experience.dispose();archive.dispose();meta.dispose();combat.dispose();game.dispose();}});"
)
patch(
    'scripts/build.mjs',
    "extensions: ['reset-combat-v1', 'reset-meta-v1', 'reset-portrait-set-v1', 'reset-scene-art-v1', 'reset-archive-v1', 'reset-responsive-v1'],",
    "extensions: ['reset-combat-v1', 'reset-meta-v1', 'reset-portrait-set-v1', 'reset-scene-art-v1', 'reset-archive-v1', 'reset-responsive-v1', 'reset-ui-key-visual-v1'],"
)

css = Path('game/runtime/experience.css')
s = css.read_text(encoding='utf-8')
if 'Round 7: 4K UI key visuals' in s:
    raise SystemExit('experience.css already patched')
css.write_text(s.rstrip() + r'''

/* Round 7: 4K UI key visuals remain decorative; controls and text stay DOM/CSS. */
.vn-engine .vn-stage{position:relative}
.reset-title-key-visual{position:absolute;inset:0;z-index:6;width:100%;height:100%;object-fit:cover;pointer-events:none;opacity:.92;filter:saturate(.94)}
.reset-ui-header{display:block;width:100%;height:clamp(116px,18vw,220px);object-fit:cover;object-position:center;border:1px solid #46616a;border-radius:12px;margin:8px 0 16px;box-shadow:0 12px 32px #0004;background:#0d1a22}
.reset-ui-header[data-ui-visual=save-anomaly]{object-position:center 48%}
.reset-ui-header[data-ui-visual=ending-collection-header],.reset-ui-header[data-ui-visual=cg-gallery-header]{margin-top:14px}
.reset-combat.reset-round7-ui{background:linear-gradient(rgba(5,8,12,.82),rgba(5,8,12,.94)),url('./assets/4k/runtime/ui/combat-hud-key-visual.webp') center/cover no-repeat!important}
@media(max-width:700px){.reset-ui-header{height:118px;border-radius:9px;margin-bottom:12px}.reset-title-key-visual{object-position:center}}
''' + '\n', encoding='utf-8')

patch(
    'scripts/check-release.mjs',
    "for (const extension of ['reset-combat-v1','reset-meta-v1','reset-portrait-set-v1','reset-scene-art-v1','reset-archive-v1','reset-responsive-v1'])",
    "for (const extension of ['reset-combat-v1','reset-meta-v1','reset-portrait-set-v1','reset-scene-art-v1','reset-archive-v1','reset-responsive-v1','reset-ui-key-visual-v1'])"
)
patch(
    'scripts/check-release.mjs',
    "for(const file of ['archive.mjs','archive-data.mjs','experience.css','experience.mjs','pwa.mjs','icon-192.png','icon-512.png'])assert(sw.includes(file),`${file} not cached`);",
    "for(const file of ['archive.mjs','archive-data.mjs','experience.css','experience.mjs','ui.mjs','pwa.mjs','icon-192.png','icon-512.png'])assert(sw.includes(file),`${file} not cached`);\n"
    "const uiVisuals=['title-key-visual','save-anomaly','ending-collection-header','cg-gallery-header','combat-hud-key-visual'];\n"
    "for(const id of uiVisuals){const path=`assets/4k/runtime/ui/${id}.webp`,bytes=await readFile(resolve(dist,path));const record=manifest.files.find(file=>file.name===path);assert(record?.size===bytes.length&&record.sha256===createHash('sha256').update(bytes).digest('hex'),`UI key visual missing/stale in final manifest: ${id}`);assert(sw.includes(path),`UI key visual not offline cached: ${id}`);}\n"
    "const uiRuntime=await readFile(resolve(dist,'ui.mjs'),'utf8');for(const id of uiVisuals)assert(uiRuntime.includes(`${id}.webp`),`UI key visual is not wired: ${id}`);"
)
patch(
    'scripts/check-release.mjs',
    "for (const file of ['combat.mjs','meta.mjs','archive.mjs','archive-data.mjs','experience.css','experience.mjs','pwa.mjs','icon-192.png','icon-512.png','project.json','sw.js','app.mjs','manifest.webmanifest'])",
    "for (const file of ['combat.mjs','meta.mjs','archive.mjs','archive-data.mjs','experience.css','experience.mjs','ui.mjs','pwa.mjs','icon-192.png','icon-512.png','project.json','sw.js','app.mjs','manifest.webmanifest'])"
)
patch(
    'scripts/check-release.mjs',
    "for (const file of ['combat.mjs','meta.mjs','archive.mjs','archive-data.mjs','experience.css','experience.mjs','pwa.mjs','icon-192.png','icon-512.png']) assert(listed.has(file), `${file} absent from integrity manifest`);",
    "for (const file of ['combat.mjs','meta.mjs','archive.mjs','archive-data.mjs','experience.css','experience.mjs','ui.mjs','pwa.mjs','icon-192.png','icon-512.png']) assert(listed.has(file), `${file} absent from integrity manifest`);"
)

p = Path('scripts/check-4k-production.mjs')
s = p.read_text(encoding='utf-8')
marker = "console.log(`4K production pairing ok: ${adopted} runtime asset(s), ${adoptedCharacters.size} adopted character(s)`);"
if s.count(marker) != 1:
    raise SystemExit('check-4k-production marker drift')
insert = r'''let uiReady = 0;
for (const item of plan.ui) {
  const masterInfo = await verifyMaster(item.master, plan.policy.uiKeyVisual, item.id);
  const runtimePath = resolve(game, item.runtime);
  assert(await exists(runtimePath), `${item.id} runtime derivative missing: ${item.runtime}`);
  const runtimeInfo = webpInfo(await readFile(runtimePath));
  assert(runtimeInfo?.width === 1920 && runtimeInfo.height === 1080, `${item.id} runtime must be 1920x1080`);
  assert(runtimeInfo.width <= masterInfo.width && runtimeInfo.height <= masterInfo.height, `${item.id} runtime exceeds master dimensions`);
  const provenance = await readJson(resolve(root, `game/art-sources/chatgpt/ui/${item.id}/provenance.json`));
  assert(provenance.native4kClaim === false, `${item.id}: processed UI master must not claim native 4K`);
  for (const [pathKey, hashKey] of [['sourceVector','sourceVectorSHA256'],['original','originalSHA256'],['master','masterSHA256'],['runtime','runtimeSHA256']]) {
    const bytes = await readFile(resolve(root, provenance[pathKey]));
    assert(createHash('sha256').update(bytes).digest('hex') === provenance[hashKey], `${item.id}: ${pathKey} provenance mismatch`);
  }
  const original = pngInfo(await readFile(resolve(root, provenance.original));
  assert(original?.width === 1920 && original.height === 1080, `${item.id}: original dimensions mismatch`);
  uiReady++;
}

console.log(`4K production pairing ok: ${adopted} runtime asset(s), ${adoptedCharacters.size} adopted character(s), ${uiReady} UI key visual(s)`);'''
# Deliberately fix the generated snippet's parenthesis before writing.
insert = insert.replace("pngInfo(await readFile(resolve(root, provenance.original));", "pngInfo(await readFile(resolve(root, provenance.original)));")
p.write_text(s.replace(marker, insert), encoding='utf-8')
