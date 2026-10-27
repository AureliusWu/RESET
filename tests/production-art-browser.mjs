import assert from 'node:assert/strict';
import {IRREVERSIBLE_SCENES} from '../game/runtime/meta.mjs';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function verifyProductionArt({page,project,fixtures,loadFixture,out,pass,captureEdges=true}) {
  const assets=project.assets.filter(a=>a.src.startsWith('assets/4k/runtime/')&&!a.id.startsWith('linwan/'));
  if(!assets.length)return;
  const {createProject}=await import(pathToFileURL(resolve(process.env.RESET_DIST||'dist','lib/index.js')));
  const frames=new Map();
  for(const save of Object.values(fixtures.witnesses)){
    const {session}=createProject(project,'https://reset.test/',{settings:{textDelayMs:0,reducedMotion:true}});
    try{
      session.restore(save);const scene=session.getView().frame.sceneId;
      for(let i=0;i<100;i++){
        const f=session.getView().frame;if(f.sceneId!==scene)break;
        for(const id of [f.stage.portrait,f.stage.background,f.stage.cg])if(id&&!frames.has(id)&&!IRREVERSIBLE_SCENES.includes(f.sceneId)){
          try{frames.set(id,session.save());}catch{/* irreversible art is checked by actual finale traversal */}
        }
        if(!session.next())break;
      }
    }finally{session.dispose();}
  }
  const decoded=await page.evaluate(async assets=>{
    const result=[];
    for(const a of assets){const im=new Image();im.src=new URL('./'+a.src,location.href).href;await im.decode();
      const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);
      let transparent=0,opaque=0;const pixels=ctx.getImageData(0,0,c.width,c.height).data;
      for(let i=3;i<pixels.length;i+=4){if(pixels[i]===0)transparent++;if(pixels[i]===255)opaque++;}
      result.push({id:a.id,src:a.src,width:c.width,height:c.height,transparent,opaque});
    }return result;
  },assets);
  for(const d of decoded){
    const portrait=d.src.includes('/characters/')||d.src.includes('/anomalies/');
    assert.equal(d.width,portrait?1080:1920,d.id);assert.equal(d.height,portrait?1920:1080,d.id);
    if(portrait)assert.ok(d.transparent>0&&d.opaque>0,`actual alpha missing: ${d.id}`);
  }
  const records=[];
  for(const asset of assets.filter(a=>['portrait','background','cg'].includes(a.kind))){
    const witness=frames.get(asset.id),selector=asset.kind==='portrait'?'.vn-portrait':asset.kind==='background'?'.vn-background':'.vn-cg';
    const expectedWidth=asset.kind==='portrait'?1080:1920;
    if(witness){
      await loadFixture(witness);
      await page.waitForFunction(({id,selector,width})=>{const im=document.querySelector(selector);return im?.dataset.asset===id&&im.complete&&im.naturalWidth===width;},{id:asset.id,selector,width:expectedWidth});
      assert.equal(await page.locator(selector).getAttribute('src').then(s=>s.includes(asset.src)),true);
      if(asset.kind!=='portrait'||asset.id.endsWith('/neutral'))await page.screenshot({path:out+'/production-'+asset.id.replaceAll('/','-')+'.png',animations:'disabled'});
      records.push({id:asset.id,verification:'canonical story save'});
    }else{
      await page.evaluate(async({asset,background})=>{
        const {mountGame}=await import('./lib/index.js');const root=document.createElement('div');root.id='__assetQA';root.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#14272e';document.body.append(root);
        const [character,expression]=asset.id.split('/');
        const fixture={schema:1,game:'reset-isolated-art-qa',version:'qa',title:'Isolated art QA',type:'narrative',entry:'qa',stats:{},assets:[asset,...(asset.id===background.id?[]:[background])],stage:{scenes:{qa:{[asset.kind==='portrait'?'portrait':asset.kind]:asset.id}}},scenes:[{id:'qa',title:'Formal expression renderer fixture',character,background:background.id,lines:[{id:'qa-line',speaker:'QA',text:'此差分暂未在剧情使用；独立渲染验收。',expression}],ending:'qa'}]};
        window.__assetQAGame=mountGame(root,fixture,{baseURL:new URL('./',location.href),storage:null,audio:false});window.__assetQAGame.session.configure({textDelayMs:0,reducedMotion:true});
      },{asset,background:project.assets.find(a=>a.kind==='background')});
      try{
        await page.waitForFunction(({id,selector,width})=>{const im=document.querySelector('#__assetQA '+selector);return im?.dataset.asset===id&&im.complete&&im.naturalWidth===width;},{id:asset.id,selector,width:expectedWidth});
        await page.screenshot({path:out+'/fixture-'+asset.id.replaceAll('/','-')+'.png',animations:'disabled'});
      }finally{await page.evaluate(()=>{window.__assetQAGame.dispose();delete window.__assetQAGame;document.getElementById('__assetQA').remove();});}
      records.push({id:asset.id,verification:'isolated packaged renderer fixture; unused in story'});
    }
  }
  await writeFile(out+'/production-art.json',JSON.stringify({decoded,records},null,2)+'\n');
  const viewport=page.viewportSize();
  if(captureEdges&&viewport){
    await page.setViewportSize({width:2160,height:1920});
    try{
      for(const asset of assets.filter(a=>a.src.includes('/characters/')&&a.id.endsWith('/neutral'))){
        await page.evaluate(async src=>{
          const root=document.createElement('div');root.id='__productionEdgeQA';root.style.cssText='position:fixed;inset:0;z-index:2147483647;display:flex;pointer-events:none';
          for(const color of ['#14272e','#dbe3e4']){const panel=document.createElement('div');panel.style.cssText=`width:1080px;height:1920px;flex:none;background:${color}`;const im=new Image(1080,1920);im.src=new URL('./'+src,location.href);panel.append(im);root.append(panel);}
          document.body.append(root);await Promise.all([...root.querySelectorAll('img')].map(im=>im.decode()));
        },asset.src);
        try{await page.screenshot({path:out+'/edges-'+asset.id.replaceAll('/','-')+'.png',animations:'disabled'});}
        finally{await page.evaluate(()=>document.getElementById('__productionEdgeQA').remove());}
      }
    }finally{await page.setViewportSize(viewport);}

    const mobileRecords=[];
    await page.setViewportSize({width:390,height:844});
    try{
      for(const asset of project.assets.filter(a=>a.kind==='portrait'&&a.src.includes('/characters/')&&a.id.endsWith('/neutral'))){
        const witness=frames.get(asset.id) ?? (()=>{
          for(const save of Object.values(fixtures.witnesses)) if(save?.state?.storyVersion&&save?.state?.sceneId) return null;
          return null;
        })();
        if(!witness)continue;
        await loadFixture(witness);
        await page.waitForFunction(id=>{const im=document.querySelector('.vn-portrait');return im?.dataset.asset===id&&im.complete;},asset.id);
        const geometry=await page.evaluate(()=>{
          const portrait=document.querySelector('.vn-portrait')?.getBoundingClientRect();
          const stage=document.querySelector('.vn-stage')?.getBoundingClientRect();
          const reading=document.querySelector('.vn-reading')?.getBoundingClientRect();
          if(!portrait||!stage)return null;
          return {portrait:{x:portrait.x,y:portrait.y,w:portrait.width,h:portrait.height},stage:{x:stage.x,y:stage.y,w:stage.width,h:stage.height},reading:reading?{x:reading.x,y:reading.y,w:reading.width,h:reading.height}:null};
        });
        assert.ok(geometry,`mobile geometry missing: ${asset.id}`);
        const p=geometry.portrait,s=geometry.stage,epsilon=2;
        assert.ok(p.x>=s.x-epsilon&&p.y>=s.y-epsilon,`mobile portrait escapes stage origin: ${asset.id}`);
        assert.ok(p.x+p.w<=s.x+s.w+epsilon&&p.y+p.h<=s.y+s.h+epsilon,`mobile portrait escapes stage bounds: ${asset.id}`);
        await page.screenshot({path:out+'/mobile-production-'+asset.id.replaceAll('/','-')+'.png',animations:'disabled'});
        mobileRecords.push({id:asset.id,geometry});
      }
    }finally{await page.setViewportSize(viewport);}
    await writeFile(out+'/production-art-mobile.json',JSON.stringify(mobileRecords,null,2)+'\n');
    pass(`${mobileRecords.length} neutral character portraits captured in 390x844 canonical gameplay frames without escaping the stage`);
  }
  pass(`${assets.length} adopted production art files decode at runtime dimensions; ${records.length} production images render in story or labelled isolated fixtures`);
}

export async function verifyProductionArtOffline({page,project,pass}){
  const assets=project.assets.filter(a=>a.src.startsWith('assets/4k/runtime/'));
  const missing=await page.evaluate(async assets=>{
    const miss=[];for(const a of assets){const response=await fetch('./'+a.src);if(!response.ok)miss.push(a.id);}return miss;
  },assets);assert.deepEqual(missing,[]);pass(`All ${assets.length} adopted production references fetch successfully while the browser is offline`);
}
