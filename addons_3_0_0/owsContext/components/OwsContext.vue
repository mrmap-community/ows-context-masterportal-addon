<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import getters from "../store/gettersOwsContext";
import mutations from "../store/mutationsOwsContext";
import LightButton from "../../../../src_3_0_0/shared/modules/buttons/components/LightButton.vue";
import {treeSubjectsKey, treeTopicConfigKey} from "../../../../src_3_0_0/shared/js/utils/constants";

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
            "allLayerConfigs",
            "portalConfig"
        ]),
        ...mapGetters("Menu", [
            "mainMenu"
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

            console.log('this.portalConfig ENDE', this.portalConfig);
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
        ...mapActions([
            "addLayerToLayerConfig",
            "extendLayers"
        ]),
        ...mapActions("Modules/OwsContext", ["modifyPortalConfig"]),
        ...mapActions("Modules/BaselayerSwitcher", ["updateLayerVisibilityAndZIndex"]),
        ...mapMutations("Modules/OwsContext", Object.keys(mutations)),
        ...mapMutations(["setPortalConfig"]),
        ...mapMutations("Menu", ["setMainMenu"]),
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

            // fetch meta data
            const metadataUrlIso = context.properties.contextMetadata?.find(link => link.indexOf("iso19139") !== -1);
            const metadataUrl = context.properties.contextMetadata;

            if (metadataUrlIso) {
                // todo: fetch metadata (needs example)
                // const metadataResponse = await fetch(metadataUrl);
                // const parser = new DOMParser();
                // const xml = parser.parseFromString(metadataResponse, "application/xml");
                // todo: get logo from metadata and update mainMenu.logo below
            }

            // set bbox
            const crs = mapCollection.getMapView("2D").getProjection().getCode();
            const extension = context.properties.extension[0].projections.find(p => p.code === crs);

            if (extension) {
                this.zoomToExtent({extent: extension?.bbox, options: {
                    padding: [5, 5, 5, 5]
                }});
            }
            // todo: convert bbox to current crs
            // todo: set max / min zoom based on extent

            // set title
            const modifiedMenu = {
                ...this.mainMenu,
                title: {
                    ...this.mainMenu.title,
                    link: metadataUrl,
                    logo: "",
                    text: context.properties?.title ?? "Unnamed OWS Context",
                    tooltip: context.properties?.title ?? "Unnamed OWS Context"
                }
            };

            this.setMainMenu(modifiedMenu);

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
                        baselayer: false,
                        // todo: display layer categories in Masterportal catalog
                        // continue here
                        datasets: [
                            {
                                md_id: "E8954AFE-F94F-45E1-B255-0E01C37D57D0",
                                csw_url: "https://metaver.de/csw",
                                show_doc_url: "https://metaver.de/trefferanzeige?cmd=doShowDocument&docuuid=",
                                bbox: "461468.96892897453,5916367.229806512,587010.9095989474,5980347.755797674",
                                rs_id: "https://registry.gdi-de.org/id/de.hh/d1c21e8d-f36d-4d15-8da5-b6bfc7adad4b",
                                kategorie_opendata: [
                                    "Bevölkerung und Gesellschaft"
                                ],
                                kategorie_inspire: ["kein INSPIRE-Thema"],
                                kategorie_organisation: "Bezirksämter",
                                md_name: l.properties.title
                            }
                        ]
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
                    // const kml = await this.addLayerConfig();
                    // if (kml) {
                    //     await this.importKML({raw: l.offerings[0].content[0].content, layer: layer.layer, filename: "test.kml"});
                    // }
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
            // todo: apply tree

            const newConfig = {
                [treeTopicConfigKey]: {
                    [treeSubjectsKey]: {
                        elements: tree
                    }
                },
                ...this.portalConfig
            };

            await this.setPortalConfig(newConfig, {root: true});

            // Object.keys(configJson[treeTopicConfigKey]).forEach(topic => {
            //     commit("setLayerConfigByParentKey", {layerConfigs: configJson[treeTopicConfigKey][topic], parentKey: topic}, {root: true});
            // });

            this.extendLayers(null, {root: true});

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
