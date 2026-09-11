#!/bin/bash
# ============================================================
#  ALLAZ FIT — atalho para abrir o site no navegador
#  É só dar dois cliques neste arquivo.
#  Para desligar o servidor: feche esta janela (ou Ctrl + C).
# ============================================================

cd "$(dirname "$0")" || exit 1
PORT=4322
URL="http://localhost:$PORT"

clear 2>/dev/null
echo ""
echo "   ALLAZ FIT"
echo "   ------------------------------------------"
echo ""

# Sem Node instalado? Abre o site direto do arquivo.
if ! command -v node >/dev/null 2>&1; then
  echo "   Node.js não encontrado — abrindo o site direto do arquivo."
  echo "   (funciona igual; instale o Node em nodejs.org se quiser o servidor local)"
  echo ""
  open "index.html"
  sleep 3
  exit 0
fi

# Servidor já ligado? Só abre o navegador.
if lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "   O servidor já estava ligado."
  echo "   Abrindo $URL"
  echo ""
  open "$URL"
  sleep 3
  exit 0
fi

echo "   Servidor ligado em $URL"
echo "   O navegador vai abrir em instantes..."
echo ""
echo "   Para DESLIGAR: feche esta janela ou aperte Ctrl + C"
echo "   ------------------------------------------"
echo ""

( sleep 1; open "$URL" ) &
exec node server.js
