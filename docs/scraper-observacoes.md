# Observações do Pipeline de Scraping

> Última atualização: 17/06/2026 — Execução #5

## Fontes de coleta

| #   | Fonte                    | URL                                                 | Status              | Produtos | Observação                                                                                                 |
| --- | ------------------------ | --------------------------------------------------- | ------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | Amazon BR — Creatina     | `s?k=creatina`                                      | ✅ Funcionando      | 48       | Headers Sec-Ch-Ua ajudaram a bypassar detecção simples                                                     |
| 2   | Amazon BR — Whey         | `s?k=whey+protein`                                  | ⚠️ Intermitente     | 0-48     | Já funcionou, mas quebrou após execução consecutiva. Provável CAPTCHA por detecção de padrão de scraping   |
| 3   | Mercado Livre — Creatina | `lista.mercadolivre.com.br/creatina-suplemento`     | ❌ Bloqueado        | 0        | Retorna em <100ms — bloqueio imediato no datacenter (IP de cloud)                                          |
| 4   | Mercado Livre — Whey     | `lista.mercadolivre.com.br/whey-protein-suplemento` | ❌ Bloqueado        | 0        | Mesmo comportamento da fonte #3                                                                            |
| 5   | Growth Supplements       | `gsuplementos.com.br/loja/search`                   | ❌ DOM incompatível | 0        | Página carrega (4.6s) mas seletores CSS genéricos não encontram produtos. DOM é específico do tema da loja |

## Ambiente de execução

- **Runner:** GitHub Actions (`ubuntu-latest`, Node.js 22 via `setup-node`)
- **Comando:** `npx tsx scripts/scraper/index.ts`
- **Timeout:** 15 minutos
- **Agendamento:** Diário 06:00 UTC + Segundas-feiras
- **Secrets:** `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`

## Limitações técnicas encontradas

### 1. Bloqueio por IP de datacenter

- **Afeta:** Amazon (intermitente), Mercado Livre (total)
- **Causa:** GitHub Actions usa IPs de datacenter da Azure (westus). Sites de e-commerce bloqueiam esses IPs por padrão.
- **Possível solução:** Proxies residenciais rotativos (Bright Data, Oxylabs) — custo adicional.

### 2. CAPTCHA / JavaScript Challenge

- **Afeta:** Amazon após múltiplas requisições
- **Causa:** Headers `Sec-Ch-Ua` + `Sec-Fetch` ajudam na primeira execução, mas padrões de scraping são detectados após requisições repetidas.
- **Possível solução:** Maior intervalo entre fontes (30s+), menos produtos por execução, ou Puppeteer com stealth plugin.

### 3. Seletores CSS específicos por site

- **Afeta:** Growth Supplements, fabricantes em geral
- **Causa:** Cada fabricante usa tema/prateleira diferente. Seletores genéricos (`.product-item`, `.vitrine-item`) não cobrem todos.
- **Possível solução:** Extratores por site com seletores mapeados manualmente, ou parsing de JSON-LD (`application/ld+json`).

### 4. Puppeteer inviável no CI

- **Afeta:** Fabricantes com JS pesado
- **Causa:** Chromium ~300MB, cold start lento, timeout de 15 min do Actions.
- **Possível solução:** Usar `@sparticuz/chromium` (lightweight para Lambda/Actions) ou separar scraping pesado em job dedicado.

## Fluxo de dados

```
GitHub Actions (cron / workflow_dispatch)
  └── npx tsx scripts/scraper/index.ts
       ├── Lê fontes_coleta ativas
       ├── Para cada fonte: 3 tentativas com backoff
       ├── Cheerio (HTML estático)
       ├── Upsert em suplementos (ON CONFLICT nome, marca)
       ├── Upsert em detalhes_suplementos
       ├── INSERT em precos_suplementos
       └── Log em logs_coleta (status, duração, mensagem)
```

### Filtro de produtos

- **Lista branca:** 60+ termos de suplementos (whey, creatina, vitamina, omega 3, etc.)
- **Lista negra:** 50+ termos bloqueados (celular, smartphone, fone, camisa, etc.)
- Arquivo: `scripts/scraper/filtro.ts`

### Extração de marca

- **52 marcas brasileiras mapeadas** (Growth, Max, Integral, Black Skull, Dux, etc.)
- Fallback: primeiras 2 palavras do nome do produto
- Arquivo: `scripts/scraper/marcas.ts`

## Melhorias futuras

1. **Proxies residenciais** — essencial para Mercado Livre e estabilidade na Amazon
2. **Extratores por fabricante** — mapear DOM de Growth, Max, Integral, Black Skull individualmente
3. **Parsing de JSON-LD** — muitos sites de e-commerce embutem dados estruturados (`application/ld+json`) com nome, preço, marca e imagem
4. **Fila de scraping** — trocar execução sequencial por fila com rate limiting inteligente
5. **Health check das fontes** — se uma fonte falhar 3x consecutivas, pausá-la e notificar
6. **Deduplicação de produtos** — produtos iguais de fontes diferentes (ex: mesma Creatina Growth na Amazon e no site da Growth) deveriam ser unificados

## Como disparar manualmente

```bash
# Via GitHub CLI
gh workflow run "Coleta de Suplementos" --repo SamukDantas/trivvo --ref master

# Ou via GitHub Actions UI:
# https://github.com/SamukDantas/trivvo/actions/workflows/scraper.yml
```
