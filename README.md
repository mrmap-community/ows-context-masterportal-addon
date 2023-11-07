# OWS Context Parser Masterportal Addon

## Dev

- use node v18.x, e.g. `nvm use v18.18.2`
- run `./initSetup.sh`
- `cd masterportal-code && npm run start`
- Masterportal Dev Mode will be started at `https://localhost:9001`
- See demo portal config at `https://localhost:9001/portal/demo`

### Watch for changes

```sh
mkdir -p ./masterportal-code/addons/addons_3_0_0/owsContext
cd addons_3_0_0/owsContext
npm i
npm run watch:copyto ./ ../../masterportal-code/addons/addons_3_0_0/owsContext
```

### Watch for changes (configuration files)

```sh
npm run watch:copyto ../../mp-demo-config ../../masterportal-code/portal/demo
```