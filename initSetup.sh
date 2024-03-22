#!/bin/bash

# Stop at first command failure.
set -e

#nvm use v18

GIT_COMMIT=e4f81fc874efb7b6297c3684f6a32bdc5f8dfc81

if [ ! -d "masterportal-code" ]; then
    git clone https://geowerkstatt@bitbucket.org/geowerkstatt-hamburg/masterportal.git masterportal-code
fi

cd masterportal-code
git fetch --all
# checkout version tag
git checkout $GIT_COMMIT
# install dependencies
npm ci

# install importer add-on dependencies
# mkdir -p addons/addons_3_0_0
# touch addons/addons_3_0_0/addonsConf.json
# echo "{}" > addons/addons_3_0_0/addonsConf.json
cp -r ../addons_3_0_0 addons/

# copy demo config
mkdir -p portal/demo
cp -r ../mp-demo-config/* portal/demo
