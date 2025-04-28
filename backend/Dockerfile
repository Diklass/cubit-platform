# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY backend/package*.json ./
RUN npm ci

# Copy source and build
COPY backend/ ./
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine
WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/dist ./dist
COPY backend/package*.json ./
RUN npm ci --only=production

# Expose port and run
EXPOSE 3001
CMD ["node", "dist/main.js"]