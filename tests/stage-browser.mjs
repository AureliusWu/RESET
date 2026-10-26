import assert from 'node:assert/strict';

export async function verifyStageBridge({page,fixtures,loadFixture,control,pass}) {
  // Slow only test animations so real Web Animations can be inspected across
  // multiple UI round trips without relying on a 180ms wall-clock race.
  await page.evaluate(()=>{
    window.__qaAnimate=Element.prototype.animate;
    Element.prototype.animate=function(...args){const animation=window.__qaAnimate.apply(this,args);animation.playbackRate=.01;return animation;};
  });
  try {
    await loadFixture(fixtures.witnesses.route_focus_choice);
    const reading=page.locator('.vn-reading');
    await reading.evaluate(node=>{window.__qaReadingAnimation=node.getAnimations()[0];});
    assert.equal(await page.evaluate(()=>window.__qaReadingAnimation?.playState),'running');
    await page.locator('[data-reset-control=collection]').click();
    assert.equal(await page.evaluate(()=>window.__qaReadingAnimation.playState),'paused');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>window.__qaReadingAnimation.playState),'running');
    await loadFixture(fixtures.witnesses.opening??Object.values(fixtures.witnesses)[0]);
    assert.equal(await page.evaluate(()=>window.__qaReadingAnimation.playState),'idle');
    await control('settings').click();await page.getByLabel('减少动态效果',{exact:true}).check();
    assert.equal(await reading.evaluate(node=>node.getAnimations().length),0);
    await page.getByRole('button',{name:'关闭',exact:true}).click();
    await control('settings').click();await page.getByLabel('减少动态效果',{exact:true}).uncheck();
    await page.getByRole('button',{name:'关闭',exact:true}).click();
    pass('Real stage animations survive a paused restore, freeze/resume with archive panels, cancel on the next visit and respect reduced motion');
  } finally {
    await page.evaluate(()=>{Element.prototype.animate=window.__qaAnimate;delete window.__qaAnimate;delete window.__qaReadingAnimation;});
  }
}
