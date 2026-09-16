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
