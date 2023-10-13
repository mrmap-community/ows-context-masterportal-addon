<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import getters from "../store/gettersOwsContext";
import mutations from "../store/mutationsOwsContext";
import LightButton from "../../../../src_3_0_0/shared/modules/buttons/components/LightButton.vue";
import {treeSubjectsKey} from "../../../../src_3_0_0/shared/js/utils/constants";

/**
 * @module modules/OwsContext
 */
export default {
    name: "OwsContext",
    components: {
        LightButton
    },
    data () {
        return {
            // owcUrl: "https://www.geoportal.rlp.de/mapbender/php/mod_exportWmc.php?wmcId=2506&outputFormat=json"
            owcUrl: "/portal/demo/resources/wmc.json"
        };
    },
    computed: {
        ...mapGetters("Modules/OwsContext", Object.keys(getters)),
        ...mapGetters([
            "allBaselayerConfigs",
            "allLayerConfigs"
        ])
    },
    watch: {
        layerObjects: async function (layerList) {
            // add layers to layer tree
            const promises = layerList.map(ll => {
                // todo: determine parentKey from ows context
                // return this.addLayerToLayerConfig({layerConfig: ll, parentKey: ll.folder});
                return this.addLayerToLayerConfig({layerConfig: ll, parentKey: treeSubjectsKey});
            });

            await Promise.allSettled(promises);
        }
    },
    methods: {
        ...mapActions("Modules/LayerTree", ["removeLayer", "replaceByIdInLayerConfig"]),
        ...mapActions("Maps", ["placingPointMarker", "zoomToExtent"]),
        ...mapActions("Alerting", ["addSingleAlert"]),
        ...mapActions("Modules/FileImport", [
            "addLayerConfig",
            "importKML",
            "importGeoJSON",
            "openDrawTool"
        ]),
        ...mapActions(["addLayerToLayerConfig"]),
        ...mapActions("Modules/OwsContext", ["modifyPortalConfig"]),
        ...mapActions("Modules/BaselayerSwitcher", ["updateLayerVisibilityAndZIndex"]),
        ...mapMutations("Modules/OwsContext", Object.keys(mutations)),
        ...mapMutations(["setPortalConfig"]),
        ...mapMutations("Modules/BaselayerSwitcher", [
            "setActivatedExpandable",
            "setBaselayerIds",
            "setTopBaselayerId"
        ]),
        parseContext: async function () {
            // remove existing layers
            this.allLayerConfigs.forEach(layer => this.removeLayer(layer));

            const response = await fetch(this.owcUrl, {});

            if (!response.ok) {
                this.addSingleAlert({
                    category: "error",
                    content: "Could not parse OWS Context"
                });
            }

            const context = await response.json();
            const crs = mapCollection.getMapView("2D").getProjection().getCode();
            const extension = context.properties.extension[0].projections.find(p => p.code === crs);

            this.zoomToExtent({extent: extension?.bbox, options: {
                padding: [5, 5, 5, 5]
            }});

            const owcLayers = context.features;
            const mpConfigs = owcLayers.map(l => {
                if (l.offerings[0].code === "http://www.opengis.net/spec/owc-atom/1.0/req/wms") {
                    const getMapOperation = l.offerings[0].operations.find(o => o.code === "GetMap");
                    const getMapUrl = getMapOperation?.href && new URL(getMapOperation?.href);
                    const getCapabilitiesOperation = l.offerings[0].operations.find(o => o.code === "GetCapabilities");
                    const getCapabilitiesUrl = getCapabilitiesOperation?.href && new URL(getCapabilitiesOperation?.href);

                    if (!getMapUrl) {
                        return false;
                    }

                    return {
                        id: l.properties.title,
                        name: l.properties.title,
                        typ: "WMS",
                        layers: getMapUrl?.searchParams.get("LAYERS"),
                        url: getMapUrl ? `${getMapUrl?.origin}${getMapUrl?.pathname}` : `${getCapabilitiesUrl?.origin}${getCapabilitiesUrl?.pathname}`,
                        version: getMapUrl?.searchParams.get("VERSION"),
                        visibility: l.properties?.active ?? getMapOperation?.extension?.active ?? true,
                        transparency: l.properties?.extension?.opacity ? 100 - (l.properties?.extension?.opacity * 100) : undefined,
                        type: "layer",
                        showInLayerTree: true,
                        folder: l.properties.folder,
                        baselayer: false
                    };
                }
                if (l.offerings[0].code === "http://www.opengis.net/spec/owc-atom/1.0/req/wmts") {
                    const getCapabilitiesOperation = l.offerings[0].operations.find(o => o.code === "GetCapabilities");
                    const getCapabilitiesUrl = getCapabilitiesOperation?.href && new URL(getCapabilitiesOperation?.href);

                    if (!getCapabilitiesUrl) {
                        return false;
                    }

                    return {
                        id: l.properties.title,
                        name: l.properties.title,
                        typ: "WMTS",
                        visibility: l.properties?.active,
                        transparency: l.properties?.extension?.opacity ? 100 - (l.properties?.extension?.opacity * 100) : undefined,
                        capabilitiesUrl: getCapabilitiesOperation?.href,
                        layers: l.properties?.extension?.layers, // todo: add extension for layer parameter
                        optionsFromCapabilities: true,
                        showInLayerTree: true,
                        folder: l.properties.folder,
                        baselayer: false
                    };
                }
                if (l.offerings[0].code === "http://www.opengis.net/spec/owc-atom/1.0/req/kml") {
                    // todo: position in layer tree
                    // todo: fix kml import
                    // this.addLayerConfig()
                    //     .then(layer => {
                    //         if (layer) {
                    //             this.importKML({raw: l.offerings[0].content[0].content, layer: layer.layer, filename: "test.kml"});
                    //         }
                    //     });
                }
                return {};
            });

            // eslint-disable-next-line
            const getFolderConfigs = (owcList, level) => {
                const lvlNFolders = owcList.filter(owc => owc.properties?.folder?.split("/").length === level + 1);

                return lvlNFolders.map((owcFolder) => {
                    const folder = owcFolder.properties?.folder;
                    const subElements = owcList.filter(owc => owc.properties?.folder?.startsWith(owcFolder.properties.folder));

                    return {
                        id: owcFolder.properties.folder,
                        name: owcFolder.properties.folder,
                        type: owcFolder.properties.folder ? "folder" : undefined,
                        elements: folder && getFolderConfigs(subElements, level + 1)
                    };
                });
            };

            const tree = getFolderConfigs(owcLayers, 1);
            console.log(tree);
            // todo: apply tree

            // restricted to first 20 layers for testing
            const validConfigs = mpConfigs.filter(config => Boolean(config));
            const firstWmsConfigs = [...validConfigs].slice(0, 10);

            this.setLayerObjects(firstWmsConfigs);
            // todo: refresh wmts layers to make them visible (due to optionsFromCapabilities)
        }
    }
};
</script>

<template lang="html">
    <div
        v-if="true"
        id="owsContext"
    >
        <p>Link hier einfügen (JSON):</p>
        <input
            v-model="owcUrl"
            placeholder="https://example.com/owc.json"
            customclass="w-100 justify-content-start"
        >
        <LightButton
            id="owsButton"
            :interaction="parseContext"
            text="Parse OWS Context"
            icon="bi-alipay"
            customclass="w-100 justify-content-start"
        />
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

#owsContext {
    display: flex;
    flex-direction: column;
}
#owsButton {
    margin-top: 10px;
}
</style>
