#!/bin/bash
set -e

SCRIPT_PATH=$(readlink -f ${BASH_SOURCE[0]})
SCRIPT_DIR=$(dirname ${SCRIPT_PATH})

GIT_TOP_DIR=$(git rev-parse --show-toplevel)
DOTGLCI_PROJ_NAME=$(basename $(git rev-parse --show-toplevel) | sed -e "s/[^0-9a-zA-Z]/_/g" ) 

logx () {
    echo "[****] [$(date +'%F %T')] $@"
}

logx "DOTGLCI Dir: $SCRIPT_DIR"
logx "Your git dir: $GIT_TOP_DIR"

logx "Building the script base docker ..."
    (docker images | grep dotglci_scriptbase) || \
    docker build -t dotglci_scriptbase -f "$SCRIPT_DIR/Dockerfile" "$SCRIPT_DIR"

logx "Running CLI inside docker (with docker in docker) ..."

    docker run --rm -it \
        -v '/var/run/docker.sock:/var/run/docker.sock' \
        -v "$SCRIPT_DIR:/app" \
        dotglci_scriptbase run \
            --allow-read \
            --allow-env \
            /app/src/ts-scripts/0cli-options.ts $@