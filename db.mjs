import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
export const dataDir=resolve(process.env.DATA_DIR||'data');
mkdirSync(resolve(dataDir,'uploads'),{recursive:true});
export const db=new DatabaseSync(resolve(dataDir,'store.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,admin_id INTEGER NOT NULL,csrf TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY,name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY,reference TEXT UNIQUE NOT NULL,name TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',category_id INTEGER REFERENCES categories(id),price REAL,wood TEXT NOT NULL DEFAULT 'Oliveira',dimensions TEXT NOT NULL DEFAULT '',finish TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'available',visibility TEXT NOT NULL DEFAULT 'draft',featured INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS photos(id TEXT PRIMARY KEY,product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,position INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY CHECK(id=1),whatsapp TEXT NOT NULL DEFAULT '',email TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',address TEXT NOT NULL DEFAULT '',artisan TEXT NOT NULL DEFAULT '');
INSERT OR IGNORE INTO settings(id) VALUES(1);
CREATE INDEX IF NOT EXISTS idx_public_products ON products(visibility,category_id,status);
CREATE INDEX IF NOT EXISTS idx_photos_product ON photos(product_id,position);`);
export const token=()=>randomBytes(32).toString('hex');
export const digest=s=>createHash('sha256').update(s).digest('hex');
export function passwordHash(p){const salt=token();return salt+':'+scryptSync(p,salt,64).toString('hex')}
export function verify(p,hash){const [salt,key]=hash.split(':');return timingSafeEqual(scryptSync(p,salt,64),Buffer.from(key,'hex'))}
export function product(id){const p=db.prepare('SELECT * FROM products WHERE id=?').get(id);return p?{...p,photos:db.prepare('SELECT id FROM photos WHERE product_id=? ORDER BY position,id').all(id).map(x=>'/media/'+x.id)}:null}
export function products(all=false){return db.prepare(`SELECT id FROM products ${all?'':"WHERE visibility='published'"} ORDER BY id DESC`).all().map(x=>product(x.id))}
