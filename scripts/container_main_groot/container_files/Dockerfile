FROM node:20

# Create app directory
WORKDIR /usr/src/app

RUN mkdir /usr/src/app/src
COPY src ./src

# TODO: We are temporarly using a few stubs from the test directory - remove this when we have production implementation
RUN mkdir /usr/src/app/test
COPY test ./test

COPY scripts/container_main_groot/container_files/* /usr/src/app/
COPY package.json /usr/src/app
COPY tsconfig.json /usr/src/app

# Install app dependencies
RUN yarn install

# Run the app
CMD ["./run_groot.sh"]