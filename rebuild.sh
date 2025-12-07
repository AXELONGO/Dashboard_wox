#!/bin/bash
echo "🟢 Reconstruyendo e iniciando contenedores (SIN CACHÉ)..."
export PATH="$PATH:/Applications/Docker.app/Contents/Resources/bin"
/Applications/Docker.app/Contents/Resources/bin/docker compose down
/Applications/Docker.app/Contents/Resources/bin/docker compose build --no-cache
/Applications/Docker.app/Contents/Resources/bin/docker compose up -d
echo "✅ Proceso completado. Verifica en: http://localhost:8081"
