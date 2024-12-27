FROM node:18-alpine3.19

EXPOSE 80

WORKDIR /tmp/home

# install model
COPY model/dist ./model/dist

# install backend
COPY backend/dist ./backend/dist

# install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# install frontend
COPY frontend/dist/app ./backend/dist

# install bootstrap script
COPY backend/run.sh ./backend

WORKDIR /tmp/home/backend
ENTRYPOINT ["./run.sh"]
