const toggle=document.querySelector('.menu-toggle');
const navigation=document.querySelector('#public-menu');
const mobile=matchMedia('(max-width: 640px)');
function closeMenu(){toggle.setAttribute('aria-expanded','false');toggle.textContent='Menu';navigation.classList.remove('is-open')}
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'Fechar':'Menu';navigation.classList.toggle('is-open',open)});
navigation.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){closeMenu();toggle.focus()}});
mobile.addEventListener('change',closeMenu);
