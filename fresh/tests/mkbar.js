const Z=require('/tmp/claude-0/-home-claude/f4d7ebf3-778c-5d50-a163-5dcd8e8292ed/scratchpad/ocr/node_modules/@zxing/library');const fs=require('fs');
const vin=fs.readFileSync('vin.txt','utf8');const w=new Z.Code128Writer();const m=w.encode('I'+vin,Z.BarcodeFormat.CODE_128,900,160,new Map());
const W=m.getWidth(),H=m.getHeight();let s=`P1\n${W+80} ${H+80}\n`;for(let y=-40;y<H+40;y++){let r=[];for(let x=-40;x<W+40;x++)r.push(x>=0&&x<W&&y>=0&&y<H&&m.get(x,y)?1:0);s+=r.join(' ')+'\n';}fs.writeFileSync('vin_bar.pbm',s);
