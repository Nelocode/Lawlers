# Production-grade static web server for Easypanel
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx configuration with gzip, security headers, and asset caching
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy website files to nginx html root
COPY . /usr/share/nginx/html/

# Expose HTTP port for Docker / Easypanel ingress
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
