#!/bin/bash

set -o allexport && source .env.local && set +o allexport

docker run --network host -d -e AWS_REGION=$AWS_REGION -e ENVIRONMENT=$ENVIRONMENT -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY -e MAIN_LOCAL_NODE_PORT=8545 -e ALT_LOCAL_NODE_PORT=18545 --rm --name groot -p 8001:8001 groot-container
# docker run -it --rm --entrypoint /bin/bash groot-container
