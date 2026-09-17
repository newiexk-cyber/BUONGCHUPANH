# ==============================================================================
# PHOTOBOOTH BACKEND API — DOCKERFILE (NODE.JS ALPINE)
# ==============================================================================

FROM node:20-alpine AS base

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev --silent

# Copy application source code
COPY . .

# Ensure storage directories exist with write permissions
RUN mkdir -p storage/photos storage/templates storage/data

# Expose backend port (Default: 5000)
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

# Start Express Backend API
CMD ["node", "server.js"]
