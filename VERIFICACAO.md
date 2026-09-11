# Verificação local

- `npm test`: quatro testes aprovados, com verificações de autenticação, CSRF, estados, publicação, ocultação, eliminação, uploads, ordenação e persistência após reinício do servidor; inclui configuração de produção, cookies Secure, healthcheck, cache, demonstração desativada e limite por visitante atrás do proxy.
- `npm audit --omit=dev`: zero vulnerabilidades conhecidas reportadas.
- Navegador: página inicial e detalhe comparados com as referências em desktop 1586 × 992 e telemóvel 390 × 844; revisão adicional de tablet a 820 × 1180, sem deslocação horizontal.
- Navegador: filtro Espelhos, troca de fotografia, login real, criação de peça, carregamento de duas imagens, troca da principal e publicação confirmados num ambiente isolado. Corrigidos o posicionamento do painel de edição, o alinhamento da administração e a apresentação do upload.
- Mensagem de WhatsApp: nome, referência, preço, ligação e pedido de condições verificados sem configurar um número fictício e sem enviar mensagens.
- Catálogo real confirmado vazio, contactos por preencher e sem administrador predefinido. O servidor de teste foi desligado.

As imagens finais e os dados reais continuam por fornecer. Os recortes servem de referências visuais e estão identificados como demonstração. Não foi feito deploy.

## Preparação da VPS

- `docker compose --env-file .env.vps.example config --quiet`: configuração válida.
- Scripts Bash verificados sintaticamente; ficheiros de deploy com finais de linha Linux.
- Pacote de transferência criado sem base de dados, uploads reais, `.env`, credenciais ou `node_modules`.
- Docker CLI disponível, mas Docker Engine local desligado: a imagem Linux não foi construída nem executada aqui. Confirme o build na VPS com o comando documentado em `VPS.md`.
- Não foi feita ligação SSH à VPS nem alteração do túnel Cloudflare.
