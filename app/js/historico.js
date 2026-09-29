// Histórico de treinos de um aluno: usado tanto pela tela do próprio aluno
// (treino.html) quanto pela ficha que o personal vê (aluno.html). O RLS já
// garante que cada um só recebe o que pode ver — aqui não se filtra por
// personal nem por aluno de novo, só se desenha o que a consulta devolveu.
import { sb } from './supabase.js';
import { esc, icone, formatarData, formatarDataLonga } from './demo.js';

export async function montarHistorico(alunoId, elementoRaiz){
  const { data: sessoes, error } = await sb
    .from('sessoes')
    .select('id, concluido_em, observacao, divisao_id, divisoes!inner(id, nome, foco)')
    .eq('aluno_id', alunoId)
    .order('concluido_em', { ascending: false })
    .limit(100);

  if (error) {
    elementoRaiz.innerHTML = '<div class="vazio">Não foi possível carregar o histórico.</div>';
    return;
  }

  if (!sessoes || sessoes.length === 0) {
    elementoRaiz.innerHTML = `<div class="vazio">
      <strong>Nenhum treino registrado</strong>
      Os treinos aparecem aqui depois de concluídos.
    </div>`;
    return;
  }

  const grupos = new Map();
  for (const s of sessoes) {
    if (!grupos.has(s.divisao_id)) grupos.set(s.divisao_id, { divisao: s.divisoes, sessoes: [] });
    grupos.get(s.divisao_id).sessoes.push(s);
  }

  const sessaoIds = sessoes.map(s => s.id);
  const { data: registros } = await sb
    .from('registros')
    .select('sessao_id, exercicio_id, carga, repeticoes, exercicios(nome)')
    .in('sessao_id', sessaoIds);
  const registrosPorSessao = new Map();
  for (const r of registros ?? []) {
    if (!registrosPorSessao.has(r.sessao_id)) registrosPorSessao.set(r.sessao_id, []);
    registrosPorSessao.get(r.sessao_id).push(r);
  }

  elementoRaiz.innerHTML = [...grupos.values()].map(({ divisao, sessoes: lista }) => {
    const nome = divisao?.nome ?? 'Treino removido';
    return `
      <div class="historico-grupo">
        <button class="historico-grupo__cabeca" data-grupo="${esc(divisao.id)}" aria-expanded="false">
          <span class="historico-grupo__info">
            <span class="historico-grupo__titulo">${esc(nome)}</span>
            <span class="historico-grupo__meta">
              ${lista.length} ${lista.length === 1 ? 'vez' : 'vezes'}
              · última em ${esc(formatarDataLonga(lista[0].concluido_em))}
            </span>
          </span>
          <span class="aluno-linha__seta">${icone.baixo}</span>
        </button>
        <div class="historico-grupo__corpo" id="h-${esc(divisao.id)}" hidden>
          ${detalheGrupo(lista, registrosPorSessao)}
        </div>
      </div>`;
  }).join('');

  elementoRaiz.querySelectorAll('[data-grupo]').forEach(btn => {
    btn.addEventListener('click', () => {
      const corpo = document.getElementById('h-' + btn.dataset.grupo);
      const aberto = !corpo.hidden;
      corpo.hidden = aberto;
      btn.setAttribute('aria-expanded', String(!aberto));
    });
  });
}

function detalheGrupo(sessoes, registrosPorSessao){
  // Agrupa por exercício, cronológico decrescente — sem gráfico, é lista mesmo.
  const porExercicio = new Map();
  for (const s of sessoes) {
    for (const r of registrosPorSessao.get(s.id) ?? []) {
      if (r.carga == null && r.repeticoes == null) continue;
      if (!porExercicio.has(r.exercicio_id)) {
        porExercicio.set(r.exercicio_id, { nome: r.exercicios?.nome ?? 'Exercício removido', pontos: [] });
      }
      porExercicio.get(r.exercicio_id).pontos.push({ em: s.concluido_em, carga: r.carga, repeticoes: r.repeticoes });
    }
  }

  if (porExercicio.size === 0) {
    return '<p style="color:var(--smoke-2);font-size:.9rem">Treinos concluídos, sem cargas anotadas.</p>';
  }

  return [...porExercicio.values()].map(({ nome, pontos }) => `
    <div style="margin-bottom:1.1rem">
      <div style="font-weight:600;color:var(--bone);font-size:.92rem;margin-bottom:.35rem">${esc(nome)}</div>
      <div class="evolucao">
        ${pontos.map(p => `
          <div class="evolucao__linha">
            <span class="evolucao__data">${esc(formatarData(p.em))}</span>
            <span class="evolucao__ex">${p.carga != null ? esc(p.carga) + ' kg' : '—'}${p.repeticoes != null ? ' × ' + esc(p.repeticoes) : ''}</span>
          </div>`).join('')}
      </div>
    </div>`).join('');
}
