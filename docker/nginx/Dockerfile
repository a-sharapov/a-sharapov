FROM docker.io/nginx:stable-alpine
ADD ./docker/nginx/default.conf /etc/nginx/conf.d/default.conf
RUN chown nginx.nginx /usr/share/nginx/html/ 