FROM ubuntu:20.04

# basic ubuntu dependencies
RUN apt-get update

RUN apt-get install -y \
	make \
	curl \
	unzip

# nodejs
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

RUN apt install -y nodejs

EXPOSE 4200

# user compatibility with host and mounted volumes
ARG UID
ARG GID

RUN groupadd -g $GID mygroup
RUN useradd --uid $UID -g mygroup myuser

USER myuser
