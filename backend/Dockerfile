FROM node:22-alpine AS deps

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci

FROM deps AS build

WORKDIR /app
COPY backend ./backend
COPY openapi ./openapi
WORKDIR /app/backend
RUN npm run build

FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/package*.json ./backend/
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/src/scripts ./backend/src/scripts
COPY --from=build /app/openapi ./openapi

WORKDIR /app/backend
EXPOSE 8787

CMD ["npm", "run", "start"]
