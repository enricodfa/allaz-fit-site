// Login, sessão e guarda de página da área logada.
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
