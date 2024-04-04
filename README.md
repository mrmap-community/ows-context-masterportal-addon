# OWS Context Parser Masterportal Addon

This addon gives users the possibility to import OGC OWS Context documents into the Masterportal. A new button "OWS Context" is added to the main menu and allows the user to submit a remote URL to an OWS Context. The official documentation for OWS Context documents is available here:

https://www.owscontext.org/

Currently, only the GeoJSON format is supported.

All visible layers are shown in a flat hierarchy within the layer tree. Additional layers can be added from the layer catalog. The folder structure defined in the OWS Context document is supported.

## Installation of the OWS Context addon

Copy the addon at [./addons_3_0_0/owsContext/](./addons_3_0_0/owsContext/) into the `addons/addons_3_0_0` folder of your Masterportal instance. Configuration options are described [here](./addons_3_0_0/owsContext/doc/README.md).

## Standalone demo

- use node v20.x, e.g. `nvm use v20.12.0`
- run `./initSetup.sh`
- `cd masterportal-code && npm run start`
- Masterportal will be available at `https://localhost:9001`
- See demo portal config at `https://localhost:9001/portal/demo`

### Watch for code changes

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
