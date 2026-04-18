# Telegram Jobs Bot

Bot para publicar no Telegram:

- vagas de TI no Brasil;
- cursos gratuitos de TI.

O projeto usa Google Jobs e Google Search via SerpApi, aplica deduplicacção, prioriza vagas remotas e júnior, encurta links e publica automaticamente pelo GitHub Actions.

## O que o bot faz

### Fluxo de vagas
- busca vagas no Google Jobs;
- filtra vagas do Brasil;
- prioriza:
  - remoto + júnior/trainee/estágio;
  - remoto;
  - júnior/trainee/estágio;
  - outros modelos e nível profissional;
- evita repostar vagas já publicadas;
- publica no Telegram com botão para candidatura.

### Fluxo de cursos
- busca cursos gratuitos de TI no Google;
- filtra resultados que aparentam ser cursos gratuitos;
- evita repostar cursos já publicados;
- publica no Telegram com botãoo para acessar o curso.

## Estrutura

```text
index.js
src/
  config.js
  main.js
  formatters/
    telegramMessage.js
  parsers/
    courseParser.js
    jobParser.js
  providers/
    freeCourses.js
    googleJobs.js
  services/
    historyStore.js
    telegramPublisher.js
    urlShortener.js
  utils/
    text.js
test/
  *.test.js
.github/workflows/
  bot.yml
  courses.yml
```

## Requisitos

- Node.js 22 ou superior;
- pnpm 10;
- chave da SerpApi;
- bot do Telegram;
- chat id do canal ou grupo.

## Instalação local

```bash
pnpm install
```

## Variáveis de ambiente

### Obrigatórias

- `SERPAPI_KEY`
- `BOT_TOKEN`
- `CHAT_ID`

### Principais

- `CONTENT_TYPE`
  - `jobs`
  - `courses`
- `DRY_RUN`
  - `true`
  - `false`
- `SHORTEN_URLS`
  - `true`
  - `false`

### Fluxo de vagas

- `SEARCH_QUERY`
  - padrão: `desenvolvedor de software brasil`
- `SEARCH_LOCATION`
  - padrão: `Brazil`
- `MAX_JOBS`
  - padrão: `5`

### Fluxo de cursos

- `COURSES_QUERY`
  - padrão: `curso gratuito ti brasil`
- `MAX_COURSES`
  - padrão: `3`

### Deduplicação

- `STATE_FILE`
  - padrão para vagas: `.cache/posted-jobs.json`
  - padrão para cursos: `.cache/posted-courses.json`
- `MAX_HISTORY`
  - padrão: `500`
 
### Canal do Telegram para exemplo
https://t.me/ti_oportunidades

## Como rodar localmente

### Testar vagas sem publicar

```bash
SERPAPI_KEY="sua_chave" CONTENT_TYPE="jobs" DRY_RUN="true" pnpm start
```

### Testar cursos sem publicar

```bash
SERPAPI_KEY="sua_chave" CONTENT_TYPE="courses" DRY_RUN="true" MAX_COURSES="3" pnpm start
```

### Publicar vagas de verdade

```bash
BOT_TOKEN="seu_bot_token" \
CHAT_ID="seu_chat_id" \
SERPAPI_KEY="sua_chave" \
CONTENT_TYPE="jobs" \
pnpm start
```

### Publicar cursos de verdade

```bash
BOT_TOKEN="seu_bot_token" \
CHAT_ID="seu_chat_id" \
SERPAPI_KEY="sua_chave" \
CONTENT_TYPE="courses" \
MAX_COURSES="3" \
pnpm start
```

## Testes

Rodar toda a suíte:

```bash
pnpm test
```

Cobertura atual inclui:

- config;
- parser de vagas;
- parser de cursos;
- provider de vagas;
- provider de cursos;
- deduplicação;
- encurtador de URL;
- formatter de mensagem;
- publisher do Telegram;
- fluxo principal.

## GitHub Actions

### Workflow de vagas

Arquivo: [.github/workflows/bot.yml](/home/alanadias/Documentos/repos/telegram-jobs-bot/.github/workflows/bot.yml:1)

Publica:
- a cada 3 horas
- `CONTENT_TYPE=jobs`

### Workflow de cursos

Arquivo: [.github/workflows/courses.yml](/home/alanadias/Documentos/repos/telegram-jobs-bot/.github/workflows/courses.yml:1)

Publica:
- 1 vez por dia
- `CONTENT_TYPE=courses`
- `MAX_COURSES=3`
- horario configurado para `15:00 UTC`
  - `12:00` em `America/Bahia`

## Secrets no GitHub

Cadastre no repositório:

- `BOT_TOKEN`
- `CHAT_ID`
- `SERPAPI_KEY`

## Como a deduplicação funciona

- vagas e cursos usam históricos separados;
- vagas:
  - `.cache/posted-jobs.json`;
- cursos:
  - `.cache/posted-courses.json`;
- os workflows restauram e salvam esse cache entre execuções;
- o bot registra cada item publicado no histórico;

## Observações

- o projeto usa `pnpm`;
- o runner local pode avisar se seu Node for menor que 22;
- o link de candidatura/curso pode ser encurtado com `is.gd`;
- se o encurtador falhar, o link original é usado.

## Próximas melhorias possíveis

- whitelist de fontes confiáveis para cursos;
- testes de integração com fixtures mais realistas;
- logs mais detalhados por tipo de conteúdo;
- score de relevância para vagas e cursos.
