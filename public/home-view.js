// Presentation only: products and filters remain owned by app.js.
const arrow='<svg class="icon" aria-hidden="true" focusable="false"><use href="/icons.svg#external"></use></svg>';
export function homeView({settings,categories,base,esc}){
  return `<section class="intro" aria-labelledby="intro-title">
    <div class="intro-main"><div class="intro-copy">
      <p class="eyebrow">ARTESANATO EM MADEIRA DE OLIVEIRA</p>
      <h1 id="intro-title">A beleza está<br>no que é único.</h1>
      <p class="intro-description">Respeitamos o veio. Seguimos a forma. Criamos à mão.</p>
      <a class="button intro-button" href="#colecao">Ver peças disponíveis ${arrow}</a>
    </div><img class="intro-symbol" src="/assets/brand-symbol.png" alt="" aria-hidden="true"></div>
    <div class="intro-strip"><span>VEIO TORTO · ARTESANATO FERNANDES</span><span>Madeira de oliveira. Peças únicas.</span><a href="#colecao">Continuar <span class="continue-arrow" aria-hidden="true">↓</span></a></div>
  </section>
  <section id="colecao" class="collection home-collection" aria-labelledby="collection-title"><div class="collection-inner">
    <div class="section-title"><div><p class="eyebrow">A COLEÇÃO</p><h2 id="collection-title">Cada peça, uma presença.</h2></div><a class="underlined" href="${base}">Ver catálogo completo ${arrow}</a></div>
    <div class="filters"><div class="tabs" aria-label="Categorias"><button class="active" data-category="" aria-pressed="true">Todas</button>${categories.map(c=>`<button data-category="${c.id}" aria-pressed="false">${esc(c.name)}</button>`).join('')}</div></div>
    <div id="results"></div>
  </div></section>
  <section id="artesao" class="artisan-section" aria-labelledby="artisan-title">
    <figure class="artisan-portrait"><img src="/assets/artisan-reference.webp" alt="Retrato do artesão fornecido na referência visual" width="211" height="252" loading="lazy"><figcaption class="eyebrow">O ARTESÃO</figcaption></figure>
    <div class="artisan-copy"><h2 id="artisan-title">É pelas mãos que<br>a madeira ganha vida.</h2><p>Trabalho cada peça a partir daquilo que a madeira me oferece:<br class="desktop-break"> os veios, os nós e as formas que o tempo deixou.</p>
    <details class="artisan-details"><summary>Conhecer o artesão ${arrow}</summary><p>${esc(settings.artisan||'Veio Torto — Artesanato Fernandes trabalha peças únicas de madeira de oliveira, preservando os veios, as cavidades e os contornos naturais.')}</p></details></div>
  </section>`;
}
export function footerView({settings,generic,esc}){
  return `<div class="footer-main"><span class="footer-brand">VEIO TORTO · ARTESANATO FERNANDES</span><nav aria-label="Navegação do rodapé"><a href="/pecas">Peças</a><span aria-hidden="true">·</span><a href="/#artesao">O artesão</a><span aria-hidden="true">·</span><a href="/#contactos">Contactos</a></nav>${generic?`<a href="${esc(generic)}" target="_blank" rel="noopener noreferrer">WhatsApp ${arrow}</a>`:'<span>Contactos disponíveis em breve.</span>'}</div>
  <div class="footer-details">${settings.email?`<a href="mailto:${esc(settings.email)}">${esc(settings.email)}</a>`:''}${settings.phone?`<span>${esc(settings.phone)}</span>`:''}${settings.address?`<span>${esc(settings.address)}</span>`:''}<a class="admin-access" href="/admin">Área do artesão</a></div>`;
}
