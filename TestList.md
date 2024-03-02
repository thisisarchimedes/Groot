# Tests

## Node Reader
- Can get latest block number from a local running node
- Can reset node and get a newer block number
- Can manage 2 nodes, and decide which one is more up to date
- Can facilitate read call, decide which node to use
- Can handle node failuire, and switch to another node, kill the old one and spin a new backup node
- Can handle all nodes failing, and report error and spin new nodes