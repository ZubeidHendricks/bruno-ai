FROM node:18-slim

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with npm install instead of npm ci for better compatibility
RUN npm install

# Copy source files
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Expose the port
EXPOSE 10000

# Health check using root path
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:10000/ || exit 1

# Start the application
CMD ["node", "server.js"]