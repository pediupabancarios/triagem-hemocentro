# Triagem Clínica — Hemocentro da Paraíba

PWA de consulta rápida para a **triagem clínica de doadores de sangue** do
Hemocentro da Paraíba (João Pessoa/PB): critérios de inaptidão temporária (IT)
e definitiva (ID), tempos de espera por medicamento, vacina, doença, cirurgia e
procedimento odontológico, fluxos de aférese e arboviroses, triagem guiada e
geração de resumo/comprovante.

Conteúdo baseado no **Manual de Triagem Clínica — Rev. 06 (16/07/2026)** e na
Portaria de Consolidação GM/MS nº 5/2017, atualizada pela Portaria GM/MS nº
11.685/2026. Responsável pelo conteúdo: Dr. Rodrigo Cahuana Chipayo.

> Material de apoio à decisão. **Não substitui** a avaliação do médico triador.

## Estrutura

| Arquivo | O que é |
|---|---|
| `index.html` | O aplicativo inteiro (HTML + CSS + JS inline, sem build e sem dependências). |
| `sw.js` | Service worker: rede-primeiro para a página, cache só como fallback offline. |
| `CLAUDE.md` | Arquitetura e mapa de funções para quem for mexer no código. |
| `.nojekyll` | Impede o GitHub Pages de processar os arquivos com Jekyll. |

## Rodar localmente

```bash
python3 -m http.server 8843
```

Abra <http://localhost:8843>. (O service worker só registra em `http://localhost`
ou `https://`, não em `file://`.)

## Publicar (GitHub Pages)

1. Em **Settings → Pages**, escolha **Deploy from a branch** → `main` → `/ (root)`.
2. O app fica em `https://<usuário>.github.io/<repositório>/`.
3. A cada alteração, suba a constante `C` em `sw.js` (`tv16` → `tv17` …) para
   que os aparelhos que já instalaram o PWA descartem o cache antigo.

## Dados e sincronização

- Funciona offline: o banco fica no `localStorage` do aparelho.
- Sincronização opcional com **JSONBin.io**: o gestor cola `binId` + Master Key
  em *Gestão › Configuração JSONBin*. **Nenhuma credencial fica no código.**
- A senha do painel do gestor é conferida por **hash SHA-256** (`PASS_HASH`).
  Isso é só um bloqueio de interface — o JavaScript é público. A proteção de
  escrita de verdade é a Master Key do JSONBin, que fica apenas com o gestor.
  Para trocar a senha, rode `sha256Hex('nova-senha')` no console do navegador e
  cole o resultado em `PASS_HASH`.
