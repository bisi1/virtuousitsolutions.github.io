const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const folders = [
  path.join(__dirname, '..', 'assets', 'images', 'team'),
  path.join(__dirname, '..', 'assets', 'images', 'clients')
];

async function convert(dir){
  const files = fs.readdirSync(dir).filter(f=>/(jpg|jpeg|png)$/i.test(f));
  for(const f of files){
    const inPath = path.join(dir,f);
    const outPath = path.join(dir, path.parse(f).name + '.webp');
    try{
      await sharp(inPath).resize({width:800}).webp({quality:80}).toFile(outPath);
      console.log('created', outPath);
    }catch(e){
      console.error('failed', inPath, e.message);
    }
  }
}

(async ()=>{
  for(const d of folders){
    if(fs.existsSync(d)){
      await convert(d);
    }
  }
})();

