// Cria a conta de um aluno. Precisa rodar no servidor por dois motivos:
// a chave service_role não pode existir no navegador, e o cadastro público
// substituiria a sessão do personal pela do aluno recém-criado.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const URL = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  // O cliente supabase-js manda 'apikey' e 'x-client-info' em toda chamada
  // de função, não só authorization/content-type — sem eles aqui, o
  // preflight do navegador reprova a requisição antes dela sair.
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
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
