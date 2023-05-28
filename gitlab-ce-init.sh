#!/bin/bash

# exit when any command fails
set -e

logx () {
    echo "[****] [$(date +'%F %T')] $@"
}

# Steps:
#   1. Start the gitlab docker and let it init
#   2. Wait until response from HTTP port
#   3. Create access key with ruby bash inside docker
#   5. Register 2 workers 
#       5a. Get "authentication token" instead of old <v16 "registration token"
#   4. Using terraform with access token, create all needed inside structure
#   6. Add "local-gitlab-ci" origin and push the git
#   7. Reapeat step (6) to test ci changes

DEV_ROOT_PASS=TestStrongTextDontUse!
DEV_ROOT_ACC=token-string-ABYZ000

logx "Starting the docker... (~1.4GB pull)"

    docker-compose up --remove-orphans -d gitlab

logx "Waiting for HTTP server..."

    docker-compose run -it --rm helper curl --head -X GET --retry 30 --retry-all-errors --retry-delay 30 http://gitlab:80

logx "Setting up access token..."

    docker-compose exec gitlab gitlab-rails runner "\
        token = User.find_by_username('root').personal_access_tokens.create( \
            scopes: ['api'], \
            name: 'Automation token $(date +'%F %T')' \
        ); \
        token.set_token('$DEV_ROOT_ACC'); \
        token.save!"

logx "Registering workers... 1/2"

#docker-compose up -d runner1 

RUNNER_TOKEN=$(docker-compose run --rm helper curl -X POST "http://gitlab:80/api/v4/user/runners" \
    --header "private-token: $DEV_ROOT_ACC" \
    --header 'content-type: application/json' \
    --data "{\"runner_type\":\"instance_type\",\"runUntagged\":true,\"description\":\"My runner1 $(date +'%F %T')\"}" \
  | jq -r '.token' )

docker-compose run runner1 register \
    --non-interactive \
    --executor "docker" \
    --url "http://gitlab:80/" \
    --docker-image "ubuntu" \
    --token "$RUNNER_TOKEN"


logx "Registering workers... 2/2"

#docker-compose up -d runner2

RUNNER_TOKEN2=$(docker-compose run --rm helper curl -X POST "http://gitlab:80/api/v4/user/runners" \
    --header "private-token: $DEV_ROOT_ACC" \
    --header 'content-type: application/json' \
    --data "{\"runner_type\":\"instance_type\",\"runUntagged\":true,\"description\":\"My runner2 $(date +'%F %T')\"}" \
  | jq -r '.token' )

docker-compose run runner2 register \
    --non-interactive \
    --executor "docker" \
    --url "http://gitlab:80/" \
    --docker-image "ubuntu" \
    --token "$RUNNER_TOKEN2"

