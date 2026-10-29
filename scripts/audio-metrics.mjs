// Independent PCM inspection, also used to reject regression fixtures.
export function inspectWav(bytes) {
  if (bytes.length < 44 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE' || bytes.readUInt32LE(4) + 8 !== bytes.length) throw Error('Invalid/truncated RIFF WAVE');
  let format, data;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const kind = bytes.toString('ascii', offset, offset + 4), size = bytes.readUInt32LE(offset + 4), start = offset + 8;
    if (start + size > bytes.length) throw Error('Truncated WAV chunk');
    if (kind === 'fmt ') {
      if (size < 16) throw Error('Invalid WAV format');
      format = { encoding: bytes.readUInt16LE(start), channels: bytes.readUInt16LE(start + 2), sampleRate: bytes.readUInt32LE(start + 4), byteRate: bytes.readUInt32LE(start + 8), blockAlign: bytes.readUInt16LE(start + 12), bits: bytes.readUInt16LE(start + 14) };
    }
    if (kind === 'data') { if (data) throw Error('Duplicate PCM data'); data = { offset: start, size }; }
    offset = start + size + size % 2;
  }
  if (!format || !data || format.encoding !== 1 || format.channels !== 2 || format.bits !== 16 || format.sampleRate !== 32000 || format.blockAlign !== 4 || format.byteRate !== 128000 || !data.size || data.size % 4) throw Error('Expected complete 32 kHz stereo PCM16');
  const frames = data.size / 4, sum = [0, 0], squares = [0, 0], previous = [0, 0], first = [0, 0];
  let peak = 0, maxStep = 0, clippedSamples = 0, silentFrames = 0, longestSilence = 0, difference = 0, variation = 0;
  const at = (frame, channel) => bytes.readInt16LE(data.offset + frame * 4 + channel * 2) / 32768;
  for (let frame = 0; frame < frames; frame++) {
    const l = at(frame, 0), r = at(frame, 1);
    for (const [channel, value] of [l, r].entries()) {
      sum[channel] += value; squares[channel] += value ** 2;
      peak = Math.max(peak, Math.abs(value));
      if (Math.abs(value) >= 32766 / 32768) clippedSamples++;
      if (frame) maxStep = Math.max(maxStep, Math.abs(value - previous[channel]));
      else first[channel] = value;
      previous[channel] = value;
    }
    difference += (l - r) ** 2;
    if (Math.max(Math.abs(l), Math.abs(r)) < 1e-4) { silentFrames++; longestSilence = Math.max(longestSilence, silentFrames); } else silentFrames = 0;
    if (frame < Math.floor(frames / 2)) variation += (l - at(frame + Math.floor(frames / 2), 0)) ** 2 + (r - at(frame + Math.floor(frames / 2), 1)) ** 2;
  }
  const rms = Math.sqrt((squares[0] + squares[1]) / (frames * 2));
  const db = value => value > 0 ? 20 * Math.log10(value) : -Infinity;
  return { ...format, frames, duration: frames / format.sampleRate, bytes: bytes.length, peak, peakDbfs: db(peak), rmsDbfs: db(rms),
    maxStep, seamStep: Math.max(...first.map((v, i) => Math.abs(v - previous[i]))),
    dc: Math.max(...sum.map(v => Math.abs(v / frames))), clippedSamples,
    longestSilence: longestSilence / format.sampleRate, stereoDifferenceRms: Math.sqrt(difference / frames),
    channelBalanceDb: Math.abs(db(Math.sqrt(squares[0] / frames)) - db(Math.sqrt(squares[1] / frames))),
    halfVariation: variation / Math.max(1e-12, squares[0] + squares[1]) };
}
export function musicViolations(info) {
  const errors = [];
  if (info.duration < 35 || info.duration > 65) errors.push('duration outside 16-bar score budget');
  if (info.clippedSamples || info.peakDbfs > -2.99) errors.push('insufficient sample headroom/clipping');
  if (info.rmsDbfs < -20 || info.rmsDbfs > -16.5) errors.push('RMS outside reading mix budget');
  if (info.maxStep > .09) errors.push('internal sample discontinuity');
  if (info.seamStep > .015) errors.push('loop discontinuity');
  if (info.dc > .001) errors.push('DC offset');
  if (info.longestSilence > .1) errors.push('blank gap');
  if (info.stereoDifferenceRms < .001 || info.channelBalanceDb > 2) errors.push('stereo imbalance/collapse');
  if (info.halfVariation < .02) errors.push('A/B sections are effectively identical');
  return errors;
}
