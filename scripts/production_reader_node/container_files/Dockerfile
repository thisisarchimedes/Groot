# Use the official node base image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package.json ./
COPY yarn.lock ./
COPY hardhat.config.js ./
COPY run_node.sh ./

# Install Hardhat and other dependencies
RUN yarn install

# Set the environment variable for Node.js
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS=--max-old-space-size=12288

# Start the Hardhat node
#CMD ["npx", "hardhat", "node", "--max-memory", "12288"]
CMD ["./run_node.sh"]