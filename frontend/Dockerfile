FROM node:16.13.1-alpine3.14
# AS builder
ENV NODE_ENV development
RUN mkdir -p /usr/src/frontend
WORKDIR /usr/src/frontend
COPY package*.json /usr/src/frontend/
RUN ls -l
RUN npm install
COPY . /usr/src/frontend
EXPOSE 3000
EXPOSE 24678
CMD ["npm", "run", "dev"]