# Base Node.js image
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the React application
RUN npm run build

# Production image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy built application from build stage
COPY --from=build /app/build ./build
COPY --from=build /app/src/server ./src/server
COPY --from=build /app/src/database ./src/database
COPY --from=build /app/src/services ./src/services
COPY --from=build /app/src/utils ./src/utils
COPY --from=build /app/src/config ./src/config

# Create directories for file uploads and logs
RUN mkdir -p uploads processed logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "src/server/index.js"]
