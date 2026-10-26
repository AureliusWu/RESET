import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const formal = ['neutral','smile','worried','surprised','serious'];
const derivatives = ['base','normal',...formal,'sad'];
const src = expression => `assets/4k/runtime/characters/linwan/${expression}.webp`;

// Shared by the extracted Web ZIP and the actual Windows WebView2 process.
// Save imports below are labelled fixtures; the first appearance uses only UI.
export async function verifyLinwanArt({page,project,fixtures,loadFixture,control,out,pass,viewports=true}) {
  const failures=[], requested=[];
  const failed = request => failures.push(request.url());
  const response = response => { if(response.status()>=400)failures.push(`${response.status()} ${response.url()}`); };
  const request = request => { if(/linwan/.test(request.url()))requested.push(request.url()); };
  page.on('requestfailed',failed);page.on('response',response);page.on('request',request);
  const portrait=page.locator('.vn-portrait');
  const ready=async expression=>{
    await page.waitForFunction(({id,path})=>{
      const im=document.querySelector('.vn-portrait');
      return im?.dataset.asset===id&&im.complete&&im.naturalWidth===1080&&im.naturalHeight===1920&&new URL(im.currentSrc).pathname.endsWith('/'+path);
    },{id:`linwan/${expression}`,path:src(expression)});
    assert.equal(await portrait.isVisible(),true);
  };
  const frameSaves={};
  // Find genuine expression frames by replaying valid witnessed saves in the
  // packaged engine, never by assigning DOM src or fabricating story scenes.
  const {createProject}=await import(pathToFileURL(resolve(process.env.RESET_DIST||'dist','lib/index.js')));
  for(const save of Object.values(fixtures.witnesses)) {
    const {session}=createProject(project,'https://reset.test/',{settings:{textDelayMs:0,reducedMotion:true}});
    try {
      session.restore(save);const scene=session.getView().frame.sceneId;
      for(let count=0;count<100;count++) {
        const frame=session.getView().frame;
        if(frame.sceneId!==scene)break;
        if(frame.stage.portrait?.startsWith('linwan/'))frameSaves[frame.stage.portrait]??=session.save();
        if(!session.next())break;
      }
    } finally { session.dispose(); }
  }
  const originalViewport=page.viewportSize();
  try {
    await control('restart').click();
    for(let count=0;count<20&&!await page.locator('[data-action=watch_linwan]').count();count++)await control('next').click();
    await page.locator('[data-action=watch_linwan]').click();await ready('neutral');
    await page.screenshot({path:out+'/linwan-first-appearance.png',fullPage:true});
    pass('Lin Wan first appears from New Game through canonical UI choices and decodes the new 1080x1920 WebP');
    for(const expression of formal) {
      assert.ok(frameSaves[`linwan/${expression}`],`missing real story frame for ${expression}`);
      await loadFixture(frameSaves[`linwan/${expression}`]);await ready(expression);
      await page.screenshot({path:out+`/linwan-${expression}.png`,fullPage:true});
    }
    pass('All five stable Lin Wan asset IDs display their new WebP in real story frames without SVG/old portrait fallback');
    if(viewports) {
      await loadFixture(frameSaves['linwan/neutral']);await ready('neutral');
      const sizes=[[390,844],[844,390],[800,600],[1920,1080],[3840,2160]], layout=[];
      for(const [width,height] of sizes) {
        await page.setViewportSize({width,height});
        const metrics=await portrait.evaluate(im=>{
          const p=im.getBoundingClientRect(),s=document.querySelector('.vn-stage').getBoundingClientRect(),r=document.querySelector('.vn-reading').getBoundingClientRect();
          return {portrait:{x:p.x,y:p.y,width:p.width,height:p.height},stage:{x:s.x,y:s.y,width:s.width,height:s.height},reading:{x:r.x,y:r.y,width:r.width,height:r.height},overflow:document.documentElement.scrollWidth>innerWidth};
        });
        assert.equal(metrics.overflow,false);assert.ok(metrics.portrait.width>0&&metrics.portrait.height>0);
        assert.ok(metrics.portrait.x>=metrics.stage.x-1&&metrics.portrait.x+metrics.portrait.width<=metrics.stage.x+metrics.stage.width+1,'portrait outside stage');
        await page.screenshot({path:out+`/linwan-${width}x${height}.png`,fullPage:true});layout.push({width,height,...metrics});
      }
      await writeFile(out+'/linwan-layout.json',JSON.stringify(layout,null,2)+'\n');
      pass('Lin Wan renders in 390x844, 844x390, 800x600, 1920x1080 and 3840x2160 browser viewports without horizontal overflow');
      if(originalViewport)await page.setViewportSize(originalViewport);
    }
    // Observe real animation objects while a canonical dialogue line changes
    // neutral to worried, and compare with the reduced-motion setting.
    await control('settings').click();await page.getByLabel('减少动态效果',{exact:true}).uncheck();await page.getByRole('button',{name:'关闭',exact:true}).click();
    await page.evaluate(()=>{
      window.__linwanAnimationCalls=[];window.__linwanAnimate=Element.prototype.animate;
      Element.prototype.animate=function(...args){if(this.matches('.vn-portrait'))window.__linwanAnimationCalls.push(args);return window.__linwanAnimate.apply(this,args);};
    });
    try {
      await loadFixture(fixtures.witnesses.linwan_shadow);await ready('neutral');
      for(let count=0;count<3;count++)await control('next').click();await ready('worried');
      assert.ok(await page.evaluate(()=>window.__linwanAnimationCalls.length>0));
    } finally {
      await page.evaluate(()=>{Element.prototype.animate=window.__linwanAnimate;delete window.__linwanAnimate;delete window.__linwanAnimationCalls;});
    }
    await control('settings').click();await page.getByLabel('减少动态效果',{exact:true}).check();await page.getByRole('button',{name:'关闭',exact:true}).click();
    pass('Canonical Lin Wan expression transition plays real stage animation and supports reduced motion');
    const decoded=await page.evaluate(async expressions=>{
      const result=[];
      for(const expression of expressions){
        const im=new Image();im.src=`./assets/4k/runtime/characters/linwan/${expression}.webp`;await im.decode();
        const canvas=document.createElement('canvas');canvas.width=im.naturalWidth;canvas.height=im.naturalHeight;const c=canvas.getContext('2d');c.drawImage(im,0,0);
        const pixels=c.getImageData(0,0,canvas.width,canvas.height).data;
        let transparent=0,opaque=0;for(let i=3;i<pixels.length;i+=4){if(pixels[i]===0)transparent++;if(pixels[i]===255)opaque++;}
        result.push({expression,width:im.naturalWidth,height:im.naturalHeight,transparent,opaque});
      }return result;
    },derivatives);
    for(const im of decoded){assert.equal(im.width,1080);assert.equal(im.height,1920);assert.ok(im.transparent>0&&im.opaque>0);}
    await writeFile(out+'/linwan-decode.json',JSON.stringify({decoded,requested,failures},null,2)+'\n');
    assert.deepEqual(failures,[]);
    assert.ok(requested.every(url=>!url.includes('generated-portraits/')&&!url.endsWith('.svg')));
    pass('All eight installed Lin Wan WebPs decode with real transparent pixels and no failed image request');
  } finally {
    page.off('requestfailed',failed);page.off('response',response);page.off('request',request);
    if(originalViewport&&viewports)await page.setViewportSize(originalViewport);
  }
}

export async function verifyLinwanOffline({page,loadFixture,fixtures,out,pass}) {
  const paths=derivatives.map(src);
  const cachePaths=await page.evaluate(async()=>{
    const registration=await navigator.serviceWorker.ready;
    const keys=(await caches.keys()).filter(key=>key.startsWith('vn-self-reset-v2:'));
    const found=[];for(const key of keys){const cache=await caches.open(key);for(const request of await cache.keys())found.push(new URL(request.url).pathname);}
    return found;
  });
  for(const path of paths)assert.ok(cachePaths.some(url=>url.endsWith('/'+path)),`${path} not in actual service worker cache`);
  for(const path of paths)assert.equal(await page.evaluate(async path=>(await fetch('./'+path)).ok,path),true);
  await loadFixture(fixtures.witnesses.linwan_shadow);
  await page.waitForFunction(()=>{const im=document.querySelector('.vn-portrait');return im?.dataset.asset==='linwan/neutral'&&im.complete&&im.naturalWidth===1080;});
  await page.screenshot({path:out+'/linwan-offline.png',fullPage:true});
  pass('Offline real service-worker cache contains all eight Lin Wan derivatives and displays the new neutral sprite without network');
}
