# Image de l'application AgroNuts.
# Multi-stage léger : on installe, on build, on lance.
FROM node:20-alpine

# Prisma a besoin d'openssl ; libc6-compat aide certains binaires natifs.
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# 1) Dépendances (cache Docker tant que package.json ne change pas)
COPY package.json package-lock.json* ./
RUN npm ci

# 2) Code + génération du client Prisma + build de production
COPY . .
RUN npx prisma generate && npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

# Au démarrage : on crée/actualise le schéma, on seed (idempotent), puis on lance.
CMD ["sh", "-c", "npx prisma db push --skip-generate && (npx prisma db seed || true) && npm run start"]
