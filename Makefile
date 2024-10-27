NG := node_modules/.bin/ng
UID := $(shell id -u)
GID := $(shell id -g)

# SERVER WEBAPP
serve_ng:
	cd app && $(NG) serve --host 0.0.0.0

build_webapp:
	cd app && $(NG) cache clean
	cd app && $(NG) build --optimization true --output-hashing none

add_component:
	cd app && $(NG) generate component $(COMPONENT)

# SERVER BACKEND
serve_backend:
	cd server && nodejs ./app.js

# Project setup
create:
	npm install @angular/cli
	$(NG) new app

# Run once
init:
	cd app && npm install @angular/cli

build_release:
	docker build \
	-t targetscloud-release \
	-f ./Dockerfile .

run:
	docker run \
	-it \
	--rm \
	--name targetscloud-release \
	-p 80:80 \
	targetscloud-release

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
