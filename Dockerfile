# Use official Node.js runtime as base image (Debian-based for Chromium compatibility)
FROM node:20-slim

# Set working directory in container
WORKDIR /app

# Install system dependencies required for Chromium/Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (frozen lockfile to ensure reproducibility)
RUN npm install

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
