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
        return 200 'OK';
    }
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
}
