# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/
RUN npm install --workspace=packages/frontend
COPY . .
RUN npm run build --workspace=packages/frontend

# Production stage
FROM nginx:alpine
COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html
# Custom Nginx configurations to support client-side routing fallback
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://api-gateway:8000; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
