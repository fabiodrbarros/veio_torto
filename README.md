# Veio Torto — Artesanato Fernandes

**VPS + Cloudflare:** consulte [VPS.md](VPS.md) para Docker Compose, túnel existente, administrador, backups e atualizações.

Site local funcional em português de Portugal. Node.js 24, Express, SQLite e fotografias no disco. Sem carrinho, pagamentos, serviços externos ou dependência de armazenamento do navegador.

## Iniciar

Na pasta do projeto, com Node.js 24 ou superior:

```powershell
npm ci
Copy-Item .env.example .env
npm run admin:create
npm start
```

Abra http://localhost:3000. A administração está em http://localhost:3000/admin. O comando `admin:create` pede email e uma palavra-passe de pelo menos 12 caracteres, sem a mostrar. Não existe conta nem palavra-passe predefinida. Pode executar o comando novamente para criar outro administrador. Guarde a palavra-passe num gestor de palavras-passe.

Para desenvolvimento com reinício automático: `npm run dev`.

## Configuração

| Variável | Valor inicial | Função |
| --- | --- | --- |
| HOST | 127.0.0.1 | Apenas acesso local |
| PORT | 3000 | Porta do servidor |
| SITE_ORIGIN | http://localhost:3000 | Origem exata autorizada para login e alterações; abra sempre este endereço |
| DATA_DIR | ./data | Diretório persistente, pode ser absoluto e exterior ao código |
| COOKIE_SECURE | false | Mudar para true se futuramente usar HTTPS |

O número de WhatsApp configura-se em **Definições**, com `+` e indicativo internacional. Não há número fictício. Vazio desativa encomendas. Configuram-se também email, telefone, morada e apresentação do artesão. Os botões só abrem a conversa com texto preenchido; não enviam mensagens nem alteram o estado das peças.

## Catálogo e fotografias

A base de dados começa vazia. Crie categorias e peças na administração. Guarde a nova peça, carregue fotografias e escolha “Publicada” para aparecer no catálogo. “Destacar” controla a página inicial. Rascunhos e peças ocultas não aparecem na API pública, nem as suas fotografias ficam acessíveis sem sessão.

JPEG, PNG e WebP, até 8 MB por imagem e 12 imagens por peça. O servidor descodifica e converte as imagens para WebP, limita as dimensões e remove metadados. A estrela torna a imagem principal; a seta muda a ordem; o × remove a fotografia. Estas operações são guardadas imediatamente. O botão Cancelar fecha os campos por guardar; não desfaz operações de fotografias já concluídas.

`data/store.sqlite` e `data/uploads/` contêm os dados reais. Atualizar o código não os elimina. Faça cópias de segurança da pasta `data` **com o servidor parado**, incluindo a base de dados e os uploads em conjunto. Para restaurar, pare o servidor e reponha essa pasta. Nunca coloque `data`, `.env` ou cópias de segurança numa pasta pública do servidor. Não apagar a pasta de dados ao atualizar.

## Demonstração separada

http://localhost:3000/demonstracao apresenta os exemplos das referências com aviso explícito e encomendas desativadas. Não insere produtos na loja. As imagens em `public/assets` são recortes das imagens fornecidas, não fotografias originais. O logótipo é o desenho fornecido, recortado sem redesenho; a resolução é provisória. A imagem principal na página inicial está identificada como referência.

Para remover a demonstração, remova os dados em `public/demo.js`, o respetivo carregamento em `public/app.js`, as rotas `/demonstracao` em `server.mjs` e a ligação em `private/admin.html`. Substitua a imagem principal e o logótipo pelos ficheiros finais em `public/assets` e retire a legenda da imagem de referência quando apropriado.

## Segurança

Palavras-passe com scrypt e salt aleatório; sessões aleatórias guardadas como hash na base de dados, duração de oito horas, cookie HttpOnly e SameSite=Strict. Autorização em todas as rotas administrativas, origem e token CSRF em alterações, limite de tentativas no login, consultas parametrizadas e validação no servidor. As imagens privadas são servidas com controlo de acesso, nunca por um diretório estático público. O servidor liga apenas à interface local por defeito.

## Verificação

```powershell
npm test
npm audit
```

Os testes usam uma pasta temporária isolada e verificam autenticação, bloqueio administrativo, CSRF, criação/edição/estados/publicação/ocultação/eliminação, upload inválido, ordenação, proteção de imagens e persistência após reiniciar o servidor. Não modificam o catálogo real.

Para revisão manual isolada da administração, `node scripts/qa-server.mjs` abre a porta 3001 com dados em `test-data` e mostra credenciais aleatórias temporárias. Não usar essa conta no catálogo real. Pode apagar `test-data` com esse servidor parado.

## Dados reais ainda necessários

- Logótipo aprovado em ficheiro independente, idealmente transparente e de alta resolução.
- Fotografias originais, referências, descrições, medidas, preços e estados das peças reais.
- Número de WhatsApp e restantes contactos a apresentar.
- Texto aprovado sobre o artesão, caso se pretenda substituir a descrição factual da marca.

Não foi feita publicação nem deploy.
