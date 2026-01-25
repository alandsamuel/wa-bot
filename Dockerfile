# Use official Node.js runtime as base image
FROM node:20-alpine

# Set working directory in container
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.26.2

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application files
COPY . .

# Create directory for WhatsApp authentication data
RUN mkdir -p .wwebjs_auth

# Expose port (if needed for any health checks or future features)
EXPOSE 3000

# Health check (optional - checks if container is running)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "console.log('ok')" || exit 1

# Run the bot
CMD ["pnpm", "start"]
