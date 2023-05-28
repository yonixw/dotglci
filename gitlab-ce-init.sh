#!/bin/bash

# Steps:
#   1. Start the gitlab docker and let it init
#   2. Wait until response from HTTP port
#   3. Create access key with ruby bash inside docker
#   4. Using terraform with access token, create all needed inside structure
#   5. Register 2 workers 
#   6. Add "local-gitlab-ci" origin and push the git
#   7. Reapeat step (6) to test ci changes