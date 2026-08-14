# Build context esperado: raiz do monorepo (rt-helpdesk/)
# docker build -f backend/Dockerfile .

FROM node:20-alpine AS deps
WORKDIR /app
COPY backend/package.json ./backend/package.json
COPY prisma ./prisma
WORKDIR /app/backend
RUN npm install

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY prisma ./prisma
COPY backend ./backend
WORKDIR /app/backend
RUN npm run prisma:generate
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/package.json ./package.json
COPY --from=build /app/prisma ../prisma

EXPOSE 3333
CMD ["node", "dist/server.js"]
