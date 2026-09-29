// Resolução e exibição de vídeo de execução de exercício.
import { esc } from './demo.js';

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

let dlg = null;

function garantirDialog() {
  if (dlg) return dlg;
  dlg = document.createElement('dialog');
  dlg.id = 'dlg-video';
  dlg.innerHTML = `
    <div class="modal__cabeca">
      <h2 class="modal__titulo" id="v-titulo">Execução</h2>
      <button class="b--icone" id="v-fechar" title="Fechar">✕</button>
    </div>
    <div class="modal__corpo" id="v-corpo"></div>`;
  document.body.appendChild(dlg);
  dlg.querySelector('#v-fechar').addEventListener('click', () => dlg.close());
  // Sem isto o vídeo continua tocando com o modal fechado.
  dlg.addEventListener('close', () => { dlg.querySelector('#v-corpo').innerHTML = ''; });
  return dlg;
}

export function abrirVideo(url, titulo) {
  const v = resolverVideo(url);
  const d = garantirDialog();
  d.querySelector('#v-titulo').textContent = titulo;
  const corpo = d.querySelector('#v-corpo');

  if (v?.tipo === 'youtube') {
    corpo.innerHTML = `<div class="video-quadro">
      <iframe src="${esc(v.embedUrl)}" allowfullscreen
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              title="Execução de ${esc(titulo)}"></iframe>
    </div>`;
  } else if (v?.tipo === 'externo') {
    corpo.innerHTML = `<p style="margin-bottom:1rem;color:var(--smoke)">
      Este vídeo abre fora do aplicativo.</p>
      <a class="b b--primario b--bloco" href="${esc(v.url)}" target="_blank" rel="noopener">Abrir vídeo</a>`;
  } else {
    corpo.innerHTML = `<p style="color:var(--smoke)">Seu personal ainda não anexou um vídeo para este exercício.</p>`;
  }
  d.showModal();
}
