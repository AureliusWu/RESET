// Read the rendered canvas and ordinary HUD; never access or alter combat state.
// A fixed orbit stays inside the echo's ring. React to the visible telegraph,
// and keep moving between attacks so its predicted landing point misses.
export async function defeatEchoWithHeavyAttacks(page){
  let held,up=true,wasRing=false;
  const steer=async key=>{
    if(held===key)return;
    if(held)await page.keyboard.up(held);
    held=key;
    if(held)await page.keyboard.down(held);
  };
  try{
    for(let tick=0;tick<1200;tick++){
      const state=await page.evaluate(()=>{
        const canvas=document.querySelector('.reset-combat canvas');
        if(!canvas)return null;
        const {data,width}=canvas.getContext('2d').getImageData(0,0,960,540);
        let x=0,y=0,n=0;
        for(let row=110;row<450;row++)for(let col=25;col<935;col++){
          const i=(row*width+col)*4;
          if(data[i]===159&&data[i+1]===198&&data[i+2]===220){x+=col;y+=row;n++;}
        }
        const ring=[160,190].some(radius=>{
          let marks=0;
          for(let j=0;j<8;j++){
            const a=j*Math.PI/4,cx=Math.round(760+radius*Math.cos(a)),cy=Math.round(270+radius*Math.sin(a));
            let red=false;
            for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
              const i=((cy+dy)*width+cx+dx)*4;
              if(data[i]>data[i+1]+10&&data[i]>data[i+2]+15)red=true;
            }
            if(red)marks++;
          }
          return marks>=4;
        });
        const hud=document.querySelector('.reset-combat__state').textContent;
        return{position:n>40?{x:x/n,y:y/n}:null,ring,stamina:Number(hud.match(/体力 (\d+)/)?.[1]??0)};
      });
      if(!state)return;
      const {stamina}=state;
      if(state.ring){
        await steer(!state.position||state.position.x>535?'a':undefined);
        if(!wasRing&&stamina>=26)await page.keyboard.press('Space');
      }else if(state.position){
        const p=state.position;
        if(p.x<670)await steer('d');
        else if(p.x>695)await steer('a');
        else{
          if(p.y<=210)up=false;
          if(p.y>=330)up=true;
          await steer(up?'w':'s');
        }
        // Keep a dodge in reserve; heavy-attack spam exhausts the player.
        if(Math.hypot(p.x-760,p.y-270)<108&&stamina>=58)await page.keyboard.press('k');
      }
      wasRing=state.ring;
      await page.waitForTimeout(40);
    }
    throw Error('Echo player did not finish within the real-input budget');
  }finally{await steer(undefined);}
}
