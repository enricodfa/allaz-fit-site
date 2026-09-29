// O que o aluno digita fica no aparelho até ele concluir o treino. Fechar o
// app sem querer no meio da série não pode custar o registro.
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
