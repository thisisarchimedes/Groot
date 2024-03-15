#!/bin/bash

set -o allexport && source .env && set +o allexport
yarn tsx src/main.ts