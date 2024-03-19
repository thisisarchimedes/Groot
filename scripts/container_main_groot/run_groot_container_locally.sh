#!/bin/bash

docker run -d --rm --name groot -p 8001:8001 groot-container
# docker run -it --rm --entrypoint /bin/bash groot-container