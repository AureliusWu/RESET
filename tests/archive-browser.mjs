import assert from 'node:assert/strict';

export async function verifyArchive({page,fixtures,project,loadFixture,control,scene,out,pass}) {
  const archive=id=>page.locator(`[data-reset-control=${id}]`), slot=id=>page.locator(`[data-slot="${id}"]`);
  const action=(id,name)=>slot(id).locator(`[data-slot-action=${name}]`);
  const data=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('reset:slots:v1')||'{"slots":[]}').slots);
  const loads=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('reset:meta:v1')).loads);
  const start=await scene(), line=await page.locator('.vn-engine').getAttribute('data-line'), initialLoads=await loads();
  await archive('collection').click();
  assert.equal(await page.locator('.reset-ending[data-unlocked=true]').count(),0);
  assert.equal(await page.locator('.reset-cg-card img').count(),0);
  assert.equal(await page.locator('.reset-cg-card:disabled').count(),11);
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement?.hasAttribute('data-reset-close')),true);
  await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement?.hasAttribute('data-reset-close')),true);
  await page.keyboard.press('Escape');assert.equal(await scene(),start);assert.equal(await loads(),initialLoads);
  pass('Unseen endings and CGs stay hidden; archive focus is trapped and Escape closes without restoring the story');

  const quick=await page.evaluate(()=>localStorage.getItem('vn-engine:reset:save:1'));
  await archive('slots').click();assert.equal(await page.locator('[data-slot]').count(),6);
  await action(1,'save').click();const first=(await data()).find(s=>s.id===1);
  assert.equal(first.save.state.line,fixtures.witnesses[start].state.line);assert.ok(first.excerpt);
  await page.keyboard.press('Escape');await control('next').click();
  await archive('slots').click();await action(2,'save').click();
  const second=(await data()).find(s=>s.id===2);assert.notEqual(second.save.state.line,first.save.state.line);
  await action(1,'save').click();await page.getByRole('button',{name:'取消',exact:true}).click();assert.deepEqual((await data()).find(s=>s.id===1),first);
  await action(1,'save').click();await page.locator('[data-reset-confirm]').click();assert.equal((await data()).find(s=>s.id===1).save.state.line,second.save.state.line);
  await action(2,'delete').click();await page.getByRole('button',{name:'取消',exact:true}).click();assert.ok((await data()).some(s=>s.id===2));
  await action(2,'delete').click();await page.locator('[data-reset-confirm]').click();assert.equal((await data()).some(s=>s.id===2),false);
  for(const id of [2,3,4,5,6])await action(id,'save').click();assert.equal((await data()).length,6);
  await action(6,'delete').click();await page.locator('[data-reset-confirm]').click();
  const before=await data();
  await page.evaluate(()=>{window.__slotSetter=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='reset:slots:v1')throw new DOMException('Full','QuotaExceededError');return window.__slotSetter.call(this,key,value)}});
  try{await action(6,'save').click();assert.match(await page.locator('.reset-note').innerText(),/空间不足/);assert.deepEqual(await data(),before);}
  finally{await page.evaluate(()=>{Storage.prototype.setItem=window.__slotSetter;delete window.__slotSetter});}
  assert.equal(await page.evaluate(()=>localStorage.getItem('vn-engine:reset:save:1')),quick);
  await page.screenshot({path:out+'/slots-desktop.png',fullPage:true});
  await page.keyboard.press('Escape');await control('next').click();const beforeLoad=await loads();
  await archive('slots').click();await action(1,'load').click();await page.locator('[data-reset-confirm]').click();assert.equal(await loads(),beforeLoad+1);
  assert.equal(await page.locator('.vn-engine').getAttribute('data-line'),project.scenes.find(s=>s.id===start).lines[second.save.state.line].id);
  pass('All six manual slots work; overwrite/delete cancel and confirm correctly, quota failures preserve data, and legacy quick-save stays intact');

  const cgScene=project.scenes.find(s=>s.cg==='letter-1842-cg');await loadFixture(fixtures.witnesses[cgScene.id]);
  for(let i=0;i<30;i++){
    if(await page.locator('.vn-cg').getAttribute('data-asset')==='letter-1842-cg')break;
    await control('next').click();
  }
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('reset:meta:v1')).cgs.includes('letter-1842-cg'));
  const position=await page.locator('.vn-engine').getAttribute('data-line'), beforeGallery=await loads();
  await archive('collection').click();await page.locator('[data-cg=letter-1842-cg]').click();
  await page.locator('.reset-cg-full').waitFor({state:'visible'});assert.equal(await page.locator('.reset-cg-full').getAttribute('alt'),'18:42 的来信');
  await page.screenshot({path:out+'/cg-gallery.png',fullPage:true});await page.getByRole('button',{name:'返回图鉴',exact:true}).click();
  assert.equal(await page.locator('[data-cg=true-end-riverside-cg]').isDisabled(),true);
  await page.keyboard.press('Escape');assert.equal(await loads(),beforeGallery);assert.equal(await page.locator('.vn-engine').getAttribute('data-line'),position);
  pass('Actually read CGs unlock and display at full size; unseen finale art stays locked and gallery browsing leaves story and Meta loads intact');

  await loadFixture(fixtures.witnesses.route_focus_choice);
  for(let i=0;i<30&&!await page.locator('.vn-actions [data-action]').count();i++)await control('next').click();
  assert.equal(await page.locator('.vn-actions [data-action]').count(),6,'layout fixture must reach the six-way choice');
  for(const [width,height,label] of [[1280,720,'windows-wide'],[900,900,'windows-square'],[1024,768,'windows-small'],[390,844,'mobile-portrait'],[844,390,'mobile-landscape']]){
    await page.setViewportSize({width,height});
    await page.locator('.vn-actions [data-action]').last().scrollIntoViewIfNeeded();
    const bounds=await page.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right}};return{toolbar:box('.vn-toolbar'),engine:box('.vn-engine'),width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}});
    assert.ok(bounds.toolbar.bottom<=height && bounds.toolbar.top>=0,label+' toolbar must remain visible');
    assert.ok(bounds.engine.bottom<=height && bounds.engine.top>=0,label+' engine must fit');assert.ok(bounds.width<=width,label+' horizontal overflow');assert.ok(bounds.height<=height,label+' page overflow');
    await page.screenshot({path:out+'/'+label+'.png',fullPage:true});
    await archive('slots').click();await slot(5).scrollIntoViewIfNeeded();assert.equal(await action(5,'load').isVisible(),true);await page.keyboard.press('Escape');
  }
  await page.setViewportSize({width:1280,height:900});await loadFixture(fixtures.witnesses[start]);
  assert.equal(await scene(),start);assert.equal(await page.locator('.vn-engine').getAttribute('data-line'),line);
  pass('1024×768 native-size, 390×844 portrait and 844×390 landscape layouts keep toolbar, long choices and scrollable slots usable');
}
