# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /usr/src/app

# Install dependencies first for caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the frontend (Vite output is usually in 'dist')
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy the built assets from the build stage
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Copy our custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
