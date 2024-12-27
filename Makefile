NG := node_modules/.bin/ng
UID := $(shell id -u)
GID := $(shell id -g)
WEBAPP_CONFIGURATION ?= production

build_model:
	cd model && npm run build

# SERVER WEBAPP
serve_frontend:
	cd frontend && $(NG) serve --host 0.0.0.0 --ssl

build_frontend:
	cd frontend && npm install
	cd frontend && $(NG) cache clean
	cd frontend && $(NG) build \
		--configuration $(WEBAPP_CONFIGURATION) \
		--optimization true \
		--output-hashing none

add_component:
	cd frontend && $(NG) generate component $(COMPONENT)

# SERVER BACKEND
serve_backend_run:
	rm -f $(PWD)/backend/dist/browser
	ln -fs $(PWD)/frontend/dist/app/browser $(PWD)/backend/dist/browser
	cd backend && ./run.sh \
		-p 4443 \
		-v

serve_backend:
	rm -f $(PWD)/backend/src/browser
	ln -fs $(PWD)/frontend/dist/app/browser $(PWD)/backend/src/browser
	cd backend && npm run dev -- -- \
		-p 4443 \
		-v

build_backend:
	cd backend && npm install
	cd backend && npm run build

# Project setup
create:
	npm install @angular/cli
	$(NG) new frontend

# Run once
init:
	cd frontend && npm install @angular/cli

# RELEASE CONTAINER
build_release:
	rm -f $(PWD)/backend/browser
	rm -f $(PWD)/frontend/dist/app/browser/assets/config.json
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
	-e API_URL="https://localhost" \
	-e GOOGLE_CLIENT_ID=$(GOOGLE_CLIENT_ID) \
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

run_devcontainer:
	docker run \
	-it \
	--network=host \
	--rm \
	--name targetscloud-devcontainer \
	-v $(PWD):/tmp/home \
	-w /tmp/home \
	-u $(UID):$(GID) \
	targetscloud-devcontainer /bin/bash

exec_to_devcontainer:
	docker exec \
	-it targetscloud-devcontainer \
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
	openssl genrsa -out backend/key.pem 2048
	openssl req -new -newkey rsa:2048 -nodes \
		-keyout backend/key.pem \
		-out backend/csr.pem \
		-subj "/C=US/ST=Prague/L=Prague/O=VajSoft/OU=HQ/CN=localhost/emailAddress=admin@targetscloud.org"
	openssl x509 -req -days 365 \
		-in backend/csr.pem \
		-signkey backend/key.pem \
		-out backend/cert.pem
	openssl x509 -outform PEM \
		-in backend/cert.pem \
		-out backend/selfsigned.crt
