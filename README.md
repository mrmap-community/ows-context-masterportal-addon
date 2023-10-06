# OWS Context Parser Masterportal Addon

## Dev

- use node v16.18.1, e.g. `nvm use v16.18.1`
- run ./initSetup.sh
- `cd masterportal-code && npm run start`
- Masterportal Dev Mode will be started at `https://localhost:9001`
- See demo portal config at `https://localhost:9001/portal/demo`

### Watch for changes

- `npm i -g watch-build-copy`
- `mkdir ./masterportal-code/addons/addons_3_0_0`
- `watch-build-copy './addons_3_0_0' 'echo' './addons_3_0_0' './masterportal-code/addons/addons_3_0_0'`

