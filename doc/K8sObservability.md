# Pixie

## Access UI

https://work.withpixie.ai:443

## Install Pixe in Cluster 

### Before You Start
- Do this once when creating a cluster (NOT every time we  deploy)
- Make sure kubectl is pointing to the correct EKS

### Install
```bash
bash -c "$(curl -fsSL https://work.withpixie.ai/install.sh)"
px auth login
px deploy
```

## New Relic integration

Pixie is integrated with NewRelic - see https://onenr.io/0MRNxYydAQn
