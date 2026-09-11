import sharp from 'sharp';
import {writeFileSync,unlinkSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {db,dataDir,token} from '../db.mjs';

// Explicit manual import. Never run automatically during startup or updates.
const examples=[
  {reference:'EX-VT-014',name:'Mesa Raiz (exemplo)',category:'Mesas',price:450,status:'available',dimensions:'110 × 72 × 42 cm',photos:['table-main','table-grain','table-side'],description:'Veios marcados, contornos livres e uma cavidade natural.'},
  {reference:'EX-VT-015',name:'Espelho Origem (exemplo)',category:'Espelhos',price:280,status:'available',dimensions:'',photos:['mirror'],description:'Espelho com moldura de madeira de oliveira e contornos naturais.'},
  {reference:'EX-VT-016',name:'Centro de mesa (exemplo)',category:'Decoração',price:95,status:'reserved',dimensions:'',photos:['bowl'],description:'Centro de mesa em madeira de oliveira, com veios e cavidades naturais.'}
];
const createdFiles=[];
let transaction=false;
try{
  db.exec('PRAGMA busy_timeout=10000');
  const images=new Map();
  for(const p of examples)for(const name of p.photos){
    const source=fileURLToPath(new URL(`../public/assets/${name}.png`,import.meta.url));
    images.set(name,await sharp(source).rotate().webp({quality:88}).toBuffer());
  }
  db.exec('BEGIN IMMEDIATE');transaction=true;
  let created=0,skipped=0;
  for(const p of examples){
    // Preserve edits and photographs if the command is run again.
    if(db.prepare('SELECT id FROM products WHERE reference=?').get(p.reference)){skipped++;continue}
    db.prepare('INSERT OR IGNORE INTO categories(name) VALUES(?)').run(p.category);
    const category=db.prepare('SELECT id FROM categories WHERE name=?').get(p.category).id;
    const description='PEÇA DE EXEMPLO — fotografia, preço e medidas ilustrativos; não representam uma oferta de uma peça real. '+p.description;
    const id=Number(db.prepare(`INSERT INTO products(reference,name,description,category_id,price,wood,dimensions,finish,status,visibility,featured) VALUES(?,?,?,?,?,'Oliveira',?,'Óleo natural',?,'published',1)`).run(p.reference,p.name,description,category,p.price,p.dimensions,p.status).lastInsertRowid);
    p.photos.forEach((name,position)=>{
      const photo=token()+'.webp';
      const path=resolve(dataDir,'uploads',photo);
      writeFileSync(path,images.get(name),{flag:'wx'});createdFiles.push(path);
      db.prepare('INSERT INTO photos(id,product_id,position) VALUES(?,?,?)').run(photo,id,position);
    });
    created++;
  }
  db.prepare('UPDATE settings SET whatsapp=? WHERE id=1').run('+351935277180');
  db.exec('COMMIT');transaction=false;
  console.log(`${created} peças de exemplo adicionadas; ${skipped} já existentes preservadas.`);
  console.log('WhatsApp configurado: +351 935 277 180.');
}catch(error){
  if(transaction)db.exec('ROLLBACK');
  for(const path of createdFiles)try{unlinkSync(path)}catch{}
  console.error(error.message);process.exitCode=1;
}finally{db.close()}
