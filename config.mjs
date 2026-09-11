export function readConfig(env=process.env){
  const production=env.NODE_ENV==='production';
  const origin=env.SITE_ORIGIN||'http://localhost:3000';
  let url;
  try{url=new URL(origin)}catch{throw Error('SITE_ORIGIN deve ser uma origem válida, por exemplo https://loja.seudominio.pt');}
  if(!['http:','https:'].includes(url.protocol)||url.origin!==origin)throw Error('SITE_ORIGIN não pode conter caminho, barra final, credenciais ou parâmetros.');
  const secure=env.COOKIE_SECURE===undefined?production:env.COOKIE_SECURE==='true';
  if(production&&(url.protocol!=='https:'||!secure||['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw Error('Em produção, configure SITE_ORIGIN com o domínio HTTPS real e COOKIE_SECURE=true.');
  const hops=Number(env.TRUST_PROXY_HOPS||0);
  if(!Number.isInteger(hops)||hops<0||hops>5)throw Error('TRUST_PROXY_HOPS deve ser um inteiro entre 0 e 5.');
  return {origin,secure,hops,demo:env.ENABLE_DEMO===undefined?!production:env.ENABLE_DEMO==='true'};
}
