# Site — Allaz Fit

Site institucional da Allaz Fit (academia, Jd. Country Club, Poços de Caldas).
HTML, CSS e JavaScript puros: **não precisa de build, nem de Node, nem de framework**.
É só abrir o `index.html` ou subir os arquivos em qualquer hospedagem.

```
SITE ALLAZ FIT/
├── index.html          → todo o conteúdo da página
├── css/style.css       → design system + estilos
├── js/main.js          → menu, WhatsApp, animações de scroll
├── assets/             → favicon (troque pelo logo real quando tiver o arquivo)
├── Abrir site (Mac).command      → dois cliques no Mac
├── Abrir site (Windows).bat      → dois cliques no Windows
└── server.js                     → servidor local usado pelos atalhos
```

---

## 1. O que falta configurar

### a) Número do WhatsApp ← **único item obrigatório**

Abra `js/main.js` e preencha a primeira linha do `CONFIG`:

```js
whatsapp: '5535998765432',   // 55 + DDD + número, só dígitos
```

Enquanto estiver vazio, todos os botões de WhatsApp abrem o Instagram (`@allazfit`)
em vez do WhatsApp — o site não fica quebrado. Assim que o número for preenchido,
os botões passam a abrir o WhatsApp automaticamente com a mensagem já digitada.

### b) Conteúdo placeholder pra trocar

Este site foi montado como protótipo, com conteúdo fictício fácil de substituir:

- **Planos e preços** — `index.html`, seção `PLANOS` (3 cards: Start, Trimestral, Performance)
- **Equipe** — `index.html`, seção `EQUIPE` (4 personal trainers de exemplo)
- **Fotos da estrutura** — `index.html`, seção `ESTRUTURA`. Cada `<div class="shot ...">`
  é um gráfico feito em CSS; troque o conteúdo por `<img src="assets/estrutura-1.jpg" alt="...">`
  quando tiverem fotos reais do espaço.
- **Logo** — hoje é texto estilizado (`brand__mark`). Quando tiverem o arquivo da logo
  em SVG/PNG, é só trocar esse bloco por `<img src="assets/logo.svg">`.
- **Mapa** — `index.html`, seção `CONTATO`, o `<iframe>` usa busca por endereço.
  Se quiserem o pino exato, troque a URL do `src` pelo link de "Compartilhar → Incorporar mapa"
  do Google Maps.

### c) Quando tiver domínio próprio

No `index.html`, troque `assets/og-image.jpg` da tag `og:image` pelo endereço completo
(ex.: `https://allazfit.com.br/assets/og-image.jpg`).

---

## 2. Como abrir o site no computador

**Dois cliques no atalho do seu sistema** — `Abrir site (Mac).command` ou
`Abrir site (Windows).bat`. Ele liga o servidor local e abre o navegador
em `http://localhost:4322` sozinho. Para desligar, feche a janela preta do Terminal
que abriu junto (ou aperte Ctrl + C nela).

> **Mac, primeira vez:** pode aparecer "não foi possível verificar o desenvolvedor".
> Clique com o botão direito no arquivo → **Abrir** → **Abrir** de novo. Só acontece uma vez.
>
> **Windows, primeira vez:** pode aparecer a tela azul do SmartScreen.
> Clique em **Mais informações** → **Executar assim mesmo**. Também só acontece uma vez.

Se preferir pelo terminal: `node server.js`. Abrir o `index.html` com dois cliques
também funciona — só não usa o servidor local.

---

## 3. Como colocar no ar

Funciona em qualquer hospedagem estática, sem domínio próprio, de graça:

| Serviço | Como | Endereço que você ganha |
|---|---|---|
| **Netlify Drop** | arraste a pasta em [app.netlify.com/drop](https://app.netlify.com/drop) | `allazfit.netlify.app` |
| **Vercel** | importe a pasta no painel | `allazfit.vercel.app` |
| **GitHub Pages** | suba a pasta num repositório e ative Pages | `usuario.github.io/allazfit` |

Quando comprarem o domínio, é só apontar nas configurações do serviço — nada muda no código.

---

## 4. O que já está pronto

- Header fixo com menu mobile em tela cheia
- Botão flutuante de WhatsApp (cai no Instagram até o número ser configurado)
- Revelação de seções no scroll, respeitando `prefers-reduced-motion`
- Layout responsivo até 375px
- SEO básico: title, description, Open Graph, favicon
- Acessibilidade: navegação por teclado, foco visível

## 5. Área do personal (Fase 2) — concluída, ainda não publicada

A área logada (personal monta o treino, aluno registra as cargas) está pronta
neste branch, em `app/`, com login e banco reais (Supabase — projeto `ALLAZ`,
RLS testado). Roteiro completo verificado ponta a ponta: personal cria aluno e
plano com duas divisões e vídeo → aluno entra, vê o plano, abre o vídeo,
registra cargas, conclui o treino → personal vê o histórico → aluno reabre o
treino e encontra "da última vez". Isolamento entre contas confirmado nas
quatro consultas de RLS.

**Fora de escopo nesta versão** (o modelo de dados comporta tudo isso depois,
sem migração destrutiva): biblioteca de exercícios reaproveitável entre planos,
avaliação física e medidas, gráficos de evolução, chat aluno↔personal,
recuperação de senha por e-mail, painel de dono da academia, upload de vídeo
(só link do YouTube), notificações, modo offline completo, exportar treino em
PDF.

**Antes de publicar em produção**, ver `.superpowers/sdd/2026-09-16-area-personal/progress.md`
para o que falta: decidir sobre as contas de teste `@teste.local` (listadas,
não apagadas — decisão do dono), revisar a proteção contra senha vazada no
painel do Supabase, e mesclar este branch (`area-personal`) para o `master`.
