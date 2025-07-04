# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine
WORKDIR /app

# Устанавливаем только прод-зависимости
COPY backend/package*.json ./
RUN npm ci --only=production

# Копируем билд и другие важные файлы
COPY --from=builder /app/dist ./dist
COPY backend/prisma ./prisma

# Если используешь Prisma Client — сгенерируй его
RUN npx prisma generate

EXPOSE 3001
CMD ["node", "dist/main.js"]
