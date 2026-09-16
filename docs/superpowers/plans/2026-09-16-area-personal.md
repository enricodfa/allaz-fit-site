# Área do Personal — Plano de Implementação

> **Para executores agênticos:** SUB-SKILL OBRIGATÓRIA: use
> `superpowers:subagent-driven-development` (recomendado) ou
> `superpowers:executing-plans` para implementar tarefa a tarefa. Os passos usam
> caixas (`- [ ]`) para acompanhamento.

**Goal:** Entregar uma área logada, separada do site institucional, onde o
personal monta planos de treino com vídeo por exercício e o aluno consulta o
plano, registra cargas e acompanha o histórico.

**Architecture:** Frontend estático (HTML/CSS/JS, sem build) em `app/`, servido
pela mesma Vercel do site. Supabase provê autenticação, Postgres e autorização
por RLS. Uma única Edge Function (`criar-aluno`) cobre a operação que exige
chave secreta. Toda autorização vive no banco, nunca no JavaScript.

**Tech Stack:** HTML5, CSS puro com custom properties, JavaScript ES Modules,
`@supabase/supabase-js@2` via esm.sh, Supabase (Postgres 17 + Auth + Edge
Functions em Deno), Vercel para hospedagem estática.

**Spec:** `docs/superpowers/specs/2026-09-16-area-personal-design.md` — leia
antes de começar. O plano argumenta a partir dela.

## Global Constraints

- **Sem build.** Nenhum `package.json`, bundler ou passo de compilação no
  frontend. Tudo roda direto no navegador via ES Modules e CDN.
- **CDN fixa:** `https://esm.sh/@supabase/supabase-js@2`. Versão travada no `@2`.
- **O site institucional não é tocado.** `index.html`, `css/style.css`,
  `js/main.js` e `assets/` na raiz permanecem exatamente como estão. A única
  alteração fora de `app/` é a criação de `docs/`, já feita.
- **Idioma:** toda a interface, mensagens de erro e nomes de tabelas/colunas em
  português. Sem acentos e sem cedilha em identificadores de banco e de código
  (`divisoes`, `exercicios`, `sessoes`, `observacoes`).
- **Organização Supabase:** `clpxtrnixpzndgsryhbq` (`enricodfa's Org`).
  **Projeto `ALLAZ`, ref `denntoorhjfzwywnzqsp`, região `us-west-2`** — já criado
  pelo dono da conta em 2026-09-16 e ativo. Use este ref em todas as chamadas do
  MCP Supabase. Não crie outro projeto.
- **Tokens visuais:** reutilizar os de `css/style.css` — `--ink #0B0908`,
  `--bg-2 #161010`, `--surface #1C1514`, `--surface-2 #241B19`,
  `--line rgba(243,237,228,.08)`, `--bone #F3EDE4`, `--smoke #A79C93`,
  `--wine #7A1220`, `--ember #D42A30`, `--ember-2 #F0453C`. Fontes: Anton
  (títulos), Inter (texto).
- **A chave `service_role` nunca aparece em arquivo do repositório.** Ela existe
  apenas como variável de ambiente da Edge Function (o Supabase já a injeta).
- **Commits frequentes**, um por tarefa, mensagem em português no imperativo.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `app/index.html` | Tela de login |
| `app/personal.html` | Lista de alunos do personal |
| `app/aluno-detalhe.html` | Um aluno visto pelo personal: planos e histórico |
| `app/plano.html` | Editor de plano (divisões e exercícios) |
| `app/treino.html` | Painel do aluno: Hoje, Treino, Histórico, Perfil |
| `app/css/app.css` | Layout do aplicativo; importa os tokens do site |
| `app/js/supabase.js` | Cliente Supabase e credenciais públicas |
| `app/js/auth.js` | Sessão, guarda de papel, login, logout, troca de senha |
| `app/js/ui.js` | Helpers compartilhados: erro, datas, escape de HTML |
| `app/js/video.js` | Resolução de URL de vídeo e janela de exibição |
| `app/js/personal-alunos.js` | Lógica de `personal.html` |
| `app/js/personal-aluno.js` | Lógica de `aluno-detalhe.html` |
| `app/js/plano-editor.js` | Lógica de `plano.html` |
| `app/js/aluno-treino.js` | Telas Hoje e Treino de `treino.html` |
| `app/js/aluno-historico.js` | Tela Histórico de `treino.html` |
| `supabase/functions/criar-aluno/index.ts` | Edge Function (referência versionada) |

Cada arquivo JS tem uma responsabilidade. Se `plano-editor.js` passar de ~400
linhas, divida-o antes de continuar.

---

# FASE 1 — PRESCRIÇÃO

Ao fim da Fase 1 o sistema entrega, ponta a ponta, o que foi pedido
originalmente: o personal cadastra alunos, monta planos com vídeos, o aluno
entra e vê o treino.

---

### Task 1: Criar o projeto Supabase e fixar as credenciais

**Files:**
- Criar: `app/js/supabase.js`
- Criar: `app/.gitignore` (nada ignorado ainda; ver passo 5)

**Interfaces:**
- Consome: nada (primeira tarefa).
- Produz: `app/js/supabase.js` exportando `sb` (instância `SupabaseClient`),
  `SUPABASE_URL` (string) e `SUPABASE_ANON_KEY` (string). Todas as tarefas
  seguintes importam `sb` deste arquivo.

- [ ] **Passo 1: Confirmar o projeto**

O projeto **não precisa ser criado** — o dono da conta já o criou. Confirme com
`list_projects` do MCP Supabase.

Esperado: um projeto `ALLAZ`, ref `denntoorhjfzwywnzqsp`, status
`ACTIVE_HEALTHY`. Se o status for `COMING_UP` ou `INACTIVE`, aguarde ou
despause antes de seguir: migrações contra um projeto que não está saudável
falham de forma confusa. Se o projeto não existir, **pare e avise** — não crie
um novo por conta própria.

- [ ] **Passo 2 e 3: (removidos — o projeto já existe)**

- [ ] **Passo 4: Obter URL e chave pública**

Ferramentas: `get_project_url` e `get_publishable_keys`.

A chave publicável (`anon`) é pública por natureza — ela vai para o código do
frontend e isso é o desenho correto do Supabase, porque a autorização é aplicada
pelo RLS (Task 3). Nunca confunda com a `service_role`.

- [ ] **Passo 5: Escrever o cliente**

Crie `app/js/supabase.js` com os valores reais obtidos no passo 4 no lugar dos
marcadores entre `<>`:

```js
// Cliente Supabase compartilhado por todas as telas da área logada.
// A chave abaixo é a chave PÚBLICA (anon). Ela pode ficar no frontend:
// toda a autorização é aplicada pelo banco via RLS, não por este código.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SUPABASE_URL = '<url retornada por get_project_url>';
export const SUPABASE_ANON_KEY = '<chave anon retornada por get_publishable_keys>';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'allazfit-auth',
  },
});
```

Não crie `app/.gitignore`: não há segredo neste diretório. (O item aparece em
**Files** apenas para registrar que a decisão foi considerada e descartada.)

- [ ] **Passo 6: Desativar a confirmação de e-mail**

No painel do Supabase, em Authentication → Sign In / Providers → Email,
desmarque "Confirm email". A spec (seção 6) decidiu isso porque o personal
entrega a senha pessoalmente e o aluno pode não ter e-mail acessível.

Esta configuração não tem API no MCP; é manual. Se você não tem acesso ao
painel, **pare e peça ao dono da conta**, informando exatamente essa opção.

- [ ] **Passo 7: Verificar que o cliente conecta**

Crie `app/teste-conexao.html` temporário:

```html
<!doctype html>
<meta charset="utf-8">
<pre id="saida">testando…</pre>
<script type="module">
  import { sb } from './js/supabase.js';
  const { data, error } = await sb.auth.getSession();
  document.getElementById('saida').textContent =
    error ? 'ERRO: ' + error.message : 'Conectado. Sessão: ' + JSON.stringify(data.session);
</script>
```

Sirva a pasta (`npx serve .` na raiz, ou o `server.js` já existente) e abra
`/app/teste-conexao.html`.
Esperado: `Conectado. Sessão: null` — sem sessão é o certo, ninguém entrou
ainda. Se aparecer erro de CORS ou de chave inválida, as credenciais do passo 4
estão erradas.

- [ ] **Passo 8: Apagar o arquivo temporário e commitar**

```bash
rm app/teste-conexao.html
git add app/js/supabase.js
git commit -m "Cria projeto Supabase e cliente da area logada"
```

---

### Task 2: Schema do banco

**Files:**
- Criar: `supabase/migrations/0001_schema.sql` (cópia versionada da migração)

**Interfaces:**
- Consome: projeto Supabase da Task 1.
- Produz: as tabelas `profiles`, `planos`, `divisoes`, `exercicios`, `sessoes`,
  `registros` com exatamente os nomes de coluna abaixo. Todo o código das tarefas
  seguintes depende desses nomes.

- [ ] **Passo 1: Confirmar que o banco está vazio**

Ferramenta: `list_tables` do MCP Supabase, schema `public`.
Esperado: nenhuma tabela. Se houver, você está apontando para o projeto errado.

- [ ] **Passo 2: Aplicar a migração**

Ferramenta: `apply_migration`, nome `0001_schema`, com este SQL:

```sql
-- profiles: espelha auth.users, uma linha por usuário.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  papel text not null check (papel in ('personal','aluno')),
  personal_id uuid references public.profiles(id) on delete set null,
  telefone text,
  criado_em timestamptz not null default now(),
  constraint vinculo_coerente check (
    (papel = 'aluno'    and personal_id is not null) or
    (papel = 'personal' and personal_id is null)
  )
);
create index profiles_personal_id_idx on public.profiles(personal_id);

-- planos: personal_id é desnormalizado de propósito, para as políticas de
-- acesso não precisarem de junção.
create table public.planos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.profiles(id) on delete cascade,
  personal_id uuid not null references public.profiles(id) on delete cascade,
  nome text not null,
  objetivo text,
  ativo boolean not null default true,
  inicio date,
  fim date,
  criado_em timestamptz not null default now()
);
create index planos_aluno_id_idx on public.planos(aluno_id);
create index planos_personal_id_idx on public.planos(personal_id);

create table public.divisoes (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references public.planos(id) on delete cascade,
  nome text not null,
  foco text,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);
create index divisoes_plano_id_idx on public.divisoes(plano_id);

-- repeticoes e carga são TEXTO: é assim que treino é prescrito na vida real
-- ("8-12", "até a falha", "barra livre").
create table public.exercicios (
  id uuid primary key default gen_random_uuid(),
  divisao_id uuid not null references public.divisoes(id) on delete cascade,
  nome text not null,
  series int,
  repeticoes text,
  carga text,
  descanso_seg int,
  observacoes text,
  video_url text,
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);
create index exercicios_divisao_id_idx on public.exercicios(divisao_id);

-- sessoes: um treino concluído pelo aluno.
create table public.sessoes (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.profiles(id) on delete cascade,
  divisao_id uuid not null references public.divisoes(id) on delete cascade,
  concluido_em timestamptz not null default now(),
  observacao text,
  criado_em timestamptz not null default now()
);
create index sessoes_aluno_recentes_idx
  on public.sessoes(aluno_id, concluido_em desc);

-- registros: carga é NUMÉRICA aqui, ao contrário da prescrita, porque o
-- propósito dela é ser comparada entre sessões. Nulo = aluno não tem número
-- (peso do corpo, elástico).
create table public.registros (
  id uuid primary key default gen_random_uuid(),
  sessao_id uuid not null references public.sessoes(id) on delete cascade,
  exercicio_id uuid not null references public.exercicios(id) on delete cascade,
  carga numeric,
  repeticoes int,
  feito boolean not null default true,
  criado_em timestamptz not null default now()
);
create index registros_exercicio_sessao_idx
  on public.registros(exercicio_id, sessao_id);
```

- [ ] **Passo 3: Verificar as tabelas**

Ferramenta: `list_tables`, schema `public`.
Esperado: as seis tabelas, com as colunas exatamente como acima.

- [ ] **Passo 4: Verificar que a restrição de vínculo funciona**

Ferramenta: `execute_sql`:

```sql
-- Deve FALHAR: aluno sem personal viola vinculo_coerente.
insert into public.profiles (id, nome, papel)
values (gen_random_uuid(), 'Teste Invalido', 'aluno');
```

Esperado: erro de violação de `vinculo_coerente` (e também de chave estrangeira
para `auth.users`). O ponto é confirmar que o banco recusa — se a inserção
passar, a restrição não foi criada.

- [ ] **Passo 5: Salvar a migração no repositório e commitar**

Salve o mesmo SQL em `supabase/migrations/0001_schema.sql` (para o schema viver
no controle de versão, não só no serviço) e:

```bash
git add supabase/migrations/0001_schema.sql
git commit -m "Adiciona schema do banco da area do personal"
```

---

### Task 3: Regras de acesso (RLS)

Esta é a tarefa mais importante do plano. Aqui é onde se garante que um aluno não
lê o treino de outro. Não a apresse.

**Files:**
- Criar: `supabase/migrations/0002_rls.sql`

**Interfaces:**
- Consome: as tabelas da Task 2.
- Produz: RLS ativo nas seis tabelas, com as políticas abaixo. Nenhuma tarefa
  seguinte pode depender de filtrar por dono no JavaScript — o banco já filtra.

- [ ] **Passo 1: Provar que o banco está inseguro agora**

Ferramenta: `get_advisors`, tipo `security`.
Esperado: avisos de "RLS disabled in public" para as seis tabelas. Registre a
saída — é a prova de que o passo seguinte muda algo real.

- [ ] **Passo 2: Aplicar as políticas**

Ferramenta: `apply_migration`, nome `0002_rls`:

```sql
alter table public.profiles   enable row level security;
alter table public.planos     enable row level security;
alter table public.divisoes   enable row level security;
alter table public.exercicios enable row level security;
alter table public.sessoes    enable row level security;
alter table public.registros  enable row level security;

-- PROFILES
-- A condição olha apenas colunas da própria linha; isso evita recursão de
-- política, que é o erro clássico ao fazer RLS em cima de uma tabela de perfis.
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or personal_id = auth.uid());

create policy profiles_update_proprio on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_update_aluno on public.profiles for update to authenticated
  using (personal_id = auth.uid()) with check (personal_id = auth.uid());

-- Não há política de INSERT: contas nascem pela Edge Function, que usa a chave
-- service_role e contorna o RLS por desenho.

-- PLANOS
create policy planos_select on public.planos for select to authenticated
  using (aluno_id = auth.uid() or personal_id = auth.uid());

create policy planos_escrita on public.planos for all to authenticated
  using (personal_id = auth.uid())
  with check (personal_id = auth.uid());

-- DIVISOES: acesso derivado do plano.
create policy divisoes_select on public.divisoes for select to authenticated
  using (exists (
    select 1 from public.planos p
    where p.id = divisoes.plano_id
      and (p.aluno_id = auth.uid() or p.personal_id = auth.uid())));

create policy divisoes_escrita on public.divisoes for all to authenticated
  using (exists (
    select 1 from public.planos p
    where p.id = divisoes.plano_id and p.personal_id = auth.uid()))
  with check (exists (
    select 1 from public.planos p
    where p.id = divisoes.plano_id and p.personal_id = auth.uid()));

-- EXERCICIOS: acesso derivado da divisão, que deriva do plano.
create policy exercicios_select on public.exercicios for select to authenticated
  using (exists (
    select 1 from public.divisoes d
    join public.planos p on p.id = d.plano_id
    where d.id = exercicios.divisao_id
      and (p.aluno_id = auth.uid() or p.personal_id = auth.uid())));

create policy exercicios_escrita on public.exercicios for all to authenticated
  using (exists (
    select 1 from public.divisoes d
    join public.planos p on p.id = d.plano_id
    where d.id = exercicios.divisao_id and p.personal_id = auth.uid()))
  with check (exists (
    select 1 from public.divisoes d
    join public.planos p on p.id = d.plano_id
    where d.id = exercicios.divisao_id and p.personal_id = auth.uid()));

-- SESSOES: o aluno escreve; o personal dele apenas lê.
create policy sessoes_select on public.sessoes for select to authenticated
  using (aluno_id = auth.uid() or exists (
    select 1 from public.profiles pr
    where pr.id = sessoes.aluno_id and pr.personal_id = auth.uid()));

create policy sessoes_insert on public.sessoes for insert to authenticated
  with check (aluno_id = auth.uid());

create policy sessoes_update on public.sessoes for update to authenticated
  using (aluno_id = auth.uid()) with check (aluno_id = auth.uid());

create policy sessoes_delete on public.sessoes for delete to authenticated
  using (aluno_id = auth.uid());

-- REGISTROS: derivado da sessão.
create policy registros_select on public.registros for select to authenticated
  using (exists (
    select 1 from public.sessoes s
    where s.id = registros.sessao_id
      and (s.aluno_id = auth.uid() or exists (
        select 1 from public.profiles pr
        where pr.id = s.aluno_id and pr.personal_id = auth.uid()))));

create policy registros_escrita_aluno on public.registros for all to authenticated
  using (exists (
    select 1 from public.sessoes s
    where s.id = registros.sessao_id and s.aluno_id = auth.uid()))
  with check (exists (
    select 1 from public.sessoes s
    where s.id = registros.sessao_id and s.aluno_id = auth.uid()));
```

- [ ] **Passo 3: Confirmar que os avisos sumiram**

Ferramenta: `get_advisors`, tipo `security`.
Esperado: nenhum aviso de RLS desabilitado nas seis tabelas. Se sobrar qualquer
outro aviso, leia e resolva antes de seguir.

- [ ] **Passo 4: Criar os dados adversariais**

Estes dados existem para provar o isolamento e permanecem no banco até a Task 17.
Ferramenta: `execute_sql`. Crie dois personais e um aluno para cada, cada aluno
com um plano:

```sql
-- Usuários de teste direto em auth.users, com senha conhecida.
-- (Em produção quem cria alunos é a Edge Function da Task 4.)
insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','personal1@teste.local',
   crypt('senha123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}','{}'),
  ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','personal2@teste.local',
   crypt('senha123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}','{}'),
  ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','aluno1@teste.local',
   crypt('senha123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}','{}'),
  ('44444444-4444-4444-4444-444444444444','00000000-0000-0000-0000-000000000000',
   'authenticated','authenticated','aluno2@teste.local',
   crypt('senha123', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}','{}');

insert into public.profiles (id, nome, papel, personal_id) values
  ('11111111-1111-1111-1111-111111111111','Personal Um','personal', null),
  ('22222222-2222-2222-2222-222222222222','Personal Dois','personal', null),
  ('33333333-3333-3333-3333-333333333333','Aluno Um','aluno','11111111-1111-1111-1111-111111111111'),
  ('44444444-4444-4444-4444-444444444444','Aluno Dois','aluno','22222222-2222-2222-2222-222222222222');

insert into public.planos (id, aluno_id, personal_id, nome) values
  ('aaaaaaaa-0000-0000-0000-000000000001',
   '33333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111','Plano do Aluno Um'),
  ('aaaaaaaa-0000-0000-0000-000000000002',
   '44444444-4444-4444-4444-444444444444','22222222-2222-2222-2222-222222222222','Plano do Aluno Dois');

-- Uma divisão real no plano do Aluno Dois. Ela existe para o teste (d) do passo
-- 5: sem um divisao_id que exista de verdade, a violação de chave estrangeira
-- dispara antes da política e o erro resultante não prova nada sobre RLS.
insert into public.divisoes (id, plano_id, nome, ordem) values
  ('bbbbbbbb-0000-0000-0000-000000000002',
   'aaaaaaaa-0000-0000-0000-000000000002','Treino A do Aluno Dois', 0);
```

Se `crypt` não existir, habilite antes: `create extension if not exists pgcrypto;`.

**Se o insert em `auth.users` falhar por coluna NOT NULL** (varia com a versão do
Auth), acrescente estas quatro colunas com string vazia e repita —
não improvise outras: `confirmation_token`, `recovery_token`,
`email_change_token_new`, `email_change`.

- [ ] **Passo 5: Provar o isolamento — o teste que importa**

Ferramenta: `execute_sql`. Cada bloco assume a identidade de um usuário e
consulta. **Cole a saída de cada um no relatório da tarefa.**

> **Cada bloco precisa rodar dentro de `begin; … rollback;` — não remova esse
> envelope.** `set local` só tem efeito dentro de uma transação. Fora dela ele é
> ignorado em silêncio, a consulta roda como `postgres` (que **ignora RLS por
> definição**), e os quatro testes passam sem testar nada. Um verde falso aqui é
> pior do que nenhum teste, porque encerra a única verificação que garante que um
> aluno não lê o treino de outro.
>
> Antes do bloco (a), rode este controle de sanidade — ele prova que o envelope
> está funcionando:
>
> ```sql
> begin;
> set local role authenticated;
> set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
> select current_user, auth.uid();
> rollback;
> -- ESPERADO: current_user = 'authenticated' e auth.uid() = 33333333-...
> -- Se vier 'postgres' ou auth.uid() nulo, PARE: os testes abaixo não valem nada.
> ```

```sql
-- (a) Aluno Um enxerga apenas o próprio plano.
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
select nome from public.planos;
rollback;
-- ESPERADO: exatamente uma linha, "Plano do Aluno Um".
```

```sql
-- (b) Personal Um não enxerga o aluno do Personal Dois.
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select nome from public.profiles order by nome;
rollback;
-- ESPERADO: "Aluno Um" e "Personal Um". NUNCA "Aluno Dois" nem "Personal Dois".
```

```sql
-- (c) Aluno Um não consegue alterar o próprio plano.
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
update public.planos set nome = 'Hackeado'
 where id = 'aaaaaaaa-0000-0000-0000-000000000001';
rollback;
-- ESPERADO: UPDATE 0 (nenhuma linha afetada). Prescrever é só do personal.
```

```sql
-- (d) Aluno Um não consegue gravar sessão em nome do Aluno Dois.
-- O divisao_id é uma divisão REAL criada no passo 4: com um uuid inventado, a
-- violação de chave estrangeira dispararia antes da política e o erro não
-- provaria nada sobre RLS.
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
insert into public.sessoes (aluno_id, divisao_id)
values ('44444444-4444-4444-4444-444444444444','bbbbbbbb-0000-0000-0000-000000000002');
rollback;
-- ESPERADO: erro "new row violates row-level security policy".
```

Se **qualquer** um desses quatro resultados divergir do esperado, pare e corrija
a política antes de continuar. Não há tarefa seguinte que conserte isso.

- [ ] **Passo 6: Salvar a migração e commitar**

Salve o SQL do passo 2 em `supabase/migrations/0002_rls.sql`:

```bash
git add supabase/migrations/0002_rls.sql
git commit -m "Adiciona regras de acesso por linha (RLS)"
```

---

### Task 4: Edge Function `criar-aluno` e o primeiro personal real

**Files:**
- Criar: `supabase/functions/criar-aluno/index.ts`

**Interfaces:**
- Consome: `profiles` e as políticas das Tasks 2 e 3.
- Produz: endpoint `POST /functions/v1/criar-aluno`, chamado do frontend por
  `sb.functions.invoke('criar-aluno', { body: { nome, email, senha, telefone } })`.
  Responde `{ ok: true, aluno_id }` em caso de sucesso, ou
  `{ ok: false, erro: '<mensagem em português>' }` com status 400/403/500.

- [ ] **Passo 1: Escrever a função**

Crie `supabase/functions/criar-aluno/index.ts`:

```ts
// Cria a conta de um aluno. Precisa rodar no servidor por dois motivos:
// a chave service_role não pode existir no navegador, e o cadastro público
// substituiria a sessão do personal pela do aluno recém-criado.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const URL = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function responder(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    // 1. Quem está chamando?
    const auth = req.headers.get('Authorization') ?? '';
    if (!auth.startsWith('Bearer ')) {
      return responder({ ok: false, erro: 'Não autenticado.' }, 401);
    }

    const comoUsuario = createClient(URL, ANON, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user }, error: erroUser } = await comoUsuario.auth.getUser();
    if (erroUser || !user) {
      return responder({ ok: false, erro: 'Sessão inválida.' }, 401);
    }

    // 2. É mesmo um personal? Quem decide é o banco, não o cliente.
    const { data: perfil } = await comoUsuario
      .from('profiles').select('papel').eq('id', user.id).single();
    if (!perfil || perfil.papel !== 'personal') {
      return responder({ ok: false, erro: 'Apenas personais podem cadastrar alunos.' }, 403);
    }

    // 3. Validar a entrada.
    const { nome, email, senha, telefone } = await req.json();
    if (!nome?.trim()) return responder({ ok: false, erro: 'Informe o nome.' }, 400);
    if (!email?.trim()) return responder({ ok: false, erro: 'Informe o e-mail.' }, 400);
    if (!senha || senha.length < 6) {
      return responder({ ok: false, erro: 'A senha precisa ter ao menos 6 caracteres.' }, 400);
    }

    // 4. Criar o usuário (exige service_role).
    const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
    const { data: criado, error: erroCriar } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: senha,
      email_confirm: true,
    });
    if (erroCriar || !criado?.user) {
      const jaExiste = (erroCriar?.message ?? '').toLowerCase().includes('already');
      return responder({
        ok: false,
        erro: jaExiste ? 'Já existe uma conta com esse e-mail.' : 'Não foi possível criar a conta.',
      }, 400);
    }

    // 5. Criar o perfil vinculado. Se falhar, desfazer o passo 4 para não
    //    deixar conta órfã sem perfil.
    const { error: erroPerfil } = await admin.from('profiles').insert({
      id: criado.user.id,
      nome: nome.trim(),
      papel: 'aluno',
      personal_id: user.id,
      telefone: telefone?.trim() || null,
    });
    if (erroPerfil) {
      await admin.auth.admin.deleteUser(criado.user.id);
      return responder({ ok: false, erro: 'Não foi possível salvar o perfil do aluno.' }, 500);
    }

    return responder({ ok: true, aluno_id: criado.user.id });
  } catch {
    return responder({ ok: false, erro: 'Erro inesperado no servidor.' }, 500);
  }
});
```

- [ ] **Passo 2: Publicar a função**

Ferramenta: `deploy_edge_function` do MCP Supabase, nome `criar-aluno`, com o
conteúdo do arquivo acima.

As três variáveis de ambiente (`SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`) são injetadas automaticamente pelo Supabase — você
não as configura e não as escreve em lugar nenhum.

- [ ] **Passo 3: Verificar que ela recusa quem não é personal**

Com o token do `aluno1@teste.local` (obtenha fazendo login pela API de auth com
a senha `senha123`), chame a função:

```bash
curl -s -X POST "<SUPABASE_URL>/functions/v1/criar-aluno" \
  -H "Authorization: Bearer <token_do_aluno1>" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Invasor","email":"invasor@teste.local","senha":"senha123"}'
```

Esperado: HTTP 403 e `{"ok":false,"erro":"Apenas personais podem cadastrar alunos."}`.
Este é o teste que importa: sem ele, qualquer aluno criaria contas.

- [ ] **Passo 4: Verificar que ela aceita um personal**

Mesma chamada com o token de `personal1@teste.local`:

Esperado: HTTP 200 e `{"ok":true,"aluno_id":"<uuid>"}`.

Confirme o vínculo:

```sql
select nome, papel, personal_id from public.profiles
 where id = '<aluno_id retornado>';
-- ESPERADO: papel 'aluno', personal_id = 11111111-1111-1111-1111-111111111111
```

- [ ] **Passo 5: Criar a conta real do primeiro personal**

O sistema não tem cadastro de personal — por desenho. A primeira conta nasce
aqui, à mão. **Pergunte ao dono do projeto** o nome, o e-mail e a senha inicial
desse personal; não invente. Depois, via `execute_sql`, crie o usuário em
`auth.users` e o `profiles` correspondente com `papel = 'personal'` e
`personal_id` nulo, no mesmo formato do passo 4 da Task 3.

Registre no relatório o e-mail usado (nunca a senha).

- [ ] **Passo 6: Commitar**

```bash
git add supabase/functions/criar-aluno/index.ts
git commit -m "Adiciona Edge Function de cadastro de aluno"
```

---

### Task 5: Fundação visual do aplicativo

**Files:**
- Criar: `app/css/app.css`
- Criar: `app/js/ui.js`

**Interfaces:**
- Consome: os tokens de `css/style.css`.
- Produz:
  - Classes CSS usadas por todas as telas: `.app-topo`, `.app-conteudo`,
    `.app-nav`, `.cartao`, `.btn`, `.btn-primario`, `.btn-fantasma`, `.campo`,
    `.campo-erro`, `.aviso`, `.vazio`, `.carregando`, `.chip`.
  - `app/js/ui.js` exportando:
    `esc(texto) -> string` (escapa HTML),
    `mostrarErro(elemento, mensagem) -> void`,
    `limparErro(elemento) -> void`,
    `formatarData(iso) -> string` ("14/09/2026"),
    `diasDesde(iso) -> number`,
    `textoDiasDesde(iso) -> string` ("hoje", "ontem", "há 9 dias", "sem registros"
    quando `iso` for nulo).

- [ ] **Passo 1: Escrever `app/css/app.css`**

O arquivo começa importando os tokens do site, para a identidade vir de uma
fonte só e nunca divergir:

```css
/* Área logada da Allaz Fit.
   Herda os tokens do site institucional; o layout, porém, é de aplicativo:
   sem hero, sem scroll de vendas, feito para ser lido de pé com o celular
   na mão. As telas do aluno são projetadas primeiro para o celular. */
@import url('../../css/style.css');

:root{
  --app-nav-h:64px;
  --app-topo-h:56px;
  --app-max:720px;
}
```

Escreva em seguida, usando exclusivamente os tokens (`var(--ember)`,
`var(--surface)`, `var(--bone)`, etc.), as classes listadas em **Interfaces**:

- `.app-topo` — barra superior fixa, altura `var(--app-topo-h)`, fundo
  `var(--bg-2)`, borda inferior `var(--line)`, título em Anton.
- `.app-conteudo` — largura máxima `var(--app-max)`, centralizado, respiro
  lateral `var(--gutter)`, com `padding-bottom` suficiente para a navegação
  inferior não cobrir o conteúdo.
- `.app-nav` — navegação inferior fixa no celular (`position:fixed;bottom:0`),
  itens com alvo de toque de no mínimo 48px de altura; item ativo em
  `var(--ember)`. Acima de 720px ela vira uma barra horizontal no topo.
- `.cartao` — fundo `var(--surface)`, borda `var(--line)`, raio `var(--r)`,
  padding confortável.
- `.btn` / `.btn-primario` / `.btn-fantasma` — altura mínima 48px; o primário em
  `var(--ember)` com texto `var(--ink)`; o fantasma com borda `var(--line-strong)`
  e fundo transparente. Estado `:disabled` com opacidade reduzida e cursor
  `not-allowed`. Foco visível herdado de `:focus-visible` do site.
- `.campo` — rótulo acima, `input`/`textarea` com fundo `var(--surface-2)`,
  borda `var(--line)`, raio `var(--r-sm)`, `font-size:16px` no mínimo (abaixo
  disso o Safari do iPhone dá zoom ao focar, o que atrapalha no meio do treino).
- `.campo-erro` — texto em `var(--ember-2)`, `var(--fs-sm)`.
- `.aviso` — caixa de erro geral, fundo `var(--ember-soft)`, borda
  `var(--ember-glow)`.
- `.vazio` — estado sem dados, texto centralizado em `var(--smoke)`.
- `.carregando` — o mesmo, com o texto "Carregando…".
- `.chip` — etiqueta pequena, usada para "Plano ativo" e para o foco da divisão.

- [ ] **Passo 2: Escrever `app/js/ui.js`**

```js
// Helpers compartilhados pelas telas da área logada.

export function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

export function mostrarErro(elemento, mensagem) {
  elemento.textContent = mensagem;
  elemento.hidden = false;
}

export function limparErro(elemento) {
  elemento.textContent = '';
  elemento.hidden = true;
}

export function formatarData(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function diasDesde(iso) {
  if (!iso) return Infinity;
  const umDia = 24 * 60 * 60 * 1000;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(iso); alvo.setHours(0, 0, 0, 0);
  return Math.round((hoje - alvo) / umDia);
}

export function textoDiasDesde(iso) {
  if (!iso) return 'sem registros';
  const d = diasDesde(iso);
  if (d <= 0) return 'hoje';
  if (d === 1) return 'ontem';
  return `há ${d} dias`;
}
```

- [ ] **Passo 3: Verificar visualmente**

Crie `app/teste-visual.html` temporário que carregue `app/css/app.css` e mostre
uma amostra de cada classe (um `.cartao` com um `.chip`, os três botões, um
`.campo` com `.campo-erro`, um `.aviso`, um `.vazio`, a `.app-topo` e a
`.app-nav`). Abra no navegador em largura de celular (DevTools, 390px).

Esperado: fundo preto quente, texto claro, vermelho ember nos elementos
primários, botões com no mínimo 48px de altura, nenhuma barra de rolagem
horizontal, e a navegação inferior sem cobrir o conteúdo.

- [ ] **Passo 4: Verificar os helpers**

No console do navegador, com `app/js/ui.js` importado:

```js
esc('<script>alert(1)</script>')        // "&lt;script&gt;alert(1)&lt;/script&gt;"
textoDiasDesde(null)                     // "sem registros"
textoDiasDesde(new Date().toISOString()) // "hoje"
```

Esperado: exatamente esses três valores. O primeiro é o que impede que o nome de
um exercício vire código executável na tela do aluno.

- [ ] **Passo 5: Apagar o arquivo temporário e commitar**

```bash
rm app/teste-visual.html
git add app/css/app.css app/js/ui.js
git commit -m "Adiciona fundacao visual e helpers da area logada"
```

---

### Task 6: Login e guarda de sessão

**Files:**
- Criar: `app/js/auth.js`
- Criar: `app/index.html`

**Interfaces:**
- Consome: `sb` (Task 1), `mostrarErro`/`limparErro` (Task 5).
- Produz: `app/js/auth.js` exportando
  `entrar(email, senha) -> Promise<{ok:boolean, erro?:string, papel?:string}>`,
  `sair() -> Promise<void>`,
  `perfilAtual() -> Promise<{id,nome,papel,personal_id,telefone}|null>`,
  `exigirSessao(papel) -> Promise<perfil>` (redireciona para `index.html` se não
  houver sessão, e para o painel correto se o papel não bater),
  `trocarSenha(nova) -> Promise<{ok:boolean, erro?:string}>`,
  `paginaDoPapel(papel) -> string`.
  Toda tela das Tasks 7–16 começa chamando `exigirSessao`.

- [ ] **Passo 1: Escrever `app/js/auth.js`**

```js
import { sb } from './supabase.js';

export function paginaDoPapel(papel) {
  return papel === 'personal' ? 'personal.html' : 'treino.html';
}

export async function entrar(email, senha) {
  const { error } = await sb.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: senha,
  });
  // Mensagem própria: a do serviço vem em inglês e vaza detalhe interno.
  if (error) return { ok: false, erro: 'E-mail ou senha incorretos.' };

  const perfil = await perfilAtual();
  if (!perfil) {
    await sair();
    return { ok: false, erro: 'Sua conta existe, mas não tem perfil. Fale com seu personal.' };
  }
  return { ok: true, papel: perfil.papel };
}

export async function sair() {
  await sb.auth.signOut();
}

export async function perfilAtual() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb
    .from('profiles')
    .select('id, nome, papel, personal_id, telefone')
    .eq('id', user.id)
    .single();
  return data ?? null;
}

// Guarda de página. Chamada no início de cada tela logada.
export async function exigirSessao(papel) {
  const perfil = await perfilAtual();
  if (!perfil) {
    window.location.replace('index.html');
    throw new Error('sem sessao');
  }
  if (papel && perfil.papel !== papel) {
    window.location.replace(paginaDoPapel(perfil.papel));
    throw new Error('papel incorreto');
  }
  return perfil;
}

export async function trocarSenha(nova) {
  if (!nova || nova.length < 6) {
    return { ok: false, erro: 'A senha precisa ter ao menos 6 caracteres.' };
  }
  const { error } = await sb.auth.updateUser({ password: nova });
  if (error) return { ok: false, erro: 'Não foi possível alterar a senha.' };
  return { ok: true };
}
```

Note que `exigirSessao` lança depois de redirecionar: isso interrompe o resto do
script da página, que senão continuaria rodando durante a navegação e tentaria
desenhar dados que não existem.

- [ ] **Passo 2: Escrever `app/index.html`**

Página com: o logo (`../assets/logo.jpg`), o título "Área de Treino", um
formulário com `#email`, `#senha`, um botão `#entrar` (`.btn.btn-primario`), um
`<p class="aviso" id="erro" hidden>` e um script de módulo inline que:

1. Se já houver sessão (`perfilAtual()`), redireciona direto para
   `paginaDoPapel(perfil.papel)` — quem já entrou não vê a tela de login de novo.
2. No `submit` do formulário: desabilita o botão e troca o texto para "Entrando…",
   chama `entrar()`, e em caso de erro mostra a mensagem no `#erro` e reabilita
   o botão; em caso de sucesso redireciona para `paginaDoPapel(papel)`.

O formulário usa `<form>` com `submit` (não `click` no botão), para o teclado do
celular oferecer "Ir" e o Enter funcionar.

- [ ] **Passo 3: Verificar o caminho infeliz**

Abra `/app/`, tente entrar com `personal1@teste.local` e a senha `errada`.
Esperado: "E-mail ou senha incorretos." no `#erro`, botão reabilitado, sem
navegação.

- [ ] **Passo 4: Verificar o caminho feliz e a guarda de papel**

1. Entre com `personal1@teste.local` / `senha123`.
   Esperado: vai para `personal.html` (ainda um 404 ou página vazia — normal,
   ela nasce na Task 7; o que se verifica aqui é o destino da URL).
2. Entre com `aluno1@teste.local` / `senha123`.
   Esperado: vai para `treino.html`.
3. Com a sessão do aluno aberta, digite `/app/personal.html` na barra de
   endereço.
   Esperado: volta sozinho para `treino.html`. Esta é a guarda de papel
   funcionando — e é apenas conveniência de navegação; a segurança real é o RLS
   da Task 3.
4. Abra `/app/` já logado.
   Esperado: redireciona direto para o painel, sem mostrar o formulário.

- [ ] **Passo 5: Commitar**

```bash
git add app/js/auth.js app/index.html
git commit -m "Adiciona login e guarda de sessao"
```

---

### Task 7: Painel do personal — lista de alunos e cadastro

**Files:**
- Criar: `app/personal.html`
- Criar: `app/js/personal-alunos.js`

**Interfaces:**
- Consome: `exigirSessao`, `sair` (Task 6); `esc`, `textoDiasDesde`,
  `mostrarErro`, `limparErro` (Task 5); `sb` (Task 1); Edge Function
  `criar-aluno` (Task 4).
- Produz: navegação para `aluno-detalhe.html?id=<uuid do aluno>`, formato de URL
  consumido pela Task 8.

- [ ] **Passo 1: Escrever a página**

`app/personal.html`: `.app-topo` com o nome do personal em
`<span id="nome-personal">` e um botão `#sair` com o texto "Sair";
`.app-conteudo` com um `<p class="aviso" id="erro" hidden>`, um campo de busca
`#busca`, um botão `#novo-aluno` (`.btn.btn-primario`, texto "Novo aluno"), uma
`<ul id="lista">` e um `<div class="vazio" id="vazio" hidden>` com o texto
"Você ainda não tem alunos. Toque em Novo aluno para cadastrar o primeiro."

Os sete identificadores acima (`nome-personal`, `sair`, `erro`, `busca`,
`novo-aluno`, `lista`, `vazio`) são exatamente os que o script do passo 2
procura. Divergir de qualquer um quebra a tela silenciosamente.

O modal de cadastro é um `<dialog id="dlg-novo">` com os campos `#n-nome`,
`#n-email`, `#n-telefone`, `#n-senha`, um `#n-erro` e os botões "Cancelar" e
"Cadastrar". `<dialog>` é nativo e já entrega foco preso e fechar com Esc, o que
seria trabalhoso de refazer à mão.

- [ ] **Passo 2: Escrever `app/js/personal-alunos.js`**

```js
import { sb } from './supabase.js';
import { exigirSessao, sair } from './auth.js';
import { esc, textoDiasDesde, mostrarErro, limparErro } from './ui.js';

const perfil = await exigirSessao('personal');
document.getElementById('nome-personal').textContent = perfil.nome;
document.getElementById('sair').onclick = async () => {
  await sair();
  window.location.replace('index.html');
};

let alunos = [];

async function carregar() {
  // Sem filtro por personal_id: o RLS já limita aos alunos deste personal.
  // Filtrar aqui de novo só esconderia um eventual furo de política.
  const { data, error } = await sb
    .from('profiles')
    .select('id, nome, telefone')
    .eq('papel', 'aluno')
    .order('nome');

  if (error) {
    mostrarErro(document.getElementById('erro'), 'Não foi possível carregar seus alunos.');
    return;
  }
  alunos = data ?? [];
  // A última sessão de cada aluno só existe a partir da Fase 2; até lá a
  // lista mostra "sem registros", o que é o estado verdadeiro.
  desenhar();
}

function desenhar() {
  const termo = document.getElementById('busca').value.trim().toLowerCase();
  const visiveis = alunos.filter((a) => a.nome.toLowerCase().includes(termo));
  const lista = document.getElementById('lista');
  document.getElementById('vazio').hidden = alunos.length > 0;

  lista.innerHTML = visiveis.map((a) => `
    <li class="cartao">
      <a href="aluno-detalhe.html?id=${esc(a.id)}">
        <strong>${esc(a.nome)}</strong>
        <span class="chip">${esc(textoDiasDesde(a.ultima_sessao ?? null))}</span>
      </a>
    </li>`).join('');
}

document.getElementById('busca').oninput = desenhar;
```

Acrescente o tratamento do `<dialog>`: abrir no clique de `#novo-aluno`; no
envio, validar que nome, e-mail e senha (mínimo 6) estão preenchidos, desabilitar
o botão, chamar

```js
const { data, error } = await sb.functions.invoke('criar-aluno', {
  body: { nome, email, telefone, senha },
});
```

e tratar três desfechos: erro de rede (`error`), recusa da função
(`data.ok === false` → mostrar `data.erro` em `#n-erro`), e sucesso
(`data.ok === true` → fechar o modal, mostrar um aviso com a senha para o
personal repassar ao aluno, e chamar `carregar()`).

- [ ] **Passo 3: Verificar a lista vazia**

Entre como o personal real criado na Task 4, passo 5 (que não tem alunos).
Esperado: o texto de estado vazio, sem erro no console.

- [ ] **Passo 4: Verificar o cadastro**

Cadastre um aluno com nome, um e-mail novo e senha de 6+ caracteres.
Esperado: o modal fecha, a senha aparece para repasse, e o aluno surge na lista.
Confirme no banco:

```sql
select nome, papel, personal_id from public.profiles where papel = 'aluno'
 order by criado_em desc limit 1;
-- ESPERADO: personal_id = id do personal que está logado
```

- [ ] **Passo 5: Verificar o isolamento na tela real**

Entre como `personal2@teste.local`.
Esperado: a lista mostra "Aluno Dois" e **não** mostra "Aluno Um" nem o aluno
recém-criado. É o RLS agindo através da interface.

- [ ] **Passo 6: Verificar a busca e o escape**

Cadastre um aluno chamado `<b>Teste</b>`.
Esperado: o nome aparece literalmente com as tags visíveis, sem negrito — prova
de que `esc()` está sendo aplicado. Digite "tes" na busca e confirme que a lista
filtra.

- [ ] **Passo 7: Commitar**

```bash
git add app/personal.html app/js/personal-alunos.js
git commit -m "Adiciona lista de alunos e cadastro no painel do personal"
```

---

### Task 8: Painel do personal — tela do aluno

**Files:**
- Criar: `app/aluno-detalhe.html`
- Criar: `app/js/personal-aluno.js`

**Interfaces:**
- Consome: `aluno-detalhe.html?id=<uuid>` (Task 7); `sb`, `exigirSessao`, `esc`,
  `formatarData`.
- Produz: navegação para `plano.html?aluno=<uuid>` (plano novo) e
  `plano.html?id=<uuid do plano>` (editar), formatos consumidos pela Task 9.
  Produz também a aba `#aba-historico`, preenchida na Task 16 e, até lá, exibindo
  o estado vazio.

- [ ] **Passo 1: Escrever a página**

`.app-topo` com o nome do aluno e um voltar para `personal.html`. Abaixo, duas
abas: **Planos** (`#aba-planos`) e **Histórico** (`#aba-historico`). A aba Planos
tem um botão "Novo plano" e a lista de planos; cada plano mostra nome, objetivo,
um `.chip` "Ativo" quando `ativo`, a data de início, e os botões "Editar" e
"Ativar" (este último oculto quando o plano já está ativo). A aba Histórico, na
Fase 1, mostra apenas `<div class="vazio">Nenhum treino registrado ainda.</div>`.

- [ ] **Passo 2: Escrever `app/js/personal-aluno.js`**

Estrutura:

```js
import { sb } from './supabase.js';
import { exigirSessao } from './auth.js';
import { esc, formatarData, mostrarErro } from './ui.js';

await exigirSessao('personal');

const alunoId = new URLSearchParams(location.search).get('id');
if (!alunoId) window.location.replace('personal.html');

const { data: aluno } = await sb
  .from('profiles').select('id, nome, telefone').eq('id', alunoId).single();

// Se o RLS não devolveu o aluno, ele não é deste personal — ou não existe.
// Nos dois casos a resposta é a mesma, para não revelar a existência da conta.
if (!aluno) {
  document.body.innerHTML =
    '<div class="vazio">Aluno não encontrado.</div>';
  throw new Error('aluno inacessivel');
}
```

Em seguida, carregue os planos
(`sb.from('planos').select('id, nome, objetivo, ativo, inicio').eq('aluno_id', alunoId).order('criado_em', { ascending: false })`)
e desenhe-os. "Ativar" faz duas escritas em sequência: desativa todos os planos
daquele aluno, depois ativa o escolhido — e recarrega a lista.

- [ ] **Passo 3: Verificar com dados reais**

Crie um plano à mão para o aluno de teste:

```sql
insert into public.planos (aluno_id, personal_id, nome, objetivo, ativo)
values ('<id do aluno>', '<id do personal>', 'Plano Teste', 'Hipertrofia', true);
```

Abra `aluno-detalhe.html?id=<id do aluno>`.
Esperado: o plano listado com o chip "Ativo" e o objetivo visível.

- [ ] **Passo 4: Verificar a tentativa de acesso cruzado**

Logado como `personal2@teste.local`, abra
`aluno-detalhe.html?id=33333333-3333-3333-3333-333333333333` (aluno do
Personal Um).
Esperado: "Aluno não encontrado." e nenhum dado do aluno alheio na tela nem no
console. O RLS bloqueia no banco; a tela apenas apresenta isso com dignidade.

- [ ] **Passo 5: Verificar a ativação exclusiva**

Crie um segundo plano para o mesmo aluno e clique em "Ativar" nele.
Esperado: o chip "Ativo" migra para o segundo plano e some do primeiro. Confirme:

```sql
select nome, ativo from public.planos where aluno_id = '<id do aluno>';
-- ESPERADO: exatamente uma linha com ativo = true
```

- [ ] **Passo 6: Commitar**

```bash
git add app/aluno-detalhe.html app/js/personal-aluno.js
git commit -m "Adiciona tela do aluno no painel do personal"
```

---

### Task 9: Editor de plano

A tarefa mais densa da Fase 1. É onde o personal passa o tempo dele.

**Files:**
- Criar: `app/plano.html`
- Criar: `app/js/plano-editor.js`

> **Ordem de execução:** a Task 10 (`video.js`) roda **antes** desta. O plano
> original deixava a ordem em aberto; o controlador decidiu (ruling PF-1). Quando
> você receber esta tarefa, `app/js/video.js` já existe.

**Interfaces:**
- Consome: `plano.html?aluno=<uuid>` e `plano.html?id=<uuid>` (Task 8);
  `sb`, `exigirSessao`, `esc`, `mostrarErro`; `resolverVideo` (Task 10, já pronta).
- Produz: linhas em `planos`, `divisoes` e `exercicios` com os campos da Task 2.
  A tela do aluno (Task 11) lê exatamente essa estrutura.

- [ ] **Passo 1: Escrever a estrutura da página**

Cabeçalho do plano: `#p-nome`, `#p-objetivo`, `#p-inicio`, `#p-fim`.
Abaixo, `<div id="divisoes">`, um botão "Adicionar divisão", e uma barra fixa
inferior com "Salvar" (`.btn.btn-primario`) e o indicador `#estado` ("Salvo" /
"Alterações não salvas").

Cada divisão é um bloco expansível com: `nome`, `foco`, botões de subir/descer/
remover, a lista de exercícios e um botão "Adicionar exercício".
Cada exercício tem os campos `nome`, `series`, `repeticoes`, `carga`,
`descanso_seg`, `observacoes`, `video_url`, mais subir/descer/remover.

Sob o campo de vídeo, o texto de ajuda fixo:
> "Cole o link do YouTube. Dica: publique o vídeo como 'não listado' — ele não
> aparece em buscas, mas funciona pelo link."

- [ ] **Passo 2: Modelar o estado em memória**

O editor trabalha sobre um objeto em memória e só escreve no banco ao salvar.
Isso evita dezenas de idas ao servidor enquanto o personal digita.

```js
// Forma do estado. `id` nulo significa "ainda não existe no banco".
let plano = {
  id: null, aluno_id: null, nome: '', objetivo: '', inicio: null, fim: null,
  divisoes: [
    { id: null, nome: 'Treino A', foco: '', ordem: 0, exercicios: [
      { id: null, nome: '', series: null, repeticoes: '', carga: '',
        descanso_seg: null, observacoes: '', video_url: '', ordem: 0 },
    ]},
  ],
};
let sujo = false; // há alterações não salvas?
```

Toda alteração de campo marca `sujo = true` e atualiza `#estado`.

- [ ] **Passo 3: Carregar um plano existente**

Quando a URL traz `?id=`, busque em três consultas e monte a árvore:

```js
const { data: p } = await sb.from('planos')
  .select('id, aluno_id, nome, objetivo, inicio, fim').eq('id', planoId).single();
const { data: ds } = await sb.from('divisoes')
  .select('id, nome, foco, ordem').eq('plano_id', planoId).order('ordem');
const { data: exs } = await sb.from('exercicios')
  .select('id, divisao_id, nome, series, repeticoes, carga, descanso_seg, observacoes, video_url, ordem')
  .in('divisao_id', (ds ?? []).map((d) => d.id))
  .order('ordem');
```

Se `ds` estiver vazio, pule a consulta de exercícios — `.in()` com lista vazia
devolve tudo em algumas versões, o que traria exercícios de outros planos (o RLS
impediria o vazamento, mas a tela ficaria errada).

- [ ] **Passo 4: Implementar o salvamento**

Ao clicar em Salvar:

1. Validar: `plano.nome` não vazio; toda divisão com nome; todo exercício com
   nome. Erros aparecem junto do campo, e o primeiro campo inválido recebe foco.
2. Se `plano.id` é nulo, inserir o plano (com `aluno_id` da URL e `personal_id` =
   id do personal logado) e guardar o id devolvido.
3. Para cada divisão: `upsert` com `ordem` = índice atual. Guardar os ids.
4. Para cada exercício: `upsert` com `divisao_id` e `ordem` = índice atual.
5. Apagar do banco as divisões e exercícios que existiam no carregamento e não
   estão mais no estado (guarde os ids originais ao carregar e compare).
6. `sujo = false`, `#estado` mostra "Salvo".

Campos numéricos vazios vão como `null`, nunca como string vazia — `series: ''`
é erro de tipo no Postgres.

- [ ] **Passo 5: Proteger contra perda de trabalho**

```js
window.addEventListener('beforeunload', (e) => {
  if (sujo) { e.preventDefault(); e.returnValue = ''; }
});
```

- [ ] **Passo 6: Verificar a criação**

Pelo painel: aluno → "Novo plano" → nomeie, crie Treino A com dois exercícios
(um com link do YouTube) e Treino B com um. Salve.
Esperado: "Salvo". Confirme no banco:

```sql
select d.nome as divisao, e.nome as exercicio, e.series, e.repeticoes, e.ordem
  from public.divisoes d
  join public.exercicios e on e.divisao_id = d.id
 where d.plano_id = '<id do plano>'
 order by d.ordem, e.ordem;
-- ESPERADO: 3 linhas, Treino A com ordem 0 e 1, Treino B com ordem 0
```

- [ ] **Passo 7: Verificar edição, reordenação e remoção**

Reabra o plano, troque a ordem de dois exercícios, remova um e altere um nome.
Salve e recarregue a página.
Esperado: a tela reabre exatamente no estado salvo. Confirme com a mesma consulta
do passo 6 que o exercício removido sumiu e que os `ordem` refletem a nova
sequência.

- [ ] **Passo 8: Verificar o aviso de saída**

Altere um campo e tente fechar a aba.
Esperado: o navegador pergunta se quer sair. Após salvar, fechar não pergunta
mais.

- [ ] **Passo 9: Commitar**

```bash
git add app/plano.html app/js/plano-editor.js
git commit -m "Adiciona editor de plano de treino"
```

---

### Task 10: Vídeo

**Files:**
- Criar: `app/js/video.js`

**Interfaces:**
- Consome: `esc` (Task 5).
- Produz:
  `resolverVideo(url) -> {tipo:'youtube', embedUrl:string} | {tipo:'externo', url:string} | null`
  e `abrirVideo(url, titulo) -> void`. Consumidos pelas Tasks 9 e 11.

- [ ] **Passo 1: Escrever o resolvedor**

```js
import { esc } from './ui.js';

// YouTube é a única plataforma que incorpora de forma confiável sem chave de
// API. Instagram e TikTok exigem oEmbed autenticado, então viram link externo.
export function resolverVideo(url) {
  if (!url) return null;
  const limpa = String(url).trim();

  let id = null;
  const padroes = [
    /(?:youtube\.com\/watch\?[^#]*\bv=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of padroes) {
    const m = limpa.match(p);
    if (m) { id = m[1]; break; }
  }
  if (id) return { tipo: 'youtube', embedUrl: `https://www.youtube.com/embed/${id}?rel=0` };

  if (/^https?:\/\//i.test(limpa)) return { tipo: 'externo', url: limpa };
  return null; // não é URL utilizável
}
```

- [ ] **Passo 2: Escrever a janela de vídeo**

`abrirVideo(url, titulo)` cria (uma vez, e reaproveita) um `<dialog id="dlg-video">`
com o título e um `<iframe allowfullscreen>` quando o tipo é `youtube`, ou uma
mensagem com um link "Abrir vídeo" (`target="_blank" rel="noopener"`) quando é
`externo`. Ao fechar, **zere o `src` do iframe** — sem isso o vídeo continua
tocando com o modal fechado, o que é desconcertante no meio do treino.

- [ ] **Passo 3: Verificar o resolvedor**

No console:

```js
resolverVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
// { tipo:'youtube', embedUrl:'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0' }
resolverVideo('https://youtu.be/dQw4w9WgXcQ')            // mesmo embedUrl
resolverVideo('https://www.youtube.com/shorts/dQw4w9WgXcQ') // mesmo embedUrl
resolverVideo('https://www.instagram.com/reel/ABC123/')  // { tipo:'externo', url:'...' }
resolverVideo('banana')                                   // null
resolverVideo('')                                         // null
```

Esperado: exatamente esses seis resultados.

- [ ] **Passo 4: Verificar a janela**

Chame `abrirVideo` com um link do YouTube: o vídeo toca dentro do modal. Feche e
confirme que o áudio para. Chame com um link do Instagram: aparece o link, que
abre em nova aba.

- [ ] **Passo 5: Commitar**

```bash
git add app/js/video.js
git commit -m "Adiciona resolucao e exibicao de video de exercicio"
```

---

### Task 11: Painel do aluno — Hoje e Treino (leitura)

**Files:**
- Criar: `app/treino.html`
- Criar: `app/js/aluno-treino.js`

**Interfaces:**
- Consome: `sb`, `exigirSessao`, `sair`, `trocarSenha`, `esc`, `textoDiasDesde`,
  `resolverVideo`, `abrirVideo`.
- Produz: as telas `#tela-hoje`, `#tela-treino`, `#tela-historico` (vazia até a
  Task 15) e `#tela-perfil`, alternadas pela `.app-nav`. A Task 13 acrescenta os
  campos de registro dentro de `#tela-treino`; a Task 15 preenche
  `#tela-historico`.

- [ ] **Passo 1: Escrever a estrutura**

Página única com quatro seções e uma `.app-nav` inferior de quatro itens: Hoje,
Treino, Histórico, Perfil. Alternar seção não recarrega a página; a seção atual
fica no `hash` da URL (`#hoje`, `#treino`), para o botão voltar do celular fazer
o que o aluno espera.

Projete estas telas **primeiro para o celular**: é onde elas serão usadas.

- [ ] **Passo 2: Implementar a tela Hoje**

Busque o plano ativo e suas divisões:

```js
const perfil = await exigirSessao('aluno');

const { data: plano } = await sb.from('planos')
  .select('id, nome, objetivo')
  .eq('aluno_id', perfil.id).eq('ativo', true)
  .order('criado_em', { ascending: false })
  .limit(1).maybeSingle();
```

Se não houver plano ativo, mostre:
> "Você ainda não tem um treino ativo. Fale com seu personal."

Havendo plano, liste as divisões em cartões com nome, foco e a contagem de
exercícios. O indicador "há N dias" usa `textoDiasDesde(null)` na Fase 1 — ou
seja, mostra "sem registros" — e passa a ter dado real na Task 14.

Use `maybeSingle()`, não `single()`: `single()` trata zero linhas como erro, e
aluno sem plano é uma situação normal, não uma falha.

- [ ] **Passo 3: Implementar a tela Treino**

Ao tocar num cartão de divisão, carregue os exercícios daquela divisão ordenados
por `ordem` e desenhe um cartão por exercício com:

- nome em destaque;
- a linha de prescrição em corpo grande e alto contraste:
  `4 × 8-12 · 40kg · 60s` (omita as partes ausentes e não deixe separadores
  órfãos);
- as observações do personal, quando houver;
- um botão "Ver execução" quando `resolverVideo(video_url)` não for nulo; quando
  for nulo, nenhum botão (um botão que não faz nada é pior que botão nenhum).

- [ ] **Passo 4: Implementar a tela Perfil**

Nome, e-mail, um formulário de troca de senha (`#nova-senha` + confirmação) que
chama `trocarSenha`, e o botão Sair. Acima do formulário, o texto:
> "Sua senha foi criada pelo seu personal. Recomendamos trocá-la agora."

Ao trocar com sucesso, mostre "Senha alterada." e limpe os campos.

- [ ] **Passo 5: Verificar o fluxo do aluno**

Entre como o aluno que tem o plano criado na Task 9.
Esperado: Hoje mostra os cartões Treino A e Treino B com a contagem certa de
exercícios; tocar em Treino A lista os dois exercícios com a prescrição
correta; "Ver execução" abre o vídeo; o exercício sem vídeo não mostra o botão.

- [ ] **Passo 6: Verificar o aluno sem plano**

Entre como um aluno recém-cadastrado, sem plano.
Esperado: a mensagem "Você ainda não tem um treino ativo. Fale com seu personal."
e nenhum erro no console.

- [ ] **Passo 7: Verificar a troca de senha**

Troque a senha pelo Perfil, saia e entre com a nova.
Esperado: entra. A senha antiga deixa de funcionar.

- [ ] **Passo 8: Verificar no celular**

Em 390px de largura: nenhuma rolagem horizontal, números legíveis à distância de
um braço, alvos de toque confortáveis, a `.app-nav` sem cobrir o último
exercício da lista.

- [ ] **Passo 9: Commitar**

```bash
git add app/treino.html app/js/aluno-treino.js
git commit -m "Adiciona painel do aluno com treino e video"
```

---

### Task 12: Publicação e verificação ponta a ponta da Fase 1

**Files:**
- Modificar: `.vercelignore`
- Modificar: `README.md`

**Interfaces:**
- Consome: tudo das Tasks 1–11.
- Produz: a área logada acessível em `/app` no domínio de produção.

- [ ] **Passo 1: Conferir que a Vercel serve `app/`**

Leia `.vercelignore` e confirme que nada em `app/` está excluído. `vercel.json`
já está configurado como site estático sem build (`framework: null`), o que
serve `app/index.html` em `/app` sem alteração — não mexa nele sem necessidade
comprovada.

> **Os passos 2, 3 e 4 não rodam durante a implementação.** O trabalho acontece
> numa branch isolada justamente para o `master` — de onde a Vercel publica — não
> receber código pela metade. Publicar e verificar em produção acontece **depois
> do merge**, conduzido pelo dono do projeto. Se você é um implementador, execute
> os passos 1, 5 e 6 e reporte os passos 2-4 como adiados por decisão do
> controlador (ruling PF-5), não como falhos.

- [ ] **Passo 2 (adiado — pós-merge): Publicar**

Faça o push para `master`. A Vercel publica sozinha.

- [ ] **Passo 3 (adiado — pós-merge): Verificar em produção**

Abra `https://<dominio>/app` numa janela anônima.
Esperado: a tela de login carrega, sem erro de CORS no console. Se houver erro de
CORS, o domínio de produção precisa ser adicionado às Redirect URLs do Supabase
(Authentication → URL Configuration).

- [ ] **Passo 4 (adiado — pós-merge): Rodar o roteiro completo em produção**

Do começo ao fim, num aparelho celular de verdade se possível:

1. Personal entra.
2. Cadastra um aluno.
3. Monta um plano com duas divisões e exercícios, um deles com vídeo.
4. Ativa o plano.
5. Sai.
6. Aluno entra com a senha recebida.
7. Vê Hoje com as duas divisões.
8. Abre Treino A e lê a prescrição.
9. Abre o vídeo de execução.
10. Troca a senha no Perfil.
11. Sai e volta a entrar com a nova senha.

Registre o resultado de cada passo. Qualquer um que falhe vira correção antes de
declarar a Fase 1 pronta.

- [ ] **Passo 5: Confirmar que o site institucional não regrediu**

Abra `https://<dominio>/`.
Esperado: exatamente o site de antes. Confirme também que
`git diff <commit anterior à Task 1> --stat -- index.html css js assets` não
mostra nenhuma alteração.

- [ ] **Passo 6: Documentar e commitar**

Acrescente ao `README.md` uma seção "Área do personal" com: a URL, os dois
perfis, como se cria a conta de um personal (à mão, como na Task 4 passo 5), e
onde ficam a spec e este plano.

```bash
git add README.md .vercelignore
git commit -m "Publica area do personal e documenta o acesso"
```

---

# FASE 2 — REGISTRO E HISTÓRICO

Nada do que a Fase 1 construiu é alterado estruturalmente: as tabelas `sessoes` e
`registros` e suas políticas já existem desde as Tasks 2 e 3.

---

### Task 13: Aluno registra o treino

**Files:**
- Modificar: `app/treino.html`
- Modificar: `app/js/aluno-treino.js`
- Criar: `app/js/rascunho.js`

**Interfaces:**
- Consome: `sessoes` e `registros` (Task 2), políticas (Task 3).
- Produz: `app/js/rascunho.js` exportando
  `lerRascunho(divisaoId) -> {[exercicioId]: {carga, repeticoes, feito}}`,
  `salvarRascunho(divisaoId, dados) -> void`,
  `limparRascunho(divisaoId) -> void`.
  Produz linhas em `sessoes`/`registros`, lidas pelas Tasks 14, 15 e 16.

- [ ] **Passo 1: Escrever o rascunho local**

```js
// O que o aluno digita fica no aparelho até ele concluir o treino. Fechar o app
// sem querer no meio da série não pode custar o registro.
const chave = (divisaoId) => `allazfit-rascunho-${divisaoId}`;

export function lerRascunho(divisaoId) {
  try { return JSON.parse(localStorage.getItem(chave(divisaoId))) ?? {}; }
  catch { return {}; }
}

export function salvarRascunho(divisaoId, dados) {
  try { localStorage.setItem(chave(divisaoId), JSON.stringify(dados)); }
  catch { /* modo privado ou cota cheia: o treino continua, só não persiste */ }
}

export function limparRascunho(divisaoId) {
  try { localStorage.removeItem(chave(divisaoId)); } catch { /* idem */ }
}
```

Os `try/catch` não são decoração: no modo privado do Safari o `localStorage`
lança, e sem isso a tela de treino quebraria inteira por causa de um rascunho.

- [ ] **Passo 2: Acrescentar os campos na tela Treino**

Em cada cartão de exercício, abaixo da prescrição: `carga` (`inputmode="decimal"`),
`repeticoes` (`inputmode="numeric"`) e um check "Feito". Ao fim da lista, um campo
de observação da sessão e o botão "Concluir treino" (`.btn.btn-primario`).

Cada alteração chama `salvarRascunho`. Ao abrir a divisão, `lerRascunho` repovoa
os campos.

- [ ] **Passo 3: Implementar a conclusão**

```js
// Uma sessão, depois os registros dela. Se os registros falharem, a sessão é
// apagada — meia sessão salva corromperia o histórico de forma silenciosa.
const { data: sessao, error: erroSessao } = await sb
  .from('sessoes')
  .insert({ aluno_id: perfil.id, divisao_id: divisaoId, observacao: observacao || null })
  .select('id').single();

if (erroSessao) { mostrarErro(elErro, 'Não foi possível salvar o treino.'); return; }

const linhas = exercicios.map((ex) => {
  const r = rascunho[ex.id] ?? {};
  return {
    sessao_id: sessao.id,
    exercicio_id: ex.id,
    carga: r.carga === '' || r.carga == null ? null : Number(r.carga),
    repeticoes: r.repeticoes === '' || r.repeticoes == null ? null : Number(r.repeticoes),
    feito: r.feito ?? false,
  };
});

const { error: erroRegistros } = await sb.from('registros').insert(linhas);
if (erroRegistros) {
  await sb.from('sessoes').delete().eq('id', sessao.id);
  mostrarErro(elErro, 'Não foi possível salvar o treino.');
  return;
}

limparRascunho(divisaoId);
```

Ao concluir, mostre "Treino registrado." e volte para a tela Hoje.

- [ ] **Passo 4: Verificar o registro**

Como aluno, abra Treino A, preencha carga e reps em um exercício, marque os dois
como feitos, escreva uma observação e conclua.
Esperado: mensagem de sucesso e volta para Hoje. Confirme:

```sql
select s.observacao, e.nome, r.carga, r.repeticoes, r.feito
  from public.sessoes s
  join public.registros r on r.sessao_id = s.id
  join public.exercicios e on e.id = r.exercicio_id
 where s.aluno_id = '<id do aluno>'
 order by s.concluido_em desc;
-- ESPERADO: uma linha por exercício da divisão, com os valores digitados
```

- [ ] **Passo 5: Verificar o rascunho**

Preencha alguns campos, feche a aba sem concluir, reabra e volte à mesma divisão.
Esperado: os valores estão lá. Conclua o treino e reabra.
Esperado: os campos estão limpos — o rascunho foi consumido.

- [ ] **Passo 6: Verificar o campo vazio**

Conclua um treino deixando a carga em branco num exercício.
Esperado: salva com `carga` nula, sem erro. Confirme na consulta do passo 4 que a
coluna veio `NULL` e não `0` — zero seria uma mentira sobre o que o aluno fez.

- [ ] **Passo 7: Commitar**

```bash
git add app/js/rascunho.js app/treino.html app/js/aluno-treino.js
git commit -m "Permite ao aluno registrar cargas e concluir o treino"
```

---

### Task 14: "Da última vez" e dias desde o último treino

**Files:**
- Modificar: `app/js/aluno-treino.js`

**Interfaces:**
- Consome: `sessoes` e `registros` (Task 13); `textoDiasDesde` (Task 5).
- Produz: nenhuma interface nova; enriquece telas existentes.

- [ ] **Passo 1: Buscar o último registro de cada exercício**

Ao abrir uma divisão, uma consulta só para todos os exercícios dela:

```js
const { data: anteriores } = await sb
  .from('registros')
  .select('exercicio_id, carga, repeticoes, sessoes!inner(concluido_em)')
  .in('exercicio_id', exercicios.map((e) => e.id))
  .order('concluido_em', { referencedTable: 'sessoes', ascending: false });

// Primeira ocorrência de cada exercício = a mais recente.
const ultimo = {};
for (const r of anteriores ?? []) {
  if (!(r.exercicio_id in ultimo)) ultimo[r.exercicio_id] = r;
}
```

Exiba abaixo do nome, quando houver: **"da última vez: 40kg × 10"**. Se a carga
for nula mas houver repetições, mostre só as repetições; se ambas forem nulas,
não mostre nada.

- [ ] **Passo 2: Dias desde o último treino, na tela Hoje**

```js
const { data: ultimas } = await sb
  .from('sessoes')
  .select('divisao_id, concluido_em')
  .in('divisao_id', divisoes.map((d) => d.id))
  .order('concluido_em', { ascending: false });

const ultimaPorDivisao = {};
for (const s of ultimas ?? []) {
  if (!(s.divisao_id in ultimaPorDivisao)) ultimaPorDivisao[s.divisao_id] = s.concluido_em;
}
```

Cada cartão passa a exibir `textoDiasDesde(ultimaPorDivisao[d.id] ?? null)` —
"hoje", "há 9 dias" ou "sem registros".

- [ ] **Passo 2 (continuação): Alimentar também a lista do personal**

Em `app/js/personal-alunos.js`, a função `carregar()` já desenha
`textoDiasDesde(a.ultima_sessao ?? null)`. Agora preencha `ultima_sessao`: após
buscar os alunos, consulte `sessoes` filtrando pelos ids deles, agrupe pela mesma
técnica de "primeira ocorrência" e atribua a cada aluno antes de `desenhar()`.

- [ ] **Passo 3: Verificar**

Com um aluno que já registrou um treino na Task 13, reabra a mesma divisão.
Esperado: "da última vez: <valores registrados>" sob os exercícios preenchidos, e
nada sob o que ficou em branco.

Na tela Hoje: a divisão treinada mostra "hoje"; as outras, "sem registros".

Na lista do personal: o aluno mostra "hoje"; os demais, "sem registros".

- [ ] **Passo 4: Verificar com duas sessões**

Registre a mesma divisão de novo com cargas diferentes e reabra.
Esperado: "da última vez" mostra os valores **mais recentes**, não os primeiros.
Este é o erro fácil de cometer aqui, então confirme de fato.

- [ ] **Passo 5: Commitar**

```bash
git add app/js/aluno-treino.js app/js/personal-alunos.js
git commit -m "Mostra ultima carga e dias desde o ultimo treino"
```

---

### Task 15: Histórico do aluno

**Files:**
- Criar: `app/js/aluno-historico.js`
- Modificar: `app/treino.html`

**Interfaces:**
- Consome: `sessoes`, `registros`, `divisoes`, `exercicios`.
- Produz: a tela `#tela-historico` preenchida.

- [ ] **Passo 1: Listar as sessões**

```js
const { data: sessoes } = await sb
  .from('sessoes')
  .select('id, concluido_em, observacao, divisoes!inner(id, nome, foco)')
  .eq('aluno_id', perfil.id)
  .order('concluido_em', { ascending: false })
  .limit(100);
```

Agrupe por divisão e desenhe um cartão por divisão: `"Treino A — 12 vezes,
última em 14/09/2026"`. Sem nenhuma sessão, mostre:
> "Seus treinos aparecem aqui depois que você concluir o primeiro."

O `limit(100)` é deliberado: sem ele, um aluno de dois anos traria centenas de
linhas para desenhar uma lista que ninguém rola até o fim.

- [ ] **Passo 2: Evolução por exercício**

Ao abrir um cartão de divisão, liste os exercícios dela; ao abrir um exercício,
mostre a progressão em lista cronológica decrescente:
`14/09/2026 — 40kg × 10`. Sem gráfico: a spec adiou isso conscientemente.

- [ ] **Passo 3: Verificar**

Com um aluno que tem duas sessões da mesma divisão, abra Histórico.
Esperado: "Treino A — 2 vezes, última em <data de hoje>". Abrindo o exercício,
as duas linhas em ordem da mais recente para a mais antiga, com os valores certos.

- [ ] **Passo 4: Verificar o estado vazio**

Como um aluno sem nenhuma sessão.
Esperado: a mensagem do passo 1, sem erro no console.

- [ ] **Passo 5: Commitar**

```bash
git add app/js/aluno-historico.js app/treino.html
git commit -m "Adiciona historico de treinos do aluno"
```

---

### Task 16: Histórico no painel do personal

**Files:**
- Modificar: `app/js/personal-aluno.js`
- Modificar: `app/aluno-detalhe.html`

**Interfaces:**
- Consome: as mesmas consultas da Task 15, com `aluno_id` fixado no aluno da URL.
- Produz: a aba `#aba-historico` preenchida.

- [ ] **Passo 1: Preencher a aba**

Reaproveite a lógica da Task 15, trocando `perfil.id` por `alunoId`. O RLS já
garante que só o personal daquele aluno recebe as linhas — não filtre por
personal no JavaScript.

Se as duas telas ficarem com código praticamente idêntico, extraia o que se
repete para `app/js/historico.js`, com uma função
`montarHistorico(alunoId, elementoRaiz) -> Promise<void>`, e faça as duas telas
chamarem-na. Decida isso ao ver o código: duplicar vinte linhas é aceitável,
duplicar cem não é.

- [ ] **Passo 2: Verificar**

Como personal, abra o aluno que registrou treinos → aba Histórico.
Esperado: as mesmas sessões que o aluno vê, com os mesmos valores.

- [ ] **Passo 3: Verificar o isolamento**

Como `personal2@teste.local`, tente abrir
`aluno-detalhe.html?id=<id de um aluno do Personal Um>`.
Esperado: "Aluno não encontrado." — e, no console e na aba de rede, **nenhuma
linha de sessão** do aluno alheio.

- [ ] **Passo 4: Commitar**

```bash
git add app/js/personal-aluno.js app/aluno-detalhe.html
git commit -m "Adiciona historico do aluno no painel do personal"
```

---

### Task 17: Verificação final e limpeza

**Files:**
- Modificar: `README.md`

- [ ] **Passo 1: Repetir os quatro testes de acesso da Task 3**

Rode de novo, sem alterações, os quatro blocos do passo 5 da Task 3. Muita coisa
mudou desde então; o que importa é que a resposta não mudou.
Esperado: os mesmos quatro resultados. Cole a saída no relatório.

- [ ] **Passo 2: Testes de acesso da Fase 2**

O mesmo envelope `begin; … rollback;` da Task 3 vale aqui, pelo mesmo motivo.

```sql
-- Personal Um lê as sessões do aluno dele.
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select count(*) from public.sessoes;
rollback;
-- ESPERADO: apenas as sessões dos alunos deste personal.
```

```sql
-- Personal Um NÃO consegue inventar uma sessão em nome do aluno dele.
-- divisao_id real, pelo mesmo motivo do teste (d) da Task 3.
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
insert into public.sessoes (aluno_id, divisao_id)
values ('33333333-3333-3333-3333-333333333333','bbbbbbbb-0000-0000-0000-000000000002');
rollback;
-- ESPERADO: erro de violação de política. O personal lê o histórico, não o escreve.
```

- [ ] **Passo 3: Roteiro completo em produção**

Repita o roteiro do passo 4 da Task 12, agora incluindo: registrar cargas,
concluir o treino, ver "da última vez" ao reabrir, abrir o Histórico do aluno e
conferir o mesmo histórico pelo painel do personal.

- [ ] **Passo 4: Conferir os avisos do Supabase**

Ferramentas: `get_advisors` para `security` e para `performance`.
Esperado: nenhum aviso de segurança. Avisos de desempenho, se houver, são
anotados no relatório — não necessariamente corrigidos agora.

- [ ] **Passo 5: Listar os dados de teste — e PARAR**

Apagar usuários é irreversível, e um `like` mal digitado alcança conta real. Por
isso **este passo não apaga nada**. Rode apenas o levantamento:

```sql
select id, email, created_at from auth.users
 where email like '%@teste.local' order by email;
```

Cole a lista no relatório e **encerre a tarefa aí**. O controlador apresenta a
lista ao dono do projeto, e o `DELETE` só roda com a aprovação dele. Não execute
`delete` em `auth.users` sob nenhuma circunstância, nem que pareça óbvio.

Para referência do controlador, o comando aprovado será:

```sql
delete from auth.users where email like '%@teste.local';
-- As tabelas em cascata levam profiles, planos, divisoes, exercicios,
-- sessoes e registros junto.
```

**Nunca** inclua a conta real do personal criada na Task 4, passo 5.

- [ ] **Passo 6: Atualizar o README e commitar**

Registre no `README.md` que a Fase 2 está concluída e o que ficou fora
(seção 8 da spec), para quem pegar o projeto depois saber o que é ausência
deliberada e não esquecimento.

```bash
git add README.md
git commit -m "Conclui a area do personal e registra verificacao final"
```

---

## Notas para quem executa

- **A Task 3 é o coração.** Se os quatro testes de isolamento não passarem
  exatamente como descrito, nada adiante importa. Não a contorne.
- **Não filtre por dono no JavaScript** achando que reforça a segurança. Isso
  esconde furos de política em vez de fechá-los. O banco filtra; o frontend
  apresenta.
- **Não invente conteúdo.** Onde o plano diz para perguntar ao dono do projeto
  (nome e e-mail do primeiro personal), pergunte.
- **Não declare passo verificado sem rodar a verificação** e olhar a saída.
- Se uma tarefa revelar complexidade que o plano não previu, pare e diga — não
  improvise um caminho alternativo silenciosamente.
