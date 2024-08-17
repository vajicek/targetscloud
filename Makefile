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

# Project setup
create:
	npm install @angular/cli
	$(NG) new app

# Run once
init:
	cd app && npm install @angular/cli

build_release:
	docker build \
	-f ./Dockerfile-release . \
	-t targetscloud-release

run:
	docker run \
	-it \
	--rm \
	--name targetscloud \
	-p 8080:8080 \
	targetscloud-release

build_devcontainer:
	docker build \
	--build-arg UID=$(UID) \
	--build-arg GID=$(GID) \
	-f ./Dockerfile . \
	-t targetscloud

devcontainer:
	docker run \
	-it \
	--rm \
	--name devcontainer \
	-v $(PWD):/tmp/home \
	-w /tmp/home \
	-p 4200:4200 \
	-u $(UID):$(GID) \
	targetscloud /bin/bash