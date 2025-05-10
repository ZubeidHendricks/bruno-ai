FROM node:18-slim

WORKDIR /app

# Set environment variables for CORS and SSL
ENV NODE_ENV=production
ENV PORT=10000
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV ALLOW_ALL_ORIGINS=true
ENV CORS_ORIGIN=*

# Copy package files first for better caching
COPY package*.json ./

# Copy the CORS middleware first
COPY src/middlewares/cors.js ./src/middlewares/cors.js

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port
EXPOSE 10000

# Health check using root path
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:10000/ || exit 1

# Start the application
CMD ["node", "server.js"]