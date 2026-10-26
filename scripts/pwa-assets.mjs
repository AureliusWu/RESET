import {deflateSync} from 'node:zlib';
// Deterministic raster exports of the pinned engine's existing N icon geometry.
// PNG sizes are provided for mobile installers that don't accept SVG icons.
const polygon=[[48,136],[48,56],[70,56],[122,110],[122,56],[144,56],[144,136],[122,136],[70,82],[70,136]];
const crc32=buffer=>{let crc=-1;for(const byte of buffer){crc^=byte;for(let i=0;i<8;i++)crc=crc>>>1^((crc&1)?0xedb88320:0);}return(crc^-1)>>>0;};
function chunk(name,data){const type=Buffer.from(name), length=Buffer.alloc(4), crc=Buffer.alloc(4);length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([type,data])));return Buffer.concat([length,type,data,crc]);}
function inside(x,y){let result=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])result=!result;}return result;}
export function pngIcon(size){
  const pixels=Buffer.alloc((size*4+1)*size), header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const px=(x+.5)*192/size,py=(y+.5)*192/size,i=y*(size*4+1)+1+x*4;
    const cornerX=Math.max(36-px,px-156,0),cornerY=Math.max(36-py,py-156,0);
    if(cornerX*cornerX+cornerY*cornerY>36*36)continue;
    const color=inside(px,py)?[194,235,213]:[29,57,62];pixels.set([...color,255],i);
  }
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
}
