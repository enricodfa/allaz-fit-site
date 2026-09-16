# Área do Personal — Allaz Fit

Design aprovado em 2026-09-16.

## 1. Objetivo

Um aplicativo web com login individual onde o personal trainer monta planos de
treino para seus alunos, com vídeo de execução por exercício, e o aluno consulta
o plano, registra o que fez e acompanha a evolução das cargas.

O sistema é separado do site institucional: outra URL, outro layout, outra
navegação. Só a identidade visual é compartilhada.

## 2. Decisões tomadas

| Decisão | Escolha |
|---|---|
| Criação de contas | O personal cria a conta do aluno. Não existe cadastro público. |
| Vídeos | Link (YouTube embutido; outras plataformas abrem em nova aba). Sem upload. |
| Estrutura do treino | Plano → Divisões (Treino A/B/C) → Exercícios |
| Perfis | Vários personais; cada um enxerga apenas os próprios alunos. Sem admin. |
| Registro do aluno | Uma carga e uma contagem de repetições por exercício, por sessão. |
| Histórico | Visível para o aluno e para o personal dele. |
| Infraestrutura | Supabase (Auth + Postgres + RLS + uma Edge Function) |
| Frontend | HTML/CSS/JS estático, sem build, servido pela Vercel |

## 3. Arquitetura

O site institucional permanece inalterado em `/`. A área logada vive em `app/`,
no mesmo repositório e no mesmo deploy da Vercel, acessível em `/app`.

O frontend é estático e consome o Supabase pela biblioteca `@supabase/supabase-js`
via CDN. Não há passo de build, bundler nem servidor Node. A única peça executada
em servidor é uma Edge Function do Supabase, descrita na seção 6.

A chave pública (`anon`) do Supabase fica no código do frontend — isso é o
esperado e seguro, porque toda a autorização é aplicada pelo banco via RLS. A
chave `service_role` nunca sai do servidor.

### Estrutura de arquivos

```
app/
  index.html          login
  personal.html       lista de alunos
  aluno-detalhe.html  dados, planos e histórico de um aluno (visão do personal)
  plano.html          editor de plano
  treino.html         painel do aluno (hoje / treino / histórico / perfil)
  css/app.css         layout do app; importa os tokens de /css/style.css
  js/
    supabase.js       cliente e configuração
    auth.js           sessão, redirecionamento por papel, logout, troca de senha
    personal-alunos.js
    personal-aluno.js
    plano-editor.js
    aluno-treino.js
    aluno-historico.js
    video.js          resolução de URL e modal de vídeo
```

Arquivos pequenos e com uma responsabilidade cada. Se `plano-editor.js` crescer
demais, ele se divide antes de virar um arquivo difícil de manter.

## 4. Identidade visual

`app/css/app.css` reaproveita os tokens já definidos em `css/style.css`:
`--ink #0B0908`, `--surface #1C1514`, `--bone #F3EDE4`, `--wine #7A1220`,
`--ember #D42A30`, fontes Anton (títulos) e Inter (texto).

O layout, porém, é de aplicativo e não de site de vendas: sem hero, sem seções
de scroll longo, navegação inferior fixa no celular, alvos de toque grandes,
números do treino em corpo grande e alto contraste — a tela do treino é lida de
pé, com o celular na mão e suado. Essa tela é projetada primeiro para o celular.

## 5. Modelo de dados

Seis tabelas em Postgres. Todas com `id uuid primary key default gen_random_uuid()`
e `criado_em timestamptz default now()`.

### `profiles`
Espelha `auth.users`; uma linha por usuário.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK, referencia `auth.users(id)` com `on delete cascade` |
| `nome` | text | obrigatório |
| `papel` | text | `'personal'` ou `'aluno'` (restrição `check`) |
| `personal_id` | uuid | referencia `profiles(id)`; preenchido só para alunos |
| `telefone` | text | opcional |

Restrição: um `aluno` precisa ter `personal_id`; um `personal` precisa ter
`personal_id` nulo.

### `planos`

| Coluna | Tipo | Notas |
|---|---|---|
| `aluno_id` | uuid | → `profiles(id)` |
| `personal_id` | uuid | → `profiles(id)`; desnormalizado de propósito, para as regras de acesso não precisarem de junção |
| `nome` | text | ex.: "Hipertrofia — Janeiro" |
| `objetivo` | text | opcional |
| `ativo` | boolean | default `true` |
| `inicio`, `fim` | date | opcionais |

Um aluno pode ter vários planos, mas a tela "Hoje" mostra o mais recente com
`ativo = true`. Ativar um plano desativa os outros do mesmo aluno (feito pelo
frontend, em duas escritas).

### `divisoes`

| Coluna | Tipo | Notas |
|---|---|---|
| `plano_id` | uuid | → `planos(id)` `on delete cascade` |
| `nome` | text | "Treino A" |
| `foco` | text | "Peito e Tríceps"; opcional |
| `ordem` | int | ordenação manual |

### `exercicios`

| Coluna | Tipo | Notas |
|---|---|---|
| `divisao_id` | uuid | → `divisoes(id)` `on delete cascade` |
| `nome` | text | obrigatório |
| `series` | int | ex.: 4 |
| `repeticoes` | text | **texto**: "8-12", "até a falha", "30s" |
| `carga` | text | **texto**: "20kg", "barra livre", "peso do corpo" |
| `descanso_seg` | int | opcional |
| `observacoes` | text | opcional |
| `video_url` | text | opcional |
| `ordem` | int | |

`repeticoes` e `carga` são texto porque é assim que treino é prescrito na vida
real. Forçar número aqui empobreceria a prescrição.

### `sessoes`
Uma linha por treino concluído pelo aluno.

| Coluna | Tipo | Notas |
|---|---|---|
| `aluno_id` | uuid | → `profiles(id)` |
| `divisao_id` | uuid | → `divisoes(id)` |
| `concluido_em` | timestamptz | default `now()` |
| `observacao` | text | campo livre do aluno ("ombro incomodou") |

### `registros`
Uma linha por exercício dentro de uma sessão.

| Coluna | Tipo | Notas |
|---|---|---|
| `sessao_id` | uuid | → `sessoes(id)` `on delete cascade` |
| `exercicio_id` | uuid | → `exercicios(id)` |
| `carga` | numeric | **número**, permite nulo |
| `repeticoes` | int | permite nulo |
| `feito` | boolean | default `true` |

A carga registrada é numérica — ao contrário da prescrita — porque o propósito
dela é ser comparada entre sessões. Quando o aluno não tem um número (peso do
corpo, elástico), o campo fica nulo e só `feito` é gravado.

Índices: `registros(exercicio_id, sessao_id)` e `sessoes(aluno_id, concluido_em desc)`,
que sustentam as duas consultas quentes (última carga de um exercício; sessões
recentes de um aluno).

## 6. Autenticação e segurança

### Login
E-mail e senha pelo Supabase Auth. Após entrar, o app lê `profiles.papel` e
encaminha para `personal.html` ou `treino.html`. Cada página verifica a sessão e
o papel ao carregar; quem não tem sessão volta para o login.

A confirmação de e-mail fica **desativada** no projeto Supabase: o personal cria
a conta e entrega a senha ao aluno pessoalmente, e muitos alunos não têm e-mail
acessível no celular.

### Criação de contas de aluno
Criar um usuário exige a chave `service_role`, que não pode existir no
navegador; e o método público de cadastro substituiria a sessão do personal pela
do aluno recém-criado. Por isso existe a Edge Function **`criar-aluno`**:

1. Recebe o token de quem chamou e confirma que é um usuário autenticado cujo
   `profiles.papel = 'personal'`. Se não for, responde 403.
2. Cria o usuário no Auth com e-mail e senha inicial, já confirmado.
3. Insere o `profiles` correspondente com `papel = 'aluno'` e
   `personal_id` = o id de quem chamou.
4. Se o passo 3 falhar, apaga o usuário criado no passo 2, para não deixar conta
   órfã sem perfil.

É a única peça de servidor do sistema.

### Senhas
O personal define a senha inicial e portanto a conhece. Por isso o aluno tem uma
tela de troca de senha no perfil, e o texto da tela o incentiva a trocá-la no
primeiro acesso. Não há recuperação por e-mail nesta versão: quem esquece a
senha pede ao personal, que a redefine.

### Regras de acesso (RLS)
RLS ativo em todas as seis tabelas. A autorização vive no banco, não no
JavaScript: alterar o código no navegador não dá acesso a dado de terceiro.

- **`profiles`** — leitura quando `id = auth.uid()` **ou** `personal_id = auth.uid()`.
  A condição olha apenas colunas da própria linha, o que evita recursão de
  política. Escrita: o usuário atualiza o próprio nome/telefone; o personal
  atualiza os alunos onde `personal_id = auth.uid()`.
- **`planos`** — leitura quando `aluno_id = auth.uid()` ou `personal_id = auth.uid()`.
  Inserção, alteração e exclusão apenas quando `personal_id = auth.uid()`.
- **`divisoes`** e **`exercicios`** — acesso derivado do plano ao qual pertencem,
  por subconsulta em `planos`. Leitura para o aluno e o personal daquele plano;
  escrita só para o personal.
- **`sessoes`** e **`registros`** — leitura para o aluno dono e para o personal
  dele. Escrita apenas para o próprio aluno: o personal lê o histórico, mas não
  inventa treinos em nome do aluno.

## 7. Telas

### Login — `app/index.html`
Uma tela, um formulário. Erros em português claro ("E-mail ou senha
incorretos"), nunca a mensagem crua do serviço.

### Personal

**Meus alunos** (`personal.html`) — lista dos alunos com busca por nome e botão
"Novo aluno". Cada linha mostra o nome e quando o aluno treinou pela última vez,
o que transforma a lista num painel de quem está sumido. Esse indicador depende
das sessões da fase 2; na fase 1 ele exibe "sem registros".

**Novo aluno** — modal com nome, e-mail, telefone e senha inicial. Chama a Edge
Function. Ao concluir, mostra a senha em tela para o personal repassar.

**Aluno** (`aluno-detalhe.html`) — duas abas:
- *Planos*: os planos do aluno, qual está ativo, botão "Novo plano".
- *Histórico*: sessões em ordem cronológica e, por exercício, a progressão de
  carga em lista.

**Editor de plano** (`plano.html`) — nome, objetivo e datas do plano; abaixo, as
divisões, cada uma expansível com seus exercícios. Adicionar, remover e reordenar
divisões e exercícios. Cada exercício tem os campos da seção 5, incluindo o
`video_url`, com validação leve da URL. Salvamento explícito, com aviso ao sair
com alterações pendentes.

### Aluno

**Hoje** (`treino.html`) — o plano ativo e os cards das divisões: nome, foco,
quantidade de exercícios e há quantos dias aquele treino não é feito ("Treino C
— há 9 dias"). Se o aluno não tem plano ativo, uma mensagem orienta a falar com
o professor.

**Treino** — a lista de exercícios da divisão escolhida. Cada exercício mostra os
números da prescrição em corpo grande, as observações do personal, um botão de
vídeo, um campo de carga, um de repetições e um check. Abaixo do nome aparece
**"da última vez: 40kg × 10"**, buscado do registro anterior daquele exercício —
a informação mais útil da tela, porque é exatamente o que se esquece de uma
semana para outra.

O que o aluno digita é guardado no próprio navegador enquanto ele treina, de
modo que fechar o app por engano não perde o progresso. O botão **"Concluir
treino"** grava tudo de uma vez: uma `sessao` e os `registros` dela.

**Histórico** — sessões agrupadas por divisão ("Treino A — 12 vezes, última em
14/09") e, ao abrir um exercício, a evolução da carga em lista cronológica.
Gráficos ficam para depois.

**Perfil** — nome, e-mail, troca de senha e sair.

### Vídeo
`video.js` reconhece URLs do YouTube (`youtube.com/watch`, `youtu.be`, `shorts`)
e as converte para a forma embutível, exibida numa janela sobre a tela sem tirar
o aluno do treino. Qualquer outra URL vira um link que abre em nova aba —
Instagram e TikTok não permitem incorporação confiável sem chave de API. O texto
de ajuda do editor recomenda YouTube com vídeo "não listado", que não aparece em
buscas mas funciona por link.

## 8. Fora de escopo nesta versão

Biblioteca de exercícios reaproveitável entre planos; avaliação física e medidas;
gráficos de evolução; chat entre aluno e personal; recuperação de senha por
e-mail; painel de dono da academia; upload de vídeo; notificações; modo offline
completo; exportar treino em PDF.

O modelo de dados acima acomoda todos eles sem migração destrutiva.

## 9. Verificação

O projeto não tem suíte de testes e esta versão não introduz uma — seria
infraestrutura desproporcional para um app estático de duas telas por perfil.
A verificação é feita assim, com evidência registrada:

1. **Regras de acesso, no banco.** Criar dois personais e um aluno para cada,
   com um plano por aluno. Consultando como o aluno 1, comprovar que o plano do
   aluno 2 não aparece; consultando como o personal 1, comprovar que o aluno do
   personal 2 não aparece; e comprovar que o aluno não consegue alterar o próprio
   plano nem gravar sessão em nome de outro. A saída de cada consulta é colada no
   relatório.
2. **Fluxo completo, manual.** Personal entra, cria aluno, monta um plano com
   duas divisões e exercícios com vídeo; aluno entra com a senha recebida, vê o
   plano, abre o vídeo, registra cargas, conclui o treino; personal vê o
   histórico; aluno abre o mesmo treino de novo e encontra "da última vez".
3. **Celular.** As telas do aluno conferidas em largura de celular, que é onde
   elas serão usadas.

Nada é reportado como pronto sem a saída correspondente.

## 10. Riscos conhecidos

- ~~**Limite de projetos do Supabase.**~~ **Resolvido em 2026-09-16:** o dono da
  conta removeu o projeto DRAKMA e criou o projeto `ALLAZ`
  (ref `denntoorhjfzwywnzqsp`, região `us-west-2`), que está ativo.
- **Senha em poder do personal.** Mitigado pela troca de senha no perfil do
  aluno, não eliminado. Recuperação por e-mail resolve de vez, e fica para
  depois.
- **Dependência do YouTube.** Se um vídeo é removido ou fica privado, o exercício
  perde a referência. Aceitável frente ao custo de armazenar vídeo.

## 11. Ordem de construção

Duas fases, mesma spec e mesmo banco — a fase 2 não altera nada do que a fase 1
construiu:

**Fase 1 — prescrição.** Projeto Supabase, as seis tabelas e as regras de acesso
(todas de uma vez, inclusive as de sessões e registros), Edge Function
`criar-aluno`, login, painel do personal, editor de plano, telas Hoje e Treino do
aluno em modo somente leitura, vídeo funcionando. Ao fim desta fase o sistema já
entrega o que foi pedido originalmente, ponta a ponta.

**Fase 2 — registro e histórico.** Campos de carga e check na tela de Treino,
rascunho no navegador, botão Concluir, "da última vez", tela de Histórico do
aluno, aba de Histórico no painel do personal.
