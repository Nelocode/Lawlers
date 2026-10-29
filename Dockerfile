# Production-grade static web server for Easypanel
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx configuration with gzip, security headers, and asset caching
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy website files to nginx html root
COPY . /usr/share/nginx/html/

# Ensure proper read permissions for nginx worker
RUN chmod -R 755 /usr/share/nginx/html

# Expose HTTP port for Docker / Easypanel ingress
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
