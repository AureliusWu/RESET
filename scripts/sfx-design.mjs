// Phase-integrated sweeps, short continuous attacks and bounded, separate tails.
const TAU = 2 * Math.PI;
const designs = ['bell','rewrite','impact','whoosh','shutter','message','door'];
const smooth = x => { const n = Math.max(0, Math.min(1, x)); return n * n * (3 - 2 * n); };
export function validateSfx(config) {
  if (config.schema !== 1 || config.sampleRate !== 32000 || config.peakCeilingDbfs !== -11 || config.cues?.length !== 7) throw Error('Unsupported SFX format/mix ceiling');
  if (config.runtime?.maxVoices !== 2 || config.runtime.gain !== .5 || config.runtime.minIntervalMs !== 80) throw Error('Unsafe SFX runtime budget');
  const ids = new Set();
  for (const c of config.cues) {
    if (!/^sfx-[a-z-]+$/.test(c.id) || ids.has(c.id) || !designs.includes(c.design)) throw Error(`Invalid SFX identity: ${c.id}`);
    ids.add(c.id);
    if (!Number.isFinite(c.duration) || c.duration < .12 || c.duration > 1 || !Number.isFinite(c.attack) || c.attack < .001 || c.attack > .015 || !Number.isFinite(c.decay) || c.decay < 3 || c.decay > 40) throw Error(`Invalid SFX timing: ${c.id}`);
    if (![c.pitch,c.endPitch].every(n=>Number.isFinite(n)&&n>=30&&n<=4000) || !Number.isFinite(c.noise) || c.noise<0 || c.noise>1 || !Number.isFinite(c.pan) || Math.abs(c.pan)>.4 || !Number.isInteger(c.seed)) throw Error(`Invalid SFX layers: ${c.id}`);
  }
}
export function renderSfxCue(cue, config) {
  const rate = config.sampleRate, frames = Math.round(cue.duration * rate), left = new Float64Array(frames), right = new Float64Array(frames);
  let state=cue.seed>>>0, low=0, air=0;
  const sweepPhase = t => TAU * (cue.pitch*t + .5*(cue.endPitch-cue.pitch)/cue.duration*t*t);
  const env = (t,length,attack,decay) => t<=0||t>=length ? 0 : smooth(t/attack)*smooth((length-t)/.045)*Math.exp(-t*decay);
  for(let i=0;i<frames;i++) {
    const t=i/rate, x=t/cue.duration;
    state=(Math.imul(1664525,state)+1013904223)>>>0;
    const white=state/0xffffffff*2-1; low=.82*low+.18*white; air=.96*air+.04*low;
    const band=low-air, phase=sweepPhase(t), e=env(t,cue.duration,cue.attack,cue.decay);
    let value=0;
    if(cue.design==='bell') value=(Math.sin(phase)+.24*Math.sin(phase*1.5)*Math.exp(-t*8)+.08*Math.sin(phase*2.7)*Math.exp(-t*15))*e;
    if(cue.design==='rewrite') value=(.58*Math.sin(phase)+.18*Math.sin(phase*.5)+band*cue.noise)*e + .16*Math.sin(TAU*880*(t-.1))*env(t-.1,cue.duration-.1,.008,10);
    if(cue.design==='impact') value=(Math.sin(phase)+.22*Math.sin(phase*1.8)+low*cue.noise)*e;
    if(cue.design==='whoosh') value=(.18*Math.sin(phase)+band*cue.noise)*e;
    if(cue.design==='shutter') {
      value=(.22*Math.sin(phase)+band*cue.noise)*e;
      value+=(.16*Math.sin(TAU*1200*(t-.045))+band*.25)*env(t-.045,cue.duration-.045,.0025,35);
    }
    if(cue.design==='message') {
      value=.8*Math.sin(TAU*cue.pitch*t)*env(t,cue.duration,cue.attack,13);
      value+=.6*Math.sin(TAU*cue.endPitch*(t-.065))*env(t-.065,cue.duration-.065,.003,12);
    }
    if(cue.design==='door') value=(.58*Math.sin(phase)+.13*Math.sin(phase*2.41)+low*cue.noise)*e;
    const pan=cue.pan*Math.sin(Math.PI*x), angle=(pan+1)*Math.PI/4;
    left[i]=value*Math.cos(angle);right[i]=value*Math.sin(angle);
  }
  // Small room tail; never wrap a one-shot back to its onset.
  const dryL=left.slice(),dryR=right.slice(),delay=Math.round(.026*rate);
  for(let i=delay;i<frames;i++){left[i]+=dryR[i-delay]*.08;right[i]+=dryL[i-delay]*.06;}
  let dcL=0,dcR=0;
  for(let i=0;i<frames;i++){dcL+=left[i];dcR+=right[i];}dcL/=frames;dcR/=frames;
  let peak=0;
  for(let i=0;i<frames;i++) {
    const boundary=smooth(i/(rate*.001))*smooth((frames-1-i)/(rate*.008));
    left[i]=(left[i]-dcL)*boundary;right[i]=(right[i]-dcR)*boundary;
    peak=Math.max(peak,Math.abs(left[i]),Math.abs(right[i]));
  }
  const level=10**(config.peakCeilingDbfs/20)/peak;
  const bytes=Buffer.alloc(44+frames*4);
  bytes.write('RIFF',0);bytes.writeUInt32LE(36+frames*4,4);bytes.write('WAVE',8);bytes.write('fmt ',12);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(2,22);bytes.writeUInt32LE(rate,24);bytes.writeUInt32LE(rate*4,28);bytes.writeUInt16LE(4,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(frames*4,40);
  for(let i=0;i<frames;i++){bytes.writeInt16LE(Math.round(left[i]*level*32767),44+i*4);bytes.writeInt16LE(Math.round(right[i]*level*32767),46+i*4);}
  return {bytes,frames,duration:frames/rate};
}
export function inspectSfx(bytes) {
  const rate=bytes.readUInt32LE(24),frames=bytes.readUInt32LE(40)/4,env=new Float64Array(frames);
  let peak=0,peakFrame=0,step=0,energy=0,dc=[0,0],prev=[0,0];
  for(let i=0;i<frames;i++)for(let c=0;c<2;c++) {
    const v=bytes.readInt16LE(44+i*4+c*2)/32768;
    env[i]=Math.max(env[i],Math.abs(v));energy+=v*v;dc[c]+=v;
    if(Math.abs(v)>peak){peak=Math.abs(v);peakFrame=i;}if(i)step=Math.max(step,Math.abs(v-prev[c]));prev[c]=v;
  }
  let onset=env.findIndex(v=>v>=peak*.1),startPeak=0,endPeak=0;
  for(let i=0;i<Math.min(frames,Math.round(rate*.0005));i++)startPeak=Math.max(startPeak,env[i]);
  for(let i=Math.max(0,frames-Math.round(rate*.003));i<frames;i++)endPeak=Math.max(endPeak,env[i]);
  return {duration:frames/rate,peakDbfs:20*Math.log10(peak),rmsDbfs:10*Math.log10(energy/(frames*2)),peakMs:peakFrame/rate*1000,onsetMs:onset/rate*1000,maxStep:step,startPeak,endPeak,dc:Math.max(...dc.map(v=>Math.abs(v/frames)))};
}
export function sfxViolations(info) {
  const failures=[];
  if(!Object.values(info).every(Number.isFinite))failures.push('invalid/silent signal');
  if(info.onsetMs>15||info.peakMs>90)failures.push('late feedback');
  if(info.peakDbfs>-10.99||info.peakDbfs<-11.1)failures.push('mix ceiling');
  if(info.rmsDbfs<-30||info.rmsDbfs>-16)failures.push('SFX energy');
  if(info.maxStep>.15)failures.push('sample discontinuity');
  if(info.startPeak>.02||info.endPeak>.003)failures.push('unclean one-shot boundary');
  if(info.dc>.001)failures.push('DC offset');
  return failures;
}
