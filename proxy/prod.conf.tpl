server {
    set $domain "[+MAIN_DOMAIN_NAME+]";
    charset utf-8;
    resolver 127.0.0.11 ipv6=off;

    listen 80;
    listen [::]:80;

    server_name $domain;
    server_tokens off;

    client_max_body_size 0;

    proxy_connect_timeout 10;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Cache-Control public;

    rewrite ^(.*)\.html$ $1 permanent;

    location / {
        return 301 https://$domain$request_uri;
    }
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}

# Section should be commented before certificates are generated
server {
    charset utf-8;
    #resolver 127.0.0.11 ipv6=off;

    listen 443 http2 default_server ssl;
    listen [::]:443 http2 ssl;
    ssl_certificate "/etc/nginx/ssl/live/[+MAIN_DOMAIN_NAME+]/fullchain.pem";
    ssl_certificate_key "/etc/nginx/ssl/live/[+MAIN_DOMAIN_NAME+]/privkey.pem";

    server_name "[+MAIN_DOMAIN_NAME+]";
    server_tokens off;

    client_max_body_size 0;

    proxy_connect_timeout 10;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Cache-Control public;

    error_page 500 502 503 504 /fallback;

    rewrite ^(.*)\.html$ $1 permanent;

    location / {
        add_header Cache-Control public;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_pass http://a-sharapov_web:5701;
    }

    location /health {
        add_header Cache-Control no-cache;
        add_header Content-Type text/html;
        root /var/www/html/custom/;
        try_files $uri $uri.html =404;
    }

    location /fallback {
        add_header Cache-Control no-cache;
        add_header Content-Type text/html;
        root /var/www/html/custom/;
        try_files $uri $uri.html =404;
    }

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}
