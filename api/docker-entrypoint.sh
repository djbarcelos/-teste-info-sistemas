#!/bin/sh
set -e
npx prisma migrate deploy

# Após as migrações: opcionalmente executa SQL de seed (padrão: ativo no Docker).
# Desative com RUN_DB_SEED=false no compose ou no ambiente.
if [ "${RUN_DB_SEED:-true}" != "false" ]; then
  npx prisma db execute --file prisma/seed.sql
fi

exec node dist/src/main.js
