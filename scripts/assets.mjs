import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
mkdirSync('public/assets',{recursive:true});
const home='258e1ebf-3eeb-4bc6-95f9-45283e69418e.png',detail='649dda6f-d7be-4658-8304-0f8c0829853a.png';
for(const [file,src,left,top,width,height] of [['logo',home,83,6,280,100],['hero',home,606,100,980,438],['table',home,90,672,467,251],['mirror',home,582,672,440,251],['bowl',home,1047,672,450,251],['table-main',detail,64,152,875,554],['table-grain',detail,337,715,294,145],['table-side',detail,642,715,296,145]])await sharp(src).extract({left,top,width,height}).toFile('public/assets/'+file+'.png');
await sharp('public/assets/logo.png').extract({left:0,top:0,width:80,height:100}).resize(64,80).toFile('public/assets/favicon.png');
