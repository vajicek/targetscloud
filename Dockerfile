FROM node:18-alpine3.19

EXPOSE 80

WORKDIR /tmp/home

COPY app/dist/app ./
COPY server/package*.json ./
COPY server/*.js ./

RUN npm install

CMD ["node", "app.js"]
