# Instalar na VPS e ligar ao Cloudflare existente

Preparado para coexistir com os containers apresentados. Projeto Docker `veio-torto`, imagem `veio-torto:local`, porta **127.0.0.1:3002**, rede `veio-torto-tunnel` e volume **veio-torto-data**. Não utiliza a porta 3000 do pintoepintos, não cria outro cloudflared e não altera Postgres, Caddy ou os restantes serviços.

## 1. Transferir e configurar

Transfira `veio-torto-vps.tar.gz` para a pasta pessoal na VPS. No seu computador, substitua `IP_DA_VPS` pelo endereço SSH real:

```powershell
scp .\release\veio-torto-vps.tar.gz granivez@IP_DA_VPS:~/
```

Na VPS:

```bash
mkdir -p ~/veio-torto
tar -xzf ~/veio-torto-vps.tar.gz -C ~/veio-torto
cd ~/veio-torto
cp -n .env.vps.example .env.vps
nano .env.vps
```

Defina `SITE_ORIGIN=https://DOMINIO_REAL`, sem barra final e com o hostname que usará no Cloudflare. O valor de exemplo tem de ser substituído. Mantenha `VPS_PORT=3002`, ou escolha outra porta livre. Use sempre `--env-file .env.vps` nos comandos Compose, como abaixo.

```bash
docker compose --env-file .env.vps config --quiet
docker compose --env-file .env.vps up -d --build --wait
docker compose --env-file .env.vps ps
curl --fail http://127.0.0.1:3002/healthz
docker compose --env-file .env.vps exec website node scripts/create-admin.mjs
```

O último comando pede o email de login e uma palavra-passe oculta, com pelo menos 12 caracteres. Não há credenciais predefinidas. O administrador e as peças ficam no volume persistente. Se mudar VPS_PORT, ajuste também os comandos curl.

O HTTP local serve para diagnóstico. O login de produção deve ser feito pelo domínio HTTPS: os cookies são Secure e a proteção de origem recusa outros endereços.

## 2. Ligar o container cloudflared existente

Inspeção sem mostrar tokens:

```bash
docker inspect cloudflared --format '{{.HostConfig.NetworkMode}} {{json .NetworkSettings.Networks}}'
bash deploy/connect-cloudflare.sh
```

O script deteta o modo de rede e indica o endereço a colocar no Cloudflare:

| Rede do cloudflared | Ação | Service URL |
| --- | --- | --- |
| `host` | Usa a porta local da VPS, sem alterar o conector | `http://127.0.0.1:3002` |
| Bridge / rede Docker habitual | Acrescenta a rede dedicada ao conector existente | `http://veio-torto-web:3000` |
| `container:...` ou `none` | Para e informa; precisa de análise específica | Não assumir localhost |

O nome `veio-torto-web` é o alias do serviço na rede partilhada. `localhost` dentro de um cloudflared em bridge refere-se ao próprio conector, não à VPS.

**Persistência da rede:** `docker network connect` mantém a ligação após reiniciar o mesmo container, mas não depois de o recriar. Na stack/Compose que gere o cloudflared, acrescente a rede abaixo às redes **já existentes**, preservando o serviço, comando, token e outras redes:

```yaml
services:
  cloudflared: # use o nome real do serviço na stack existente
    networks:
      # mantenha aqui TODAS as redes anteriores
      - veio_torto

networks:
  veio_torto:
    external: true
    name: veio-torto-tunnel
```

Este fragmento é para integrar, não para substituir a stack. Se o serviço usava a rede `default` implícita, inclua também `default` em `services.cloudflared.networks` e declare `default: {}` no bloco `networks`. Não aplique este fragmento quando o cloudflared usa `network_mode: host`. Se o conector é gerido pelo Portainer, grave a alteração na stack correspondente. Se foi criado com `docker run`, preserve as opções existentes quando o recriar e volte a executar o script de ligação.

## 3. Acrescentar o hostname no Cloudflare

Na conta Cloudflare, abra **Networking → Tunnels**, selecione o túnel existente e vá a **Routes → Add route → Published application**. Algumas contas ainda apresentam o túnel em **Zero Trust → Networks → Connectors**, com **Public Hostnames / Published application routes**.

- Hostname: exatamente o domínio/subdomínio de `SITE_ORIGIN`.
- Service: **HTTP**, usando o endereço indicado pelo script acima.
- Path: vazio, para abranger o site inteiro.
- Mantenha o Host original; não configure um HTTP Host Header diferente do domínio público.
- Acrescente a nova rota, preservando todas as rotas dos outros sites.

O HTTPS do visitante termina na Cloudflare; o conector encaminha HTTP pela rede local/Docker. Não é necessário abrir 3002, 80 ou 443 no firewall para esta aplicação, nem criar um registo A para a porta do container. O fluxo do dashboard cria a associação DNS do hostname ao túnel; se já existir um registo conflitante para o mesmo hostname, reveja esse registo antes de o substituir.

Se o túnel for gerido por um `config.yml` local, acrescente uma regra `hostname`/`service` antes da regra final de fallback, sem substituir as regras anteriores, e crie a rota DNS desse hostname para o túnel. O identificador do túnel e o caminho da configuração existente são necessários para indicar os comandos exatos nesse caso; não é necessário enviar o token.

Não aplique regras de “Cache Everything” ao hostname. `/api/*`, `/admin*` e `/media/*` devem respeitar `Cache-Control: no-store` ou ter uma regra explícita de bypass. Não use a cache para páginas autenticadas. O site conserva autenticação própria; Cloudflare Access é opcional.

Abra `https://DOMINIO_REAL/healthz` e depois `https://DOMINIO_REAL/admin`. Crie uma peça de teste, publique-a e confirme que aparece no catálogo. O WhatsApp configura-se em Definições. As rotas de demonstração estão desativadas nesta configuração de produção; o catálogo começa vazio. A imagem principal e o logótipo continuam a ser os recortes de referência identificados no projeto, até serem fornecidos os originais.

## 4. Atualizações e backups

### Adicionar os três exemplos pedidos e configurar WhatsApp

Após atualizar a imagem, execute uma vez:

```bash
docker compose --env-file .env.vps exec website node scripts/seed-examples.mjs
```

Cria Mesa Raiz, Espelho Origem e Centro de mesa, identificados como exemplos, publicados e destacados, com cinco fotografias no volume. Configura o WhatsApp para **+351 935 277 180**. Os preços e a medida da mesa são os exemplos das referências. Pode editar ou eliminar as peças na administração. Repetir o comando preserva peças existentes com as referências `EX-VT-014`, `EX-VT-015` e `EX-VT-016`, evitando duplicações; repõe o WhatsApp indicado. Não é executado automaticamente ao iniciar ou atualizar.

Faça uma cópia de segurança antes de atualizar:

```bash
cd ~/veio-torto
bash deploy/backup.sh
```

O script para apenas o site Veio Torto enquanto arquiva a base de dados e as fotografias em conjunto, e volta a iniciá-lo mesmo se o backup falhar. Os ficheiros em `backups/` são privados; guarde uma cópia fora da VPS. Não use um arquivo que o script tenha reportado como falhado.

Para atualizar, transfira o novo pacote, extraia-o nesta pasta (o pacote não contém `.env.vps`, dados ou backups), e execute:

```bash
docker compose --env-file .env.vps up -d --build --wait
```

O volume `veio-torto-data` sobrevive à substituição do container e da imagem. **Não execute `docker compose down -v`, nem remova o volume.** Não é preciso `down` para atualizar. Mantenha uma única instância do serviço enquanto usar esta base SQLite.

### Restaurar para um volume novo

Pare apenas `website`, crie um volume novo e extraia um backup verificado para esse volume. Não substitua o volume atual antes de verificar a cópia restaurada. Exemplo, com o caminho real do backup:

```bash
docker compose --env-file .env.vps stop website
docker volume create veio-torto-restaurado
docker run --rm -i --user 0 --entrypoint sh \
  -v veio-torto-restaurado:/restore veio-torto:local \
  -c 'tar -xzf - -C /restore && chown -R node:node /restore' < backups/NOME_REAL.tar.gz
```

Altere apenas `volumes.store.name` em `compose.yaml` para `veio-torto-restaurado`, inicie o serviço e confirme o catálogo, as fotografias e o login. Preserve o volume anterior até concluir essa confirmação.

## Diagnóstico

```bash
docker compose --env-file .env.vps ps
docker compose --env-file .env.vps logs --tail=80 website
curl --fail http://127.0.0.1:3002/healthz
docker inspect cloudflared --format '{{json .NetworkSettings.Networks}}'
```

- **502 no domínio:** confirme Service URL e que o conector partilha a rede, ou usa a rede host.
- **403 ao guardar/login:** abra o hostname HTTPS exato de SITE_ORIGIN; confirme ausência de barra final e de substituição do Host no túnel.
- **Login não mantém sessão:** confirme HTTPS e que não existe cache sobre `/api` ou `/admin`.
- **Container unhealthy:** consulte os logs; pode ser configuração do domínio ou acesso ao volume.
- **Uploads grandes falham:** até 12 imagens de 8 MB por pedido; limites menores configurados na Cloudflare também se aplicam.

## Referências oficiais

- [Cloudflare: publicar uma aplicação no túnel](https://developers.cloudflare.com/tunnel/get-started/)
- [Docker Compose: redes e serviços existentes](https://docs.docker.com/compose/how-tos/networking/)
- [Express: configuração atrás de proxies](https://expressjs.com/en/guide/behind-proxies/)

## Limites desta preparação

O pacote foi preparado no computador local. Não houve acesso SSH à VPS nem alteração da conta Cloudflare. A configuração Compose e os testes do servidor são verificáveis localmente; o build e arranque Linux devem ser confirmados na VPS se o Docker Engine local não estiver disponível.
