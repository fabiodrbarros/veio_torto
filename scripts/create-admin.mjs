import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { db,passwordHash } from '../db.mjs';
let muted=false;
const output=new Writable({write(chunk,encoding,callback){if(!muted)process.stdout.write(chunk);callback()}});
const rl=createInterface({input:process.stdin,output,terminal:true});
try {const email=(await rl.question('Email do administrador: ')).trim().toLowerCase();process.stdout.write('Palavra-passe (mínimo 12 caracteres, oculta): ');muted=true;const password=await rl.question('');muted=false;process.stdout.write('\n');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<12)throw Error('Email inválido ou palavra-passe demasiado curta.');db.prepare('INSERT INTO admins(email,password) VALUES(?,?)').run(email,passwordHash(password));console.log('Administrador criado. Aceda a /admin.')}catch(e){console.error(e.message);process.exitCode=1}finally{rl.close();db.close()}
