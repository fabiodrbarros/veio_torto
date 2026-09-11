import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {readConfig} from '../config.mjs';

test('Configuração de produção exige origem HTTPS e cookies seguros',()=>{
  assert.throws(()=>readConfig({NODE_ENV:'production'}));
  assert.throws(()=>readConfig({SITE_ORIGIN:'https://example.test/path'}));
  assert.throws(()=>readConfig({SITE_ORIGIN:'https://example.test/'}));
  assert.throws(()=>readConfig({TRUST_PROXY_HOPS:'true'}));
  assert.throws(()=>readConfig({NODE_ENV:'production',SITE_ORIGIN:'https://example.test',COOKIE_SECURE:'false'}));
  assert.deepEqual(readConfig({NODE_ENV:'production',SITE_ORIGIN:'https://example.test',TRUST_PROXY_HOPS:'1'}),{origin:'https://example.test',secure:true,hops:1,demo:false});
});

test('Cloudflare: healthcheck, cache, sessão Secure, demonstração bloqueada e limite por visitante',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'veio-torto-prod-'));process.env.DATA_DIR=dir;
  const {db,passwordHash}=await import('../db.mjs');const password=randomBytes(24).toString('hex');
  db.prepare('INSERT INTO admins(email,password) VALUES(?,?)').run('qa@example.test',passwordHash(password));db.close();
  const server=spawn(process.execPath,['server.mjs'],{env:{...process.env,DATA_DIR:dir,PORT:'3108',NODE_ENV:'production',SITE_ORIGIN:'https://example.test',COOKIE_SECURE:'true',TRUST_PROXY_HOPS:'1',ENABLE_DEMO:'false'},stdio:['ignore','pipe','pipe']});
  const base='http://127.0.0.1:3108';
  try{
    await new Promise((ok,no)=>{server.stdout.on('data',d=>{if(String(d).includes('Veio Torto:'))ok()});server.once('error',no);server.once('exit',code=>no(Error('Exit '+code)))});
    assert.equal((await fetch(base+'/healthz')).status,200);
    assert.equal((await fetch(base+'/api/catalog')).headers.get('cache-control'),'no-store');
    assert.equal((await fetch(base+'/demonstracao')).status,404);
    assert.equal((await fetch(base+'/demo.js')).status,404);
    const wrongOrigin=await fetch(base+'/api/login',{method:'POST',headers:{Origin:'https://www.example.test','Content-Type':'application/json'},body:JSON.stringify({email:'qa@example.test',password})});
    assert.equal(wrongOrigin.status,403);
    assert.match((await wrongOrigin.json()).error,/SITE_ORIGIN/);
    const login=await fetch(base+'/api/login',{method:'POST',headers:{Origin:'https://example.test','Content-Type':'application/json','X-Forwarded-For':'192.0.2.10'},body:JSON.stringify({email:'qa@example.test',password})});
    assert.equal(login.status,200);assert.match(login.headers.get('set-cookie'),/; Secure/);
    const cookie=login.headers.get('set-cookie').split(';')[0];
    assert.equal((await (await fetch(base+'/api/admin/data',{headers:{Cookie:cookie}})).json()).demoEnabled,false);
    for(let i=0;i<16;i++){
      const r=await fetch(base+'/api/login',{method:'POST',headers:{Origin:'https://example.test','Content-Type':'application/json','X-Forwarded-For':'192.0.2.20'},body:JSON.stringify({email:'nobody@example.test',password:'invalid'})});
      assert.equal(r.status,i<15?401:429);
      if(i===15){assert.match((await r.json()).error,/tentativas/);assert.ok(Number(r.headers.get('Retry-After'))>0)}
    }
    const other=await fetch(base+'/api/login',{method:'POST',headers:{Origin:'https://example.test','Content-Type':'application/json','X-Forwarded-For':'192.0.2.21'},body:JSON.stringify({email:'nobody@example.test',password:'invalid'})});
    assert.equal(other.status,401);
  }finally{
    await new Promise(ok=>{if(server.exitCode!==null)return ok();server.once('exit',ok);server.kill()});
    await rm(dir,{recursive:true,force:true});
  }
});
