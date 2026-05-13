FROM node:22-alpine AS builder

WORKDIR /app

ARG API_BASE_URL=http://localhost:3000

COPY package.json package-lock.json ./
RUN npm ci

COPY angular.json tsconfig.json tsconfig.app.json ./
COPY public ./public/
COPY src ./src/

RUN sed -i "s|apiBaseUrl: 'http://localhost:3000'|apiBaseUrl: '${API_BASE_URL}'|g" src/environments/environment.prod.ts \
    && npm run build -- --configuration production

FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/client/browser /usr/share/nginx/html

EXPOSE 80
