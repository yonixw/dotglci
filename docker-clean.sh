#!/bin/bash

# exit when any command fails
set -e

logx () {
    echo "[****] [$(date +'%F %T')] $@"
}

logx "Starting to clean..."

docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker volume rm $(docker volume ls -q)

logx "Clean done!"