#!/usr/bin/env bash

# exit when any command fails
set -e

logx () {
    echo "[****] [$(date +'%F %T')] $@"
}

DEV_ROOT_ACC=token-string-ABYZ000
PROJ_NAME=$(basename $(git rev-parse --show-toplevel) | sed -e "s/[^0-9a-zA-Z]/_/g" ) 


logx "Updating remote for project \"$PROJ_NAME\"..."
    git remote remove local-gitlab-ci || /bin/true
    git remote add local-gitlab-ci "http://root:$DEV_ROOT_ACC@localhost:15080/root/$PROJ_NAME.git"

#git push local-gitlab-ci

docker-compose run --rm \
    -v $(pwd)/update-gl-vars.deno.ts:/app/main.ts \
    -e "PROJ_NAME=$PROJ_NAME" \
    denohelper run --allow-env --allow-net=gitlab --allow-read --allow-write /app/main.ts