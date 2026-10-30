// Observe the rendered player and use ordinary keys. Circling avoids the echo's
// predicted landing point; standing still and trading hits is timing-sensitive.
export async function circleEchoWithHeavyAttacks(page){
  const waypoints=[{x:820,y:205,key:'d',axis:'x',positive:true},{x:820,y:335,key:'s',axis:'y',positive:true},{x:700,y:335,key:'a',axis:'x',positive:false},{x:700,y:205,key:'w',axis:'y',positive:false}];
  let index=0,held;
  try{
    for(let tick=0;tick<600;tick++){
      if(!await page.locator('.reset-combat').count())return;
      const state=await page.locator('.reset-combat canvas').evaluate(canvas=>{
        const {data,width}=canvas.getContext('2d').getImageData(0,0,960,540);let x=0,y=0,n=0;
        for(let row=120;row<430;row++)for(let col=600;col<900;col++){
          const i=(row*width+col)*4;if(data[i]===159&&data[i+1]===198&&data[i+2]===220){x+=col;y+=row;n++;}
        }
        return n>40?{x:x/n,y:y/n}:null;
      });
      if(state){
        const target=waypoints[index],value=state[target.axis];
        if(target.positive?value>=target[target.axis]:value<=target[target.axis])index=(index+1)%waypoints.length;
        const key=waypoints[index].key;
        if(held!==key){if(held)await page.keyboard.up(held);await page.keyboard.down(key);held=key;}
      }
      await page.keyboard.press('k');await page.waitForTimeout(40);
    }
    throw Error('Echo player did not finish within the real-input budget');
  }finally{if(held)await page.keyboard.up(held);}
}
