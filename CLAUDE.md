# Triagem Clínica — Hemocentro da Paraíba

## O que é
PWA de consulta rápida para a **triagem clínica de doadores de sangue** do
Hemocentro da Paraíba (João Pessoa/PB). Reúne critérios de inaptidão
(temporária/definitiva), tempos de espera por medicamento, vacina, doença,
cirurgia e procedimento odontológico, além de fluxos de aférese, arboviroses e
geração de comprovante/resumo de triagem.
Responsável pelo conteúdo: Dr. Rodrigo Cahuana Chipayo. Revisão atual: **Rev.05 / 16-07-2026** (Portaria de Consolidação GM/MS nº 5/2017, redação da Portaria GM/MS nº 11.685/2026).

## Stack
- **Single file:** `index.html` (HTML + CSS + JS, tudo inline). Sem build, sem dependências externas.
- **Persistência local:** `localStorage`.
- **Sincronização em nuvem:** **JSONBin.io** (REST) — `binId` + `X-Master-Key`.
  Não usa Supabase.
- **Deploy:** GitHub Pages (arquivo estático). Servir localmente com
  `python3 -m http.server` (ver `.claude/launch.json`, porta 8843).
- **PWA:**
  - `manifest` é gerado em runtime via `Blob` + `URL.createObjectURL` (blob:
    URL é permitido para manifest).
  - `service worker` é um **arquivo real: `sw.js`** (blob: URL **não** é
    permitido para SW — registrar de blob lança `TypeError`). `index.html`
    faz `navigator.serviceWorker.register('./sw.js')` no `load`.
  - `sw.js` usa **rede-primeiro para o documento** (online sempre pega a versão
    nova; cache só como fallback offline) e cache-primeiro-com-revalidação para
    os demais GET same-origin. `skipWaiting` + `clients.claim` fazem a versão
    nova assumir na hora. Constante `C='tv6'` — subir essa versão limpa os
    caches antigos no `activate`. Requests cross-origin (JSONBin) não passam
    pelo SW.
  - Deploy tem **2 arquivos**: `index.html` (o app inteiro) e `sw.js`.

## Tema visual
- **Acento:** vermelho `--accent` `#ef4444` / `#dc2626` (identidade "sangue").
- **Fundo escuro (padrão):** `--bg` `#0a1628`, `--bg2` `#0f2040`.
- **Texto:** `--text` `#e2e8f0` | `--text2` `#94a3b8` | `--text3` `#64748b`.
- **Tema claro:** `body.light` (botão 🌙/☀️ `#nb-theme` → `toggleTheme()`).
  Modo noturno automático entre 18h–6h.
- **Alto contraste:** `body.high-contrast` (botão ◐ `#nb-contrast` →
  `toggleContrast()`, no `.hdr-actions` do header). Estado em
  `localStorage['hc']`.

## Arquitetura JS
- `DB` — array de itens de triagem (o "banco"). `DEFAULT_DB` / `DEFAULT_*` — dados de fábrica.
- `PAGINAS_CUSTOM` — overrides editáveis pelo gestor das páginas de critérios (Aférese, Arbo, Odonto, Outras, Gerais, Risco).
- `FAVS` — favoritos; `NOTAS` — anotações por item.
- `isGestor` — sessão de gestor. A senha **não** fica em texto puro: só o
  hash está no código (`PASS_HASH`, topo do `<script>`); `doLogin()` compara
  via `sha256Hex()` (`crypto.subtle`). É ofuscação, não segurança real — a
  proteção de escrita de verdade é a Master Key do JSONBin. Trocar a senha:
  `sha256Hex('nova')` no console e colar em `PASS_HASH`. `logout()` sai.
- `VIEWS` (~linha 1752) — lista de todas as views: `busca, triagem, resumo, pdf, doador, faq, encef, gerais, risco, arbo, odonto, afrese, outras, login, gestor`.
- `SPECIAL_PAGES` (~linha 3618) — subconjunto navegável com setas prev/próxima: `gerais, risco, arbo, odonto, afrese, outras, encef, faq`.
- `setView(v)` — troca de view: alterna `.active` em `#v<view>`, controla o
  realce do `#bottom-nav`, mostra/esconde `#search-area`, seta
  `body.dataset.view` e dispara o `build*()`/`render*()` da tela. Definido
  **uma única vez** na seção VIEW (~linha 1753).
- `renderHome()` / `renderResults()` / `renderFilters()` — tela de busca.
- `goBack()` / `pushHistory()` / `navSpecial(dir)` — histórico de navegação interno.
- `G`-equivalente: o código usa `document.getElementById(...)` direto (sem atalho).

## Navegação
- **Rotas por hash:** cada tela vira `#/<view>` (`routePush()` no `setView`,
  `popstate` volta à view). O botão Voltar do celular/navegador funciona e
  links diretos (`…/#/risco`) abrem a tela. `goBack()` usa `history.back()`.
  O detalhe de um item também empilha um estado (`{sheet:1}`): Voltar fecha.
- **Barra inferior (`#bottom-nav`, 4 abas):** Busca · Triagem · Manual ·
  Aférese. A aba ativa vem do agrupamento em `setView` (`_grp`): páginas de
  critérios/risco/arbo/odonto/outras/encef/faq → **Manual**. A Gestão saiu da
  barra: toque longo (650 ms) no logo (`initLogoLongPress`) ou item "Acesso do
  gestor" na aba Manual.
- **Aba Manual (`#vmanual`, `buildManual()`):** índice das 9 Partes do manual
  (itens 1–57) + atalhos (FAQ, Encefalopatia, Odontológicos, Outras Causas).
- **Header (`#hdr`):** logo + `.hdr-actions` (🔍 `#hdr-search` — só fora da
  Busca —, ◐ `#nb-contrast`, 🌙 `#nb-theme`). `.sync-btn`, `#sync-status` e a
  `.nav-r` (guarda `#nb-busca`/`#nb-gestor`, usados por id no `setView`)
  seguem ocultos por CSS.
- **Páginas internas:** "← Voltar" à esquerda (`.pg-back{order:-1}`). A barra
  Anterior/Próxima (`#special-nav`) está oculta por CSS; o deslize lateral
  entre `SPECIAL_PAGES` continua.
- **Busca:** filtros recolhidos atrás do botão "⚙️ Filtros" (`#search-area.fc`,
  `toggleFilters()`, contador em `updFilt()`). Cards mostram o prazo no selo
  (`prazoCurto(item)` → "IT · 14 d"). O detalhe abre como **folha de baixo**
  (`#vd.sheet` + `#vd-scrim`, `_syncSheet()`/`closeSheet()`); o auto-abrir de
  resultado único só ocorre quando o campo de busca não está focado.
- **Recentes:** ids em `localStorage['triagem_recent']` (máx. 8).
  `renderRecentChips()` troca os chips "Rápido" por "Recentes"; a home
  (`_homeTop()`) mostra cartões de recentes no lugar do herói após o 1º uso.
- `renderHome()` monta a tela inicial: recentes (ou herói), `stats-row`, card
  de **Triagem Guiada** e a `.cgrid` de categorias/páginas especiais.
- **Layout largo (≥ 900 px):** `#app` e a barra inferior ficam numa coluna de
  760 px.
- **Acessibilidade:** `:focus-visible`, `prefers-reduced-motion`, `aria-label`
  nos botões de ícone, `role="button"/tabindex` nos cards, `--text3` mais
  claro (contraste) e fontes mínimas de 10–11 px.

## Sincronização (JSONBin)
- **Sem credenciais no código.** O gestor cola `binId` + Master Key em
  Gestão › Configuração JSONBin (`loadCloudConfigUI` / `saveCloudConfig`).
  Enquanto não configurado, o app roda 100% offline (localStorage) e nenhuma
  chamada de rede é feita.
- `getCloudCfg()` / `saveCloudCfg()` — config em `localStorage['triagem_cloud_cfg']`
  (`{binId, apiKey, accessKey}`).
- `syncFromCloud(showMsg)` — GET `…/v3/b/<binId>/latest`; aplica se `updatedAt` remoto > local. Auto-sync a cada 5 min (só quando há config).
- `syncToCloud(p)` / `pushToCloud()` — PUT do banco. `saveStorage()` grava local e dispara `syncToCloud`.
- `loadPaginasFromCloud()` / `syncPaginasToCloud()` — idem para `PAGINAS_CUSTOM`.
- Chaves `localStorage`: `triagem_db_local`, `triagem_paginas`, `triagem_cloud_cfg`, `triagem_favs`, `triagem_notas`, `hc`, `theme`.

## Módulos de conteúdo (funções `build*` / `get*Data`)
- **Busca** — `buildAll`, `renderResults`, `fuzzy`; chips rápidos + filtros por categoria/subcategoria/tipo.
- **Critérios Gerais** — `getGeraisData` / `buildGerais`.
- **Risco sexual/epidemiológico** — `getRiscoData` / `buildRisco`.
- **Arboviroses** (dengue/zika/chikungunya) — `getArboData` / `buildArbo` / `calcArboItem`.
- **Odontologia** — `getOdontoData` / `buildOdonto`.
- **Aférese** — `getAfreseData` / `buildAfrese` (+ editor `buildAfreseEditor`, abas `gTab`).
- **Outras situações** — `getOutrasData` / `buildOutras`.
- **Encefalopatia / vaca louca** — `buildEncef`.
- **FAQ** — `buildFAQ` / `toggleFAQ`.
- **Triagem guiada** — `buildTriagem` / `renderTriagem` / `tgSelect` / `tgBack` / `calcTgData`.
- **Resumo & Comprovante** — `buildResumo`, `renderResumo`, `addToResumo`, `sendToComprovante`, `printPDF` / `buildPDF`.
- **Calculadora de retorno** — `calcRetorno(itemId)` / `extractDias` / `calcTgData` (soma dias e devolve data de reapto).
- **Modo doador** — `showDoadorMode` / `showItemDoador` (linguagem simplificada para o público).
- **Voz** — `startVoice()` (Web Speech API) no campo de busca.

## Painel do Gestor
- Entra por `gestorNav()` → view `login` (senha conferida por hash, ver `PASS_HASH` em Arquitetura JS) → view `gestor`.
- `renderGL()` (lista/CRUD do banco), `openForm()` / `saveItem()` / `doDelete()` / `confirmReset()`.
- Editores das páginas especiais: `loadPgEditor`, `buildGeraisEditor`, `buildRiscoEditor`, `buildArboEditor`, `buildOdontoEditor`, `buildOutrasEditor`, `buildAfreseEditor` + `savePgText` / `resetPgText`.
- Config de nuvem: `loadCloudConfigUI`, `saveCloudConfig`, `testCloudConfig`, `pushToCloud`.
- Import/export: `importJSON` / `exportJSON` / `backupJSON`.
- Versões: `renderVersionHistory` / `checkForUpdates` / `showUpdateBannerForOthers`.

## Regras de conteúdo (triagem de sangue)
- Tipos de inaptidão: **Apto**, **IT** (inaptidão temporária, com prazo em dias),
  **ID** (inaptidão definitiva). Itens carregam `dias` para o cálculo de retorno.
- O app é **material de consulta/apoio** — não substitui avaliação do médico triador.

## Como editar
Cada tela é gerada por uma função JS que monta HTML como string e injeta em
`#v<view>` (ex.: `buildGerais()` → `#vgerais`). Não há framework: alterar
conteúdo = alterar os `get*Data()` (ou os `DEFAULT_*`) e/ou o `build*()`
correspondente. Depois de mexer no HTML/CSS/JS, incremente `C` em `sw.js`
(`tv6` → `tv7` …) para limpar o cache offline dos aparelhos já instalados.
