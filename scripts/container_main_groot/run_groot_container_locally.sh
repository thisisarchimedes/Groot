#!/bin/bash

set -o allexport && source .env.local && set +o allexport

docker run -d -e AWS_REGION=$AWS_REGION -e ENVIRONMENT=$ENVIRONMENT --rm --name groot -p 8001:8001 groot-container
# docker run -it --rm --entrypoint /bin/bash groot-container


