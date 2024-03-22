# OWS Context Addon

This addon gives users the possibility to import OGC OWS Context documents into the Masterportal. A new button "OWS Context" is added to the main menu and allows the user to submit a remote URL to an OWS Context. The official documentation for OWS Context documents is available here:

http://www.owscontext.org/

Currently, only the GeoJSON format is supported.

All visible layers are shown in a flat hierarchy within the layer tree. Additional layers can be added from the layer catalog. Here the folder structure defined in the OWS Context document is supported.

## Setup

Add the addon to your Masterportal instance in the `addons/addons_3_0_0` folder.

Next, You need to add the `owsContext` to the application by editing the `config.js` file:

```
    addons: [
        ...
        "owsContext"
    ],
```

Adjust the `config.json` file, enabling the `addLayerButton` and activating the `owsContext` section:

```
{
  "Portalconfig": {
    "tree": {
      // ...
      "addLayerButton": true
    },
    "mainMenu": {
      // ...
      "sections": [
        [
          {
            "type": "owsContext"
          }
        ]
      ]
    }
  }
}
```

And that's it! You now can start importing OWS Context documents in the Masterportal.
