import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
test('Fluxos reais: autenticação, CSRF, peças, fotos, persistência e visibilidade',async()=>{
const dir=await mkdtemp(join(tmpdir(),'veio-torto-test-'));process.env.DATA_DIR=dir;
const {db,passwordHash}=await import('../db.mjs');const password=randomBytes(24).toString('hex');db.prepare('INSERT INTO admins(email,password) VALUES(?,?)').run('qa@example.test',passwordHash(password));db.close();
let server,cookie='',csrf='';const origin='http://localhost:3107';
async function start(){server=spawn(process.execPath,['server.mjs'],{env:{...process.env,DATA_DIR:dir,PORT:'3107',SITE_ORIGIN:origin},stdio:['ignore','pipe','pipe']});await new Promise((ok,no)=>{server.stdout.on('data',d=>{if(String(d).includes('Veio Torto:'))ok()});server.once('error',no);server.once('exit',code=>no(Error('Server exited '+code)))});}
async function req(path,method='GET',body,authenticated=true){const headers={Origin:origin};if(authenticated){headers.Cookie=cookie;headers['x-csrf-token']=csrf}if(body&&!(body instanceof FormData))headers['Content-Type']='application/json';return fetch(origin+path,{method,headers,body:body?(body instanceof FormData?body:JSON.stringify(body)):undefined})}
async function json(path,method,body){const r=await req(path,method,body);assert.equal(r.status,200,await r.clone().text());return r.json()}
async function stop(){const s=server;if(!s||s.exitCode!==null)return;await new Promise(ok=>{s.once('exit',ok);s.kill()})}
try{await start();assert.equal((await req('/api/admin/data','GET',null,false)).status,401);assert.equal((await req('/admin.js','GET',null,false)).status,401);assert.match(await (await req('/admin','GET',null,false)).text(),/autocomplete="current-password"/);assert.equal((await req('/api/login','POST',{email:'qa@example.test',password:'wrong'},false)).status,401);
const login=await req('/api/login','POST',{email:'qa@example.test',password},false);assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly/);csrf=(await json('/api/admin/session')).csrf;const blocked=await fetch(origin+'/api/admin/categories',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json',Origin:origin},body:JSON.stringify({name:'Forbidden'})});assert.equal(blocked.status,403);
await json('/api/admin/categories','POST',{name:'Mesas'});const cat=(await json('/api/admin/data')).categories[0];await json('/api/admin/categories','POST',{id:cat.id,name:'Mesas artesanais'});
let p=await json('/api/admin/products','POST',{reference:'QA-001',name:'Peça de teste',description:'Descrição',category_id:cat.id,price:450,wood:'Oliveira',dimensions:'110 × 72 × 42 cm',finish:'Óleo natural',status:'available',visibility:'draft',featured:true});assert.equal((await req('/api/products/'+p.id,'GET',null,false)).status,404);assert.equal((await (await req('/api/catalog')).json()).products.length,0);
const fd=new FormData(),buffer=await readFile('public/assets/table.png');fd.append('photos',new Blob([buffer],{type:'image/png'}),'a.png');fd.append('photos',new Blob([buffer],{type:'image/png'}),'b.png');p=await json('/api/admin/products/'+p.id+'/photos','POST',fd);assert.equal(p.photos.length,2);assert.equal((await req(p.photos[0],'GET',null,false)).status,404);assert.equal((await req(p.photos[0])).status,200);const reverse=p.photos.map(x=>x.split('/').pop()).reverse();p=await json('/api/admin/products/'+p.id+'/photos','PUT',{ids:reverse});assert.ok(p.photos[0].endsWith(reverse[0]));
const bad=new FormData();bad.append('photos',new Blob(['invalid image'],{type:'image/png'}),'fake.png');assert.equal((await req('/api/admin/products/'+p.id+'/photos','POST',bad)).status,400);
p=await json('/api/admin/products','POST',{...p,visibility:'published',featured:true});assert.equal((await req('/api/products/'+p.id,'GET',null,false)).status,200);assert.equal((await req(p.photos[0],'GET',null,false)).status,200);
await stop();await start();const persisted=await json('/api/products/'+p.id);assert.deepEqual(persisted.photos,p.photos);assert.equal((await req(p.photos[0],'GET',null,false)).status,200);assert.equal((await json('/api/admin/data')).products[0].name,'Peça de teste');
for(const status of ['reserved','sold','available']){p=await json('/api/admin/products','POST',{...p,status,featured:true});assert.equal((await json('/api/products/'+p.id)).status,status)}
p=await json('/api/admin/products','POST',{...p,visibility:'hidden',featured:true});assert.equal((await req('/api/products/'+p.id,'GET',null,false)).status,404);assert.equal((await req(p.photos[0],'GET',null,false)).status,404);assert.equal((await json('/api/catalog')).products.length,0);
assert.equal((await req('/api/admin/settings','PUT',{whatsapp:'123',email:'',phone:'',address:'',artisan:''})).status,400);await json('/api/admin/settings','PUT',{whatsapp:'',email:'',phone:'',address:'',artisan:'Texto confirmado'});
const removed=p.photos[0];p=await json('/api/admin/products/'+p.id+'/photos/'+reverse[0],'DELETE');assert.equal(p.photos.length,1);assert.equal((await req(removed)).status,404);await json('/api/admin/products/'+p.id,'DELETE');assert.equal((await json('/api/admin/data')).products.length,0);await json('/api/admin/logout','POST');assert.equal((await req('/api/admin/data')).status,401);
}finally{await stop();await rm(dir,{recursive:true,force:true})}
});
