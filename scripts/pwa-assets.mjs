import {deflateSync} from 'node:zlib';

// Deterministic raster export of RESET's own loop/save mark.
// The geometry is resolution independent and sampled directly at each target size.
const crc32=buffer=>{let crc=-1;for(const byte of buffer){crc^=byte;for(let i=0;i<8;i++)crc=crc>>>1^((crc&1)?0xedb88320:0);}return(crc^-1)>>>0;};
function chunk(name,data){const type=Buffer.from(name), length=Buffer.alloc(4), crc=Buffer.alloc(4);length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([type,data])));return Buffer.concat([length,type,data,crc]);}
function tri(px,py,[ax,ay],[bx,by],[cx,cy]){
  const s=(x1,y1,x2,y2,x3,y3)=>(x1-x3)*(y2-y3)-(x2-x3)*(y1-y3);
  const d1=s(px,py,ax,ay,bx,by),d2=s(px,py,bx,by,cx,cy),d3=s(px,py,cx,cy,ax,ay);
  return (d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0) ? false : true;
}
function rounded(px,py){
  const cornerX=Math.max(32-px,px-160,0),cornerY=Math.max(32-py,py-160,0);
  return cornerX*cornerX+cornerY*cornerY<=32*32;
}
function mark(px,py){
  const dx=px-96,dy=py-96,r=Math.hypot(dx,dy);
  const angle=Math.atan2(dy,dx);
  const gap=angle>-1.08&&angle<-.36;
  const ring=!gap&&r>48&&r<61;
  const arrow=tri(px,py,[137,38],[161,57],[133,68]);
  const slot=(px>78&&px<88&&py>70&&py<124)||(px>101&&px<111&&py>70&&py<124);
  const bridge=px>78&&px<111&&py>120&&py<130;
  return ring||arrow||slot||bridge;
}
export function pngIcon(size){
  const pixels=Buffer.alloc((size*4+1)*size), header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const px=(x+.5)*192/size,py=(y+.5)*192/size,i=y*(size*4+1)+1+x*4;
    if(!rounded(px,py))continue;
    const t=py/192;
    const base=[Math.round(15+12*t),Math.round(35+22*t),Math.round(42+23*t)];
    let color=base;
    if(mark(px,py)){
      const glow=Math.max(0,1-Math.abs(Math.hypot(px-96,py-96)-54)/12);
      color=[Math.round(166+35*glow),Math.round(218+23*glow),Math.round(204+30*glow)];
    }else{
      const d=Math.hypot(px-96,py-96);
      if(d<39)color=[Math.round(base[0]+8),Math.round(base[1]+12),Math.round(base[2]+13)];
    }
    pixels.set([...color,255],i);
  }
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
}
