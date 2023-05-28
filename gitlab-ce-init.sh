#!/bin/bash

# exit when any command fails
set -e

logx () {
    echo "[*] [$(date +'%F %T')] $@"
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


RUNNER_TOKEN=$(curl -X POST "http://localhost:15080/api/v4/user/runners" \
    --header "private-token: $DEV_ROOT_ACC" \
    --header 'content-type: application/json' \
    --data "{\"runner_type\":\"instance_type\",\"runUntagged\":true,\"description\":\"My runner1\"}" \
  | jq -r '.token' )

gitlab-runner register
    --non-interactive \
    --executor "shell" \
    --url "http://localhost:15080/" \
    --token "$RUNNER_TOKEN"

logx "Registering workers"

exit 0 #----------------------------------------------------


logx "Starting the docker... (~1.4GB pull)"

    docker-compose up gitlab -d

logx "Waiting for HTTP server..."

    curl --head -X GET --retry 30 --retry-all-errors --retry-delay 30 http://localhost:15080

logx "Setting up access token..."

    docker-compose exec gitlab gitlab-rails runner "\
        token = User.find_by_username('root').personal_access_tokens.create(scopes: ['api','admin_mode'], name: 'Automation token $(date +'%F %T')'); \
        token.set_token('$DEV_ROOT_ACC'); \
        token.save!"

# Rails.logger.level = 0
# ActiveRecord::Base.logger = Logger.new(STDOUT)

## Check the GitLab version fast
## grep -m 1 gitlab /opt/gitlab/version-manifest.txt



