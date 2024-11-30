NG := node_modules/.bin/ng
UID := $(shell id -u)
GID := $(shell id -g)
WEBAPP_CONFIGURATION ?= production

# SERVER WEBAPP
serve_ng:
	cd app && $(NG) serve --host 0.0.0.0

build_webapp:
	cd app && $(NG) cache clean
	cd app && $(NG) build \
		--configuration $(WEBAPP_CONFIGURATION) \
		--optimization true \
		--output-hashing none

add_component:
	cd app && $(NG) generate component $(COMPONENT)

# SERVER BACKEND
serve_backend:
	ln -fs $(PWD)/app/dist/app/browser $(PWD)/server/browser
	cd server && nodejs ./app.js -p 4443 -v

# Project setup
create:
	npm install @angular/cli
	$(NG) new app

# Run once
init:
	cd app && npm install @angular/cli

# RELEASE CONTAINER
build_release:
	docker build \
	-t targetscloud-release \
	-f ./Dockerfile .

run_release:
	docker kill targetscloud-release || true
	docker run \
	--rm \
	--name targetscloud-release \
	--network host \
	-v /etc/letsencrypt/archive/www.targetscloud.org:/tmp/home/certs \
	-p 443:443 \
	targetscloud-release \
	-p 443 \
	-k /tmp/home/certs/privkey1.pem \
	-c /tmp/home/certs/fullchain1.pem &

# DEV CONTEINER
build_devcontainer:
	docker build \
	--build-arg UID=$(UID) \
	--build-arg GID=$(GID) \
	--no-cache \
	-f ./Dockerfile-devcontainer \
	. \
	-t targetscloud-devcontainer

devcontainer:
	docker run \
	-it \
	--network=host \
	--rm \
	--name targetcloud-devcontainer \
	-v $(PWD):/tmp/home \
	-w /tmp/home \
	-p 4200:4200 \
	-u $(UID):$(GID) \
	targetscloud-devcontainer /bin/bash

exec_to_devcontainer:
	docker exec \
	-it targetcloud-devcontainer \
	/bin/bash

run_mongo:
	docker stop mongo || true
	docker run \
		-it \
		--rm \
		--name mongo \
		--network host \
		-e MONGO_INITDB_ROOT_USERNAME=mongoadmin \
		-e MONGO_INITDB_ROOT_PASSWORD=secret \
		-d mongo:latest

create_certs:
	openssl genrsa -out server/key.pem 2048
	openssl req -new -newkey rsa:2048 -nodes \
		-keyout server/key.pem \
		-out server/csr.pem \
		-subj "/C=US/ST=Prague/L=Prague/O=VajSoft/OU=HQ/CN=localhost/emailAddress=admin@targetscloud.org"
	openssl x509 -req -days 365 \
		-in server/csr.pem \
		-signkey server/key.pem \
		-out server/cert.pem
	openssl x509 -outform PEM \
		-in server/cert.pem \
		-out server/selfsigned.crt