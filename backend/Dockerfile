FROM node:18-slim

WORKDIR /usr/src/app

# Install dependencies first for caching
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Make the entrypoint script executable
RUN chmod +x docker-entrypoint.sh

# The application listens on port 5000 (configurable via .env, but default here)
EXPOSE 5000

# Use the entrypoint script to run migrations and start the server
ENTRYPOINT ["./docker-entrypoint.sh"]
