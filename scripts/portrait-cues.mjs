// Work-level presentation policy using the locked engine's existing StageCue API.
// Its portrait cues persist, so EVERY line needs a value, including explicit null.
export function compilePortraitCues(project, policy) {
  const lines = { ...project.stage?.lines };
  for (const scene of project.scenes) {
    const expressions = new Map();
    for (const line of scene.lines) {
      const rule = policy.speakers[line.speaker];
      const character = rule?.mode === 'portrait' ? rule.character : null;
      if (character && line.expression) expressions.set(character, line.expression);
      const cue = lines[line.id] ?? {};
      const portrait = character ? `${character}/${expressions.get(character) ?? 'neutral'}` : null;
      // An authored null is a voice-only / offscreen direction for this line.
      lines[line.id] = { ...cue, portrait: Object.hasOwn(cue, 'portrait') ? cue.portrait : portrait };
    }
  }
  return { ...project, stage: { ...project.stage, lines } };
}
