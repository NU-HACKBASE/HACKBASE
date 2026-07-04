FROM node:22-alpine AS deps

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

FROM deps AS build

ARG VITE_API_BASE_URL=http://localhost:8787
ARG VITE_WS_URL=ws://localhost:8787/ws
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL

WORKDIR /app
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm run build

FROM nginx:1.27-alpine AS runner

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
