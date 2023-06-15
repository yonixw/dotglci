#!/usr/bin/env bash

# How it works, Steps:
#   1. Start the gitlab docker and let it init
#   2. Wait until response from HTTP port
#   3. Create access key with ruby bash inside docker
#   4. Register 2 workers 
#       4a. Get "authentication token" instead of old <v16 "registration token"
#   5. Using deno script with access token, create/update all needed inside structure
#       5a. Like variables
#   6. Add "local-gitlab-ci" origin and push the git (creates on push)
#   7. Reapeat step (6) to test ci changes

# exit when any command fails
set -e

logx () {
    echo "[****] [$(date +'%F %T')] $@"
}

# todo 
#   - script for push and get latests run->jobs->logs+artifacts+reports
#       timestamps?
#       publish html? unzip stuff?
#       console colors?
#       - POST /projects/:id/pipeline, wait for id, print every job that is done...

# Gitlab howto?
#   gitlab actions? (not repo dependant)
#   on job fail? stage fail? anyhow fail - cleanup?
#       like storybook fail on changes = need manual approve, o.w auto approve

DEV_ROOT_ACC=token-string-ABYZ000

logx "Starting the gitlab docker... "
logx "(gitlab is ~1.4GB pull->3GB unzip) ..."

    docker-compose down --volumes || logx "Skipping docker down..."
    docker-compose up --remove-orphans --force-recreate -d dotgitlabci

logx "Pulling images in the meantime... "

    docker-compose pull

logx "Waiting for HTTP server..."

    #docker-compose logs --timestamps --follow  gitlab &
    #LOGS_JOB=$!
    docker-compose run --rm curlhelper curl \
        --head -X GET --retry 30 --retry-all-errors --retry-delay 30 \
        http://dotgitlabci:80
    #kill $LOGS_JOB

logx "Setting up access token..."

    # the ruby script must start in first row (can't be empty due to bash linebreaks)
    docker-compose exec dotgitlabci gitlab-rails runner "token = \
        User.find_by_username('root').personal_access_tokens.create( \
            scopes: ['api','read_repository', 'write_repository'], \
            name: 'Automation token $(date +'%F %T')' \
        ); \
        token.set_token('$DEV_ROOT_ACC'); \
        token.save!"

logx "Setting up workers... (~0.7GB docker unzip)"
logx "Registering workers... 1/2"

    RUNNER_TOKEN=$(docker-compose run --rm curlhelper curl -X POST "http://dotgitlabci:80/api/v4/user/runners" \
        --header "private-token: $DEV_ROOT_ACC" \
        --header 'content-type: application/json' \
        --data "{\"runner_type\":\"instance_type\",\"runUntagged\":true,\"description\":\"My runner1 $(date +'%F %T')\"}" \
    | jq -r '.token' )

    docker-compose run runner1 register \
        --non-interactive \
        --executor "docker" \
        --url "http://dotgitlabci:80/" \
        --docker-image "ubuntu" \
        --docker-network-mode "gitlab_ci_local" \
        --docker-links "dotgitlabci" \
        --token "$RUNNER_TOKEN"


logx "Registering workers... 2/2"

    RUNNER_TOKEN2=$(docker-compose run --rm curlhelper curl -X POST "http://dotgitlabci:80/api/v4/user/runners" \
        --header "private-token: $DEV_ROOT_ACC" \
        --header 'content-type: application/json' \
        --data "{\"runner_type\":\"instance_type\",\"runUntagged\":true,\"description\":\"My runner2 $(date +'%F %T')\"}" \
    | jq -r '.token' )

    docker-compose run runner2 register \
        --non-interactive \
        --executor "docker" \
        --url "http://dotgitlabci:80/" \
        --docker-network-mode "gitlab_ci_local" \
        --docker-image "ubuntu" \
        --docker-links "dotgitlabci" \
        --token "$RUNNER_TOKEN2"

logx "Starting workers..."

    docker-compose up -d runner1 runner2

logx "Done local-gitlab-ci setup!"
