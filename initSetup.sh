#!/bin/bash

# Stop at first command failure.
set -e

#nvm use v16.18.1

GIT_COMMIT=f2238c2db198e95412101e491c0924c8949ae576


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
cp -r ../mp-demo-config portal/demo
