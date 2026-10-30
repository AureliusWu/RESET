import assert from 'node:assert/strict';

// Reach scenes by the real entry and authored choices. No scene/state rewriting,
// candidate project override, standalone sprite fixture, or injected game API.
export function supportingRuntimeWitnesses(project, createProject, characters, policy, offscreenLineIds = []) {
  const create = () => createProject(project, 'https://reset-runtime.test/', {
    settings: { textDelayMs: 0, reducedMotion: true }
  }).session;
  const session = create(), branch = create();
  const snapshot = s => { const save = s.save(); save.state.history = []; return save; };
  const queue = [snapshot(session)], visited = new Set(), scenes = new Map(project.scenes.map(s => [s.id, s]));
  const witnesses = {}, sceneEntries = {}, transitions = {}, hiddenLines = [];
  const assets = new Map(project.assets.map(a => [a.id, a]));
  const offscreen = new Set(offscreenLineIds);
  let supportingLines = 0;
  try {
    while (queue.length) {
      session.restore(queue.shift());
      for (let budget = 0; budget < 3000; budget++) {
        const frame = session.getView().frame, key = `${frame.sceneId}/${frame.line}`;
        if (visited.has(key)) break;
        visited.add(key);
        const scene = scenes.get(frame.sceneId), line = scene.lines[frame.line];
        assert.equal(frame.lineId, line.id, key);
        sceneEntries[scene.id] ??= snapshot(session);
        const rule = policy.speakers[line.speaker], cue = project.stage?.lines?.[line.id];
        const hidden = offscreen.has(line.id);
        if (rule?.mode !== 'portrait' || hidden) {
          assert.equal(frame.stage.portrait, null, `${line.id}: ${line.speaker} must clear the preceding portrait`);
          if (rule?.mode === 'portrait') hiddenLines.push({ sceneId: scene.id, lineId: line.id, speaker: line.speaker, save: snapshot(session) });
        } else {
          const previous = scene.lines.slice(0, frame.line + 1).filter(l => l.speaker === line.speaker && l.expression).at(-1);
          const expected = `${rule.character}/${previous?.expression ?? 'neutral'}`;
          assert.equal(frame.stage.portrait, expected, `${line.id}: approved/mapped speaker is hidden or misattributed (noSprite=${Boolean(scene.noSprite)})`);
          assert.equal(assets.get(expected)?.kind, 'portrait', `${line.id}: portrait is absent from catalog`);
        }
        const character = characters.find(c => c.name === line.speaker);
        if (character) {
          supportingLines++;
          if (!hidden && !frame.stage.cg) {
            assert.equal(frame.stage.portrait, `${character.id}/neutral`, line.id);
            witnesses[character.id] ??= { id: character.id, name: character.name, sceneId: scene.id, lineId: line.id, portrait: frame.stage.portrait, save: snapshot(session) };
          }
        }
        // Ordered playback witnesses verify every line, including narration and
        // functional/protagonist turns, in the scenes called out in the handoff.
        if (['morning_after', 'c7_morning', 'c7_after', 'chapter5_gate'].includes(scene.id)) {
          (transitions[scene.id] ??= []).push({ lineId: line.id, speaker: frame.speaker, portrait: frame.stage.portrait ?? null, cg: frame.stage.cg ?? null });
        }
        if (frame.actions.length) {
          for (const action of frame.actions) {
            branch.restore(snapshot(session));
            assert.equal(branch.act(action.id), true, `${scene.id}/${action.id}`);
            queue.push(snapshot(branch));
          }
          break;
        }
        if (!session.next()) break;
        assert.ok(budget < 2999, 'Runtime witness traversal did not settle');
      }
    }
    for (const character of characters) assert.ok(witnesses[character.id], `${character.name}: no canonical runtime-visible witness`);
    return { runtimeVisible: Object.keys(witnesses).length, supportingLines, visitedLines: visited.size, witnesses, sceneEntries, transitions, hiddenLines };
  } finally { session.dispose(); branch.dispose(); }
}
