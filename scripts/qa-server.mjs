import {randomBytes} from 'node:crypto';
process.env.DATA_DIR='./test-data';process.env.PORT='3001';process.env.SITE_ORIGIN='http://localhost:3001';
const {db,passwordHash}=await import('../db.mjs');
const password=randomBytes(18).toString('base64url');db.prepare('DELETE FROM sessions').run();db.prepare('DELETE FROM admins').run();db.prepare('INSERT INTO admins(email,password) VALUES(?,?)').run('qa@example.test',passwordHash(password));
console.log('TESTE LOCAL ISOLADO — email: qa@example.test | password: '+password);
await import('../server.mjs');
