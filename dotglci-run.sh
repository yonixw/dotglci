#!/usr/bin/env bash

PROJ_NAME=$(basename $(git rev-parse --show-toplevel) | sed -e "s/[^0-9a-zA-Z]/_/g" ) 

#git push local-gitlab-ci

docker-compose run --rm \
    -v $(pwd)/update-gl-vars.deno.ts:/app/main.ts \
    -e "PROJ_NAME=$PROJ_NAME" \
    denohelper run --allow-env --allow-net=gitlab --allow-read --allow-write /app/main.ts