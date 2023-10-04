#!/bin/bash

# Stop at first command failure.
set -e

#nvm use v16.18.1

COMMIT_HASH=bc88b5af8d9f1ecdc939993a285783448a6d81bb


if [ ! -d "masterportal-code" ]; then
    git clone https://geowerkstatt@bitbucket.org/geowerkstatt-hamburg/masterportal.git masterportal-code
fi

cd masterportal-code
# checkout version tag
git checkout $COMMIT_HASH
# install dependencies
npm ci

# install importer add-on dependencies
# mkdir -p addons/addons_3_0_0
# touch addons/addons_3_0_0/addonsConf.json
# echo "{}" > addons/addons_3_0_0/addonsConf.json
cp -r ../addons_3_0_0 addons/

# copy demo config
cp -r ../mp-demo-config portal/demo
