#!/usr/bin/env bash

# exit when any command fails
set -e

logx () {
    echo "[****] [$(date +'%F %T')] $@"
}

DEV_ROOT_ACC=token-string-ABYZ000
DOTGLCI_PROJ_NAME=$(basename $(git rev-parse --show-toplevel) | sed -e "s/[^0-9a-zA-Z]/_/g" ) 

logx "Check gitlab docker healthy"...

    docker-compose run --rm curlhelper curl \
        --head -X GET http://dotgitlabci:80

logx "Create project skeleton (will be taken after first run)..."

    docker-compose run --rm curlhelper curl \
        -X POST -H "PRIVATE-TOKEN: $DEV_ROOT_ACC" \
        -H "Content-Type: application/json" --data "{
            \"name\": \"$DOTGLCI_PROJ_NAME\", \
            \"description\": \"Project for git folder $DOTGLCI_PROJ_NAME\", \
            \"path\": \"$DOTGLCI_PROJ_NAME\",
            \"namespace_id\": \"1\", \
            \"initialize_with_readme\": \"false\" \
        }" \
        --url 'http://dotgitlabci:80/api/v4/projects/'

logx "Update variables for project..."

    # Read permission for ENV update
    # Write permission to download artifacts+logs+reports
    docker-compose run --rm \
        -v $(pwd):/workspace \
        -w "/workspace" \
        -e "DOTGLCI_PROJ_NAME=$DOTGLCI_PROJ_NAME" \
        denohelper run \
            --allow-env \
            --allow-net=dotgitlabci \
            --allow-read=/workspace,/tmp \
            --allow-write=/workspace/.dotglci,/tmp \
            /workspace/update-gl-vars.deno.ts


logx "Updating remote for project \"$DOTGLCI_PROJ_NAME\"..."
    git remote remove local-gitlab-ci || /bin/true
    git remote add local-gitlab-ci "http://root:$DEV_ROOT_ACC@localhost:15080/root/$DOTGLCI_PROJ_NAME.git"


#logx "Pushing for local gitlab ci..."
#
#    git push local-gitlab-ci

#logx "Manual pipeline run if dotglci_manual variable exist:"
#
#
