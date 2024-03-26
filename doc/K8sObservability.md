# Pixie

## UI

https://work.withpixie.ai/live/clusters/SAMDeployUser%40groot-stable-app.us-west-2.eksctl.io

## Install Pixe in Cluster 

### Before You Start
- Do this once when creating a cluster (not every deploy)
- Make sure kubectl is pointing to the correct EKS

### Install
```bash
bash -c "$(curl -fsSL https://work.withpixie.ai/install.sh)"
px auth login
px deploy
```
