# Use Nginx with Brotli support
FROM fholzer/nginx-brotli:v1.26.2

# Install OpenSSL for generating certificates
RUN apk add --no-cache openssl

# Remove default configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Create directory for SSL certificates
RUN mkdir -p /etc/nginx/certs

# Create self-signed certificates for development/testing
RUN openssl req -x509 -newkey rsa:2048 -keyout /etc/nginx/certs/key.pem -out /etc/nginx/certs/cert.pem -days 365 -nodes \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Set proper permissions
RUN chmod 600 /etc/nginx/certs/key.pem
RUN chmod 644 /etc/nginx/certs/cert.pem

EXPOSE 80 443

# The base image already has ENTRYPOINT ["nginx"] so we just need the arguments
CMD ["-g", "daemon off;"]
