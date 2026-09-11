document.querySelector('form').onsubmit=async e=>{
  e.preventDefault();
  const button=e.target.querySelector('button');
  const error=document.querySelector('.error');
  error.textContent='';
  button.disabled=true;
  try{
    const r=await fetch('/api/login',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify(Object.fromEntries(new FormData(e.target)))
    });
    if(!r.ok){
      if(r.status===429){
        const seconds=Number(r.headers.get('Retry-After'));
        const minutes=Number.isFinite(seconds)&&seconds>0?Math.ceil(seconds/60):15;
        throw Error(`Demasiadas tentativas. Tente novamente dentro de ${minutes} ${minutes===1?'minuto':'minutos'}.`);
      }
      const fallback=r.status===403
        ?'O acesso foi recusado. Confirme que o domínio aberto corresponde a SITE_ORIGIN; se corresponder, verifique as regras de acesso da Cloudflare.'
        :r.status===401?'Email ou palavra-passe incorretos.'
        :'Não foi possível iniciar sessão. Tente novamente dentro de instantes.';
      const data=await r.json().catch(()=>null);
      throw Error(data?.error||fallback);
    }
    location.href='/admin';
  }catch(e){
    error.textContent=e instanceof TypeError?'Não foi possível contactar o servidor. Verifique a ligação e tente novamente.':e.message;
  }finally{button.disabled=false}
};
