FROM node:18-alpine3.19

EXPOSE 80

WORKDIR /tmp/home

# install backend
COPY server/dist ./dist

# install backend dependencies
COPY server/package*.json ./
RUN npm install

# install frontend
COPY app/dist/app ./dist

# install bootstrap script
COPY server/run.sh ./
ENTRYPOINT ["./run.sh"]
