1. Create a Groot container (figure how to send the ENVIRONMENT, REGION, and AWS keys to the container)
1.1 Add Groot to a container
1.2. Run the Pod Groot + 2 Nodes (might need to chage Node class)
2. Use Docker Compose to create the following containers: Groot, Mockoon, Envoy
2.1. Proxy config should transfer original URL in the header
3. Write Mocha test that loads the containers and Mocko0n config

--

- Start with Docker Compose (or directly with minikube)
- Write test without mock just to see that we can communicate with local eth nodes and reset them