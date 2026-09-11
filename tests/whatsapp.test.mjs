import {test} from 'node:test';
import assert from 'node:assert/strict';
test('Mensagem de WhatsApp contém peça, referência, preço, ligação e condições',async()=>{
globalThis.document={querySelector:()=>null};globalThis.location={pathname:'/pecas/7',origin:'http://localhost:3000'};
const {whatsapp}=await import('../public/app.js');
const p={id:7,name:'Mesa & Raiz',reference:'VT-014',price:450,status:'available'};
assert.equal(whatsapp({whatsapp:''},p),null);
// Marcador não telefónico: não configura nem contacta qualquer número real ou fictício.
const link=new URL(whatsapp({whatsapp:'+CONTACTO_CONFIGURADO'},p));
assert.equal(link.origin,'https://wa.me');assert.equal(link.pathname,'/CONTACTO_CONFIGURADO');
const text=link.searchParams.get('text');for(const part of ['Mesa & Raiz','VT-014','450','http://localhost:3000/pecas/7','disponibilidade','pagamento','entrega'])assert.ok(text.includes(part));
assert.equal(p.status,'available');assert.ok(whatsapp({whatsapp:'+CONTACTO_CONFIGURADO'},p,true).includes('fotografias'));assert.ok(!new URL(whatsapp({whatsapp:'+CONTACTO_CONFIGURADO'},{...p,price:null})).searchParams.get('text').includes('450'));
});
