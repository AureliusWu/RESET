import assert from 'node:assert/strict';

export async function verifyPlayerExperience({browser,page,base,fixtures,project,out,pass}) {
  const line=()=>page.locator('.vn-engine').getAttribute('data-line');
  const loads=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('reset:meta:v1')).loads);
  const before={line:await line(),loads:await loads()};
  await page.locator('[data-reset-control=slots]').click();
  await page.locator('[data-slot="1"] [data-slot-action=load]').click();
  await page.getByRole('button',{name:'取消',exact:true}).click();
  assert.equal(await line(),before.line);assert.equal(await loads(),before.loads);
  await page.locator('[data-slot="1"] [data-slot-action=load]').click();
  const original=await page.evaluate(()=>{
    const raw=localStorage.getItem('reset:slots:v1'), book=JSON.parse(raw);
    book.slots.find(s=>s.id===1).title='A concurrent window changed this slot';
    localStorage.setItem('reset:slots:v1',JSON.stringify(book));return raw;
  });
  await page.locator('[data-reset-confirm]').click();
  assert.match(await page.locator('.reset-note').innerText(),/其他窗口/);
  assert.equal(await line(),before.line);assert.equal(await loads(),before.loads);
  await page.evaluate(raw=>localStorage.setItem('reset:slots:v1',raw),original);
  await page.keyboard.press('Escape');
  pass('Manual-load cancellation and stale confirmation preserve the active paragraph and Meta');

  const longest=project.scenes.filter(s=>fixtures.witnesses[s.id]).flatMap(scene=>scene.lines.map((line,index)=>({scene,index,length:line.text.length}))).sort((a,b)=>b.length-a.length)[0];
  for(const [width,height] of [[320,568],[360,640],[390,844],[844,390]]){
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:3,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'});
    await context.addInitScript(()=>localStorage.setItem('vn-engine:reset:settings',JSON.stringify({textDelayMs:0,reducedMotion:true,music:false,soundEffects:false})));
    const mobile=await context.newPage();const errors=[];mobile.on('pageerror',e=>errors.push(e.message));
    try{
      await mobile.goto(base);await mobile.locator('.vn-engine').waitFor();
      const title=mobile.locator('.reset-title-gate');await title.waitFor({state:'visible'});
      const enter=mobile.locator('[data-reset-enter]');const enterRect=await enter.boundingBox();
      assert.ok(enterRect&&enterRect.height>=44&&enterRect.x>=0&&enterRect.x+enterRect.width<=width,'Title enter control must be a visible mobile touch target');
      await mobile.screenshot({path:`${out}/android-${width}x${height}-title.png`,fullPage:true});
      await enter.tap();await title.waitFor({state:'detached'});
      const load=async save=>{
        await mobile.locator('[data-control=settings]').click();
        await mobile.locator('input[type=file]').setInputFiles({name:'route.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(save))});
        await mobile.locator('.vn-modal').waitFor({state:'hidden'});
      };
      const advanceUntil=async(predicate,label,max=300)=>{
        for(let n=0;n<max;n++){
          if(await predicate())return n;
          await mobile.locator('[data-control=next]').click();
        }
        assert.fail(`Could not reach ${label} within ${max} dialogue advances`);
      };
      await load(fixtures.witnesses[longest.scene.id]);
      for(let n=0;n<longest.index;n++)await mobile.locator('[data-control=next]').click();
      assert.equal(await mobile.locator('.vn-text').innerText(),longest.scene.lines[longest.index].text);
      assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight));
      const sizes=await mobile.locator('.reset-toolbar-controls button').evaluateAll(nodes=>nodes.filter(n=>!n.hidden).map(n=>n.getBoundingClientRect().height));
      assert.ok(sizes.every(size=>size>=44),'Every touch toolbar target must be at least 44px tall');
      await load(fixtures.witnesses.route_focus_choice);
      await advanceUntil(async()=>await mobile.locator('.vn-actions [data-action]').count()===6,'six route choices');
      const options=mobile.locator('.vn-actions [data-action]');assert.equal(await options.count(),6);
      for(const option of await options.all()){
        await option.scrollIntoViewIfNeeded();
        const rect=await option.boundingBox();assert.ok(rect.height>=44&&rect.x>=0&&rect.x+rect.width<=width);
      }
      await mobile.screenshot({path:`${out}/android-${width}x${height}-choices.png`,fullPage:true});
      await mobile.locator('[data-reset-control=slots]').click();await mobile.locator('[data-slot="6"]').scrollIntoViewIfNeeded();
      const close=mobile.getByRole('button',{name:'关闭',exact:true});
      const closeRect=await close.boundingBox();assert.ok(closeRect.y>=0&&closeRect.y+closeRect.height<=height);
      assert.match(await mobile.locator('.reset-current-position').innerText(),/第 4 章/);
      await mobile.screenshot({path:`${out}/android-${width}x${height}-slots.png`,fullPage:true});await close.tap();
      const cgScene=project.scenes.find(s=>s.cg==='letter-1842-cg');await load(fixtures.witnesses[cgScene.id]);
      await advanceUntil(async()=>await mobile.locator('.vn-cg').getAttribute('data-asset')==='letter-1842-cg','letter 18:42 CG');
      await mobile.locator('[data-reset-control=collection]').tap();await mobile.locator('[data-cg=letter-1842-cg]').tap();
      await mobile.locator('.reset-cg-full').waitFor({state:'visible'});
      await mobile.getByRole('button',{name:'返回图鉴',exact:true}).tap();
      assert.equal(await mobile.locator('[data-cg=true-end-riverside-cg]').isDisabled(),true);
      await mobile.getByRole('button',{name:'关闭',exact:true}).tap();
      if(width===360||width===844){
        await load(fixtures.combat.faceless_first);await mobile.locator('.reset-combat canvas').waitFor();
        if(await mobile.locator('[data-combat-resume]').isVisible())await mobile.locator('[data-combat-resume]').click();
        const canvas=mobile.locator('.reset-combat canvas');
        const center=()=>canvas.evaluate(canvas=>{
          const {data,width}=canvas.getContext('2d').getImageData(0,0,960,540);let x=0,count=0;
          for(let row=100;row<450;row++)for(let col=25;col<935;col++){const i=(row*width+col)*4;if(data[i]===159&&data[i+1]===198&&data[i+2]===220){x+=col;count++;}}
          return count?x/count:null;
        });
        await mobile.waitForTimeout(50);const start=await center();assert.ok(start!==null);
        const movement=await mobile.locator('.reset-combat [data-key=ArrowRight]').boundingBox();
        const cdp=await context.newCDPSession(mobile), point={x:movement.x+movement.width/2,y:movement.y+movement.height/2,id:1};
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await mobile.waitForTimeout(300);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});const moved=await center();assert.ok(moved>start+20);
        await mobile.waitForTimeout(120);assert.ok(Math.abs(await center()-moved)<5,'touch release must stop movement');
        const controls=await mobile.locator('.reset-combat [data-key]').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return{height:r.height,left:r.left,right:r.right,bottom:r.bottom}}));
        assert.ok(controls.every(r=>r.height>=48&&r.left>=0&&r.right<=width&&r.bottom<=height));
        await mobile.locator('.reset-combat [data-key=KeyJ]').tap();
        await mobile.waitForFunction(()=>Number(/体力 (\d+)/.exec(document.querySelector('.reset-combat__state').textContent)?.[1])<100);
        await mobile.waitForTimeout(650);await mobile.locator('.reset-combat [data-key=KeyK]').tap();
        await mobile.locator('.reset-combat [data-key=Space]').tap();await mobile.waitForTimeout(50);assert.ok(await center()<moved-60);
        const rect=await canvas.boundingBox();assert.ok(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width&&rect.y+rect.height<=height);
        await mobile.screenshot({path:`${out}/android-${width}x${height}-combat.png`,fullPage:true});await cdp.detach();
        pass(`Android touch combat ${width}×${height}: native touch hold/release, light/heavy taps, dodge and 48px controls`);
      }
      assert.deepEqual(errors,[]);
      pass(`Android emulation ${width}×${height}: title entry, longest dialogue, six choices, 44px targets, sticky close, slots and touch gallery`);
    }finally{await context.close();}
  }
}
