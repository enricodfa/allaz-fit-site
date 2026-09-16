/* =========================================================
   PROTÓTIPO — dados fictícios e utilitários
   Não há banco de dados, autenticação nem servidor. Tudo vive
   no navegador. O que o usuário mexe fica no localStorage, para
   a demonstração sobreviver a um F5 na frente do cliente.
   ========================================================= */

const CHAVE = 'allazfit-demo';

/* ---------- utilitários ---------- */

export function esc(t){
  return String(t ?? '').replace(/[&<>"']/g, c => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
  ));
}

export function hoje(){
  const d = new Date(); d.setHours(0,0,0,0); return d;
}

export function diasAtras(n){
  const d = hoje(); d.setDate(d.getDate() - n); return d.toISOString();
}

export function formatarData(iso){
  if(!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
}

export function formatarDataLonga(iso){
  if(!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
}

export function diasDesde(iso){
  if(!iso) return null;
  const alvo = new Date(iso); alvo.setHours(0,0,0,0);
  return Math.round((hoje() - alvo) / 86400000);
}

export function textoDiasDesde(iso){
  const d = diasDesde(iso);
  if(d === null) return 'nunca treinou';
  if(d <= 0) return 'hoje';
  if(d === 1) return 'ontem';
  return `há ${d} dias`;
}

/* A letra da divisão: "Treino A" -> "A". Usada no cartão e no histórico. */
export function letraDivisao(nome){
  const m = String(nome).match(/\b([A-Z])\b/);
  return m ? m[1] : String(nome).trim().charAt(0).toUpperCase();
}

export function iniciais(nome){
  return String(nome).trim().charAt(0).toUpperCase();
}

/* ---------- vídeo ---------- */

export function resolverVideo(url){
  if(!url) return null;
  const limpa = String(url).trim();
  const padroes = [
    /(?:youtube\.com\/watch\?[^#]*\bv=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  ];
  for(const p of padroes){
    const m = limpa.match(p);
    if(m) return {tipo:'youtube', embedUrl:`https://www.youtube.com/embed/${m[1]}?rel=0`};
  }
  if(/^https?:\/\//i.test(limpa)) return {tipo:'externo', url:limpa};
  return null;
}

/* ---------- dados ---------- */

function sementeDados(){
  return {
    personal: {nome:'Ricardo Alves', email:'ricardo@allazfit.com.br'},

    alunos: [
      {id:'a1', nome:'Camila Souza',    telefone:'(48) 99812-4471', desde:'2026-03-10'},
      {id:'a2', nome:'Diego Martins',   telefone:'(48) 99640-2288', desde:'2026-05-02'},
      {id:'a3', nome:'Fernanda Lima',   telefone:'(48) 99155-7093', desde:'2026-06-21'},
      {id:'a4', nome:'Bruno Tavares',   telefone:'(48) 99388-1640', desde:'2026-07-14'},
      {id:'a5', nome:'Patrícia Nunes',  telefone:'(48) 99701-5512', desde:'2026-08-30'},
    ],

    planos: [
      {
        id:'p1', alunoId:'a1', nome:'Hipertrofia — Setembro',
        objetivo:'Ganho de massa em membros superiores', ativo:true, inicio:'2026-09-01',
        divisoes:[
          {id:'d1', nome:'Treino A', foco:'Peito e tríceps', exercicios:[
            {id:'e1',  nome:'Supino reto com barra',        series:4, reps:'8-12', carga:'40 kg',   descanso:'90s',
             obs:'Desça controlando em 3 segundos. Não trave o cotovelo em cima.', video:''},
            {id:'e2',  nome:'Supino inclinado com halteres', series:3, reps:'10-12', carga:'16 kg',  descanso:'60s', obs:'', video:''},
            {id:'e3',  nome:'Crucifixo na máquina',          series:3, reps:'12',    carga:'35 kg',  descanso:'45s', obs:'', video:''},
            {id:'e4',  nome:'Tríceps na corda',              series:4, reps:'12-15', carga:'25 kg',  descanso:'45s',
             obs:'Abra a corda no final do movimento.', video:''},
            {id:'e5',  nome:'Tríceps francês',               series:3, reps:'10',    carga:'12 kg',  descanso:'45s', obs:'', video:''},
          ]},
          {id:'d2', nome:'Treino B', foco:'Costas e bíceps', exercicios:[
            {id:'e6',  nome:'Puxada frente',            series:4, reps:'10',   carga:'45 kg', descanso:'60s', obs:'', video:''},
            {id:'e7',  nome:'Remada curvada',           series:4, reps:'8-10', carga:'35 kg', descanso:'90s',
             obs:'Coluna neutra. Se travar a lombar, reduz a carga.', video:''},
            {id:'e8',  nome:'Remada unilateral',        series:3, reps:'12',   carga:'20 kg', descanso:'45s', obs:'', video:''},
            {id:'e9',  nome:'Rosca direta',             series:4, reps:'10',   carga:'20 kg', descanso:'45s', obs:'', video:''},
            {id:'e10', nome:'Rosca martelo',            series:3, reps:'12',   carga:'14 kg', descanso:'45s', obs:'', video:''},
          ]},
          {id:'d3', nome:'Treino C', foco:'Pernas e core', exercicios:[
            {id:'e11', nome:'Agachamento livre',        series:4, reps:'8',    carga:'50 kg',        descanso:'120s',
             obs:'Profundidade até a coxa paralela. Joelho na linha do pé.', video:''},
            {id:'e12', nome:'Leg press 45°',            series:4, reps:'12',   carga:'120 kg',       descanso:'90s', obs:'', video:''},
            {id:'e13', nome:'Cadeira extensora',        series:3, reps:'15',   carga:'30 kg',        descanso:'45s', obs:'', video:''},
            {id:'e14', nome:'Mesa flexora',             series:3, reps:'12',   carga:'25 kg',        descanso:'45s', obs:'', video:''},
            {id:'e15', nome:'Panturrilha em pé',        series:4, reps:'20',   carga:'peso do corpo', descanso:'30s', obs:'', video:''},
          ]},
        ],
      },
      {
        id:'p0', alunoId:'a1', nome:'Adaptação — Julho',
        objetivo:'Retomada após pausa', ativo:false, inicio:'2026-07-01',
        divisoes:[
          {id:'d0', nome:'Treino A', foco:'Corpo inteiro', exercicios:[
            {id:'e0', nome:'Agachamento livre', series:3, reps:'12', carga:'30 kg', descanso:'60s', obs:'', video:''},
          ]},
        ],
      },
    ],

    /* Sessões já realizadas — é o que faz o histórico e o "da última vez"
       terem o que mostrar na demonstração. */
    sessoes: [
      {id:'s1', alunoId:'a1', divisaoId:'d1', em:diasAtras(0),  obs:'',
       registros:{e1:{carga:40,reps:10},e2:{carga:16,reps:12},e3:{carga:35,reps:12},e4:{carga:25,reps:15},e5:{carga:12,reps:10}}},
      {id:'s2', alunoId:'a1', divisaoId:'d2', em:diasAtras(3),  obs:'Ombro direito incomodou na remada.',
       registros:{e6:{carga:45,reps:10},e7:{carga:35,reps:8},e8:{carga:20,reps:12},e9:{carga:20,reps:10},e10:{carga:14,reps:12}}},
      {id:'s3', alunoId:'a1', divisaoId:'d1', em:diasAtras(7),  obs:'',
       registros:{e1:{carga:37.5,reps:10},e2:{carga:14,reps:12},e3:{carga:32,reps:12},e4:{carga:22.5,reps:15},e5:{carga:12,reps:10}}},
      {id:'s4', alunoId:'a1', divisaoId:'d3', em:diasAtras(9),  obs:'',
       registros:{e11:{carga:50,reps:8},e12:{carga:120,reps:12},e13:{carga:30,reps:15},e14:{carga:25,reps:12},e15:{carga:null,reps:20}}},
      {id:'s5', alunoId:'a1', divisaoId:'d1', em:diasAtras(14), obs:'',
       registros:{e1:{carga:35,reps:12},e2:{carga:14,reps:10},e3:{carga:30,reps:12},e4:{carga:22.5,reps:12},e5:{carga:10,reps:10}}},
      {id:'s6', alunoId:'a2', divisaoId:'d1', em:diasAtras(1),  obs:'', registros:{}},
      {id:'s7', alunoId:'a3', divisaoId:'d1', em:diasAtras(12), obs:'', registros:{}},
    ],
  };
}

/* ---------- persistência da demonstração ---------- */

let cache = null;

export function dados(){
  if(cache) return cache;
  try{
    const salvo = localStorage.getItem(CHAVE);
    if(salvo){ cache = JSON.parse(salvo); return cache; }
  }catch{ /* modo privado: a demo roda em memória */ }
  cache = sementeDados();
  return cache;
}

export function salvar(){
  try{ localStorage.setItem(CHAVE, JSON.stringify(cache)); }
  catch{ /* sem persistência; a demonstração continua funcionando */ }
}

export function reiniciar(){
  try{ localStorage.removeItem(CHAVE); }catch{}
  cache = null;
  location.reload();
}

/* ---------- consultas ---------- */

export function aluno(id){
  return dados().alunos.find(a => a.id === id) ?? null;
}

export function planosDoAluno(id){
  return dados().planos.filter(p => p.alunoId === id);
}

export function planoAtivo(alunoId){
  return dados().planos.find(p => p.alunoId === alunoId && p.ativo) ?? null;
}

export function plano(id){
  return dados().planos.find(p => p.id === id) ?? null;
}

export function divisao(id){
  for(const p of dados().planos){
    const d = p.divisoes.find(d => d.id === id);
    if(d) return d;
  }
  return null;
}

export function sessoesDoAluno(id){
  return dados().sessoes
    .filter(s => s.alunoId === id && s.em)
    .sort((a,b) => new Date(b.em) - new Date(a.em));
}

export function ultimaSessaoDaDivisao(alunoId, divisaoId){
  return sessoesDoAluno(alunoId).find(s => s.divisaoId === divisaoId) ?? null;
}

/* O registro mais recente de um exercício — é o "da última vez: 40kg × 10",
   a informação que o aluno mais esquece de uma semana para a outra. */
export function ultimoRegistro(alunoId, exercicioId, ignorarSessaoId){
  for(const s of sessoesDoAluno(alunoId)){
    if(s.id === ignorarSessaoId) continue;
    const r = s.registros?.[exercicioId];
    if(r && (r.carga != null || r.reps != null)) return {...r, em:s.em};
  }
  return null;
}

export function textoUltimoRegistro(reg){
  if(!reg) return '';
  if(reg.carga != null && reg.reps != null) return `${reg.carga} kg × ${reg.reps}`;
  if(reg.carga != null) return `${reg.carga} kg`;
  if(reg.reps != null) return `${reg.reps} repetições`;
  return '';
}

/* ---------- ícones ---------- */

export const icone = {
  voltar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>',
  seta:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  busca:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  mais:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4V8z" fill="currentColor"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  casa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
  halter:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/></svg>',
  grafico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m7 14 3-4 4 3 5-7"/></svg>',
  pessoa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  lixo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
  cima:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>',
  baixo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  sair:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>',
};

/* ---------- topo compartilhado ---------- */

export function montarTopo({titulo, sub, voltar, acoes=''}){
  return `
    <header class="app-topo">
      ${voltar
        ? `<a class="app-voltar" href="${voltar}">${icone.voltar}<span>Voltar</span></a>`
        : `<div class="app-topo__marca">
             <img src="../assets/logo.jpg" alt="">
           </div>`}
      <div style="min-width:0">
        <div class="app-topo__titulo">${esc(titulo)}</div>
        ${sub ? `<div class="app-topo__sub">${esc(sub)}</div>` : ''}
      </div>
      <div class="app-topo__acoes">${acoes}</div>
    </header>`;
}
