# OWS Context Parser Masterportal Addon

## Dev

- use node v16.18.1, e.g. `nvm use v16.18.1`
- run ./initSetup.sh
- `cd masterportal-code && npm run start`
- Masterportal Dev Mode will be started at `https://localhost:9001`
- See demo portal config at `https://localhost:9001/portal/demo`
- Bugfix in layerFactory.js necessary
    - https://bitbucket.org/geowerkstatt-hamburg/masterportal/issues/1085/beta-l-sst-sich-nicht-via-npm-start-unter

### Watch for changes

```sh
mkdir -p ./masterportal-code/addons/addons_3_0_0/owsContext
cd addons_3_0_0/owsContext
npm i
npm run watch:copyto ../../masterportal-code/addons/addons_3_0_0/owsContext
```

