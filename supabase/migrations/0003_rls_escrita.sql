-- Correção 1 (T3-1): planos_escrita permitia a qualquer authenticated inserir um
-- plano com personal_id de si mesmo e aluno_id de um aluno alheio. Como
-- planos_select deixa o aluno ler onde aluno_id = auth.uid(), o plano injetado
-- aparecia na tela da vítima, e divisoes_escrita/exercicios_escrita herdavam o
-- furo. Passa a exigir também que o aluno seja aluno DESTE personal.
-- A condição vai no using e no with check: a política é `for all`, então o using
-- também governa quais linhas existentes podem ser alteradas/apagadas.
drop policy planos_escrita on public.planos;

create policy planos_escrita on public.planos for all to authenticated
  using (
    personal_id = auth.uid()
    and exists (select 1 from public.profiles pr
                 where pr.id = planos.aluno_id and pr.personal_id = auth.uid()))
  with check (
    personal_id = auth.uid()
    and exists (select 1 from public.profiles pr
                 where pr.id = planos.aluno_id and pr.personal_id = auth.uid()));

-- Correção 2 (T3-2): profiles_update_proprio permitia ao usuário reescrever
-- qualquer coluna da própria linha, inclusive papel e personal_id — o aluno se
-- desvinculava do personal (derrubando profiles_select/sessoes_select/
-- registros_select, que dependem de pr.personal_id = auth.uid()) e passava a se
-- apresentar como personal. A spec (seção 6) diz "o usuário atualiza o próprio
-- nome/telefone".
-- RLS não tem granularidade de coluna no with check, e uma subconsulta em
-- profiles dentro de uma política de profiles traria risco de recursão; por isso
-- a restrição é por privilégio de coluna. Vale para os dois papéis (ambos são
-- authenticated), o que é coerente: o personal também só precisa de nome e
-- telefone no aluno. service_role tem grant próprio e rolbypassrls, então a Edge
-- Function da Task 4 continua escrevendo papel e personal_id.
revoke update on public.profiles from authenticated;
grant update (nome, telefone) on public.profiles to authenticated;
