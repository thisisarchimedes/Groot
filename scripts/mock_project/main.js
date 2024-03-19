/* eslint-disable @typescript-eslint/no-var-requires */
const axios = require('axios');

async function makeRequest() {
  try {
    const response = await axios.get('https://www.google.com');
    console.log('Request successful. Status code:', response.status);
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

async function startLoop() {
  while (true) {
    await makeRequest();
    console.log('Waiting for 5 seconds...');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

startLoop();
