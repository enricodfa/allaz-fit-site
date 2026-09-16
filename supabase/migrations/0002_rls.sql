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
