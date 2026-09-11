import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';

test('Importação cria três exemplos com fotos, configura WhatsApp e preserva edições ao repetir',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'veio-torto-seed-'));
  let db;
  const run=()=>execFileSync(process.execPath,['scripts/seed-examples.mjs'],{env:{...process.env,DATA_DIR:dir},stdio:'pipe'});
  try{
    run();db=new DatabaseSync(join(dir,'store.sqlite'));
    assert.equal(db.prepare('SELECT count(*) AS n FROM products').get().n,3);
    assert.equal(db.prepare("SELECT count(*) AS n FROM products WHERE visibility='published' AND featured=1").get().n,3);
    assert.equal(db.prepare('SELECT count(*) AS n FROM photos').get().n,5);
    assert.equal((await readdir(join(dir,'uploads'))).length,5);
    assert.equal(db.prepare('SELECT whatsapp FROM settings').get().whatsapp,'+351935277180');
    db.prepare("UPDATE products SET name='Edição preservada',price=123 WHERE reference='EX-VT-014'").run();
    db.prepare("UPDATE settings SET artisan='Texto real preservado'").run();
    run();
    assert.equal(db.prepare('SELECT count(*) AS n FROM products').get().n,3);
    assert.equal((await readdir(join(dir,'uploads'))).length,5);
    assert.equal(db.prepare("SELECT name FROM products WHERE reference='EX-VT-014'").get().name,'Edição preservada');
    assert.equal(db.prepare('SELECT artisan FROM settings').get().artisan,'Texto real preservado');
  }finally{db?.close();await rm(dir,{recursive:true,force:true})}
});
