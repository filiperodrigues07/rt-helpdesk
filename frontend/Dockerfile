# Build context esperado: raiz do monorepo (rt-helpdesk/)
# docker build -f frontend/Dockerfile .

FROM node:20-alpine AS build
WORKDIR /app/frontend
COPY frontend/package.json ./package.json
RUN npm install
COPY frontend .
ARG VITE_API_URL=http://localhost:3333/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
