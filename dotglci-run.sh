#!/usr/bin/env bash

#git push local-gitlab-ci

docker-compose run --rm -v $(pwd)/update-gl-vars.deno.ts:/app/main.ts denohelper run --allow-env --allow-net=gitlab --allow-read --allow-write /app/main.ts