<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import {isProxy, toRaw} from "vue";
import getters from "../store/gettersOwsContext";
import mutations from "../store/mutationsOwsContext";
import LightButton from "../../../../src_3_0_0/shared/modules/buttons/components/LightButton.vue";
import {uniqueId} from "../../../../src_3_0_0/shared/js/utils/uniqueId.js";
import {treeSubjectsKey, treeTopicConfigKey, portalConfigKey, treeBaselayersKey} from "../../../../src_3_0_0/shared/js/utils/constants";
import layerCollection from "../../../../src_3_0_0/core/layers/js/layerCollection";
import {transformExtent} from "ol/proj";

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
            // owcUrl: "https://www.geoportal.rlp.de/mapbender/php/mod_exportWmc.php?wmcId=2506&outputFormat=json",
            owcUrl: "/portal/demo/resources/examples/wmc_metadata.json",
            // owcUrl: "/portal/demo/resources/examples/wmc.json",
            kmlLayers: []
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
    },
    methods: {
        ...mapActions("Modules/LayerTree", ["removeLayer", "replaceByIdInLayerConfig"]),
        ...mapActions("Maps", ["placingPointMarker", "zoomToExtent"]),
        ...mapActions("Alerting", ["addSingleAlert", "cleanup"]),
        ...mapActions("Modules/FileImport", [
            "importKML",
            "importGeoJSON",
            "openDrawTool"
        ]),
        ...mapActions([
            "addLayerToLayerConfig",
            "extendLayers"
        ]),
        ...mapActions("Modules/OwsContext", [
            "modifyPortalConfig",
            "addLayerConfigWithName"
        ]),
        ...mapActions("Modules/BaselayerSwitcher", ["updateLayerVisibilityAndZIndex"]),
        ...mapMutations("Modules/OwsContext", Object.keys(mutations)),
        ...mapMutations(["setPortalConfig"]),
        ...mapMutations("Modules/OpenConfig", ["setLayerConfigByParentKey"]),
        ...mapMutations("Menu", ["setMainMenu"]),
        ...mapMutations("Modules/BaselayerSwitcher", [
            "setActivatedExpandable",
            "setBaselayerIds",
            "setTopBaselayerId"
        ]),
        addKmlLayer: async function (kmlConfig) {
            this.modifyPortalConfig();
            const kml = await this.addLayerConfigWithName(kmlConfig.properties?.title);

            if (kml) {
                await this.importKML({raw: kmlConfig.offerings[0].content[0].content, layer: kml.layer, filename: "test.kml"});
            }
        },
        getMasterPortalConfigFromOwc: function (l) {
            // todo: the structure will change in the future: offerings will be a child of properties
            if (l.offerings[0].code === "http://www.opengis.net/spec/owc-atom/1.0/req/wms") {
                const getMapOperation = l.offerings[0].operations.find(o => o.code === "GetMap");
                const getMapUrl = getMapOperation?.href && new URL(getMapOperation?.href);
                const getCapabilitiesOperation = l.offerings[0].operations.find(o => o.code === "GetCapabilities");
                const getCapabilitiesUrl = getCapabilitiesOperation?.href && new URL(getCapabilitiesOperation?.href);
                const getFeatureInfoOperation = l.offerings[0].operations.find(o => o.code === "GetFeatureInfo");
                const crs = mapCollection.getMapView("2D").getProjection().getCode();

                if (!getMapUrl) {
                    // generate an empty folder if no getMap operation is specified
                    return {
                        id: `ows-${uniqueId()}`,
                        name: l.properties.title,
                        folder: l.properties.folder,
                        type: "folder"
                    };
                }

                let metadataId;
                let metadataUrl;

                if (l.properties?.resourceMetadata) {
                    // fetch metadata
                    const mdUrl = new URL(l.properties?.resourceMetadata);

                    metadataId = mdUrl.searchParams.get("id");
                    metadataUrl = `${mdUrl.origin}${mdUrl.pathname}?`;

                    // todo: metadata needs CORS headers
                    // const metadataResponse = await fetch(mdUrl);
                    // const parser = new DOMParser();
                    // const xml = parser.parseFromString(metadataResponse, "application/xml");
                }
                const mapParam = getMapUrl.searchParams.get("map");
                const mapServerParam = mapParam ? `?map=${mapParam}` : "";

                return {
                    id: `ows-${uniqueId()}`,
                    name: l.properties.title,
                    typ: "WMS",
                    layers: getMapUrl?.searchParams.get("LAYERS"),
                    url: getMapUrl ? `${getMapUrl?.origin}${getMapUrl?.pathname}${mapServerParam}` : `${getCapabilitiesUrl?.origin}${getCapabilitiesUrl?.pathname}`,
                    version: getMapUrl?.searchParams.get("VERSION"),
                    visibility: l.properties?.active ?? getMapOperation?.extension?.active ?? false,
                    transparency: l.properties?.extension?.opacity ? 100 - (l.properties?.extension?.opacity * 100) : 0,
                    transparent: true,
                    urlIsVisible: true,
                    featureCount: "1",
                    minScale: l.properties?.minScaleDenominator,
                    maxScale: l.properties?.maxScaleDenominator,
                    type: "layer",
                    crs: crs,
                    gfiAttributes: getFeatureInfoOperation ? "showAll" : "ignore",
                    gfiTheme: "default",
                    infoFormat: getFeatureInfoOperation?.type,
                    layerAttribution: "nicht vorhanden",
                    showInLayerTree: true,
                    folder: l.properties.folder,
                    notSupportedFor3DNeu: false,
                    singleTile: true, // forces single tiles to prevent performance issues
                    cache: false, // check which attributes are necessary
                    datasets: metadataUrl && [
                        {
                            md_id: metadataId,
                            csw_url: metadataUrl,
                            // show_doc_url: "https://metaver.de/trefferanzeige?cmd=doShowDocument&docuuid=",
                            // bbox: "461468.96892897453,5916367.229806512,587010.9095989474,5980347.755797674",
                            // rs_id: "https://registry.gdi-de.org/id/de.hh/d1c21e8d-f36d-4d15-8da5-b6bfc7adad4b",
                            md_name: l.properties.title
                            // md_name: "Verkehrslage auf Autobahnen (Schleifen) Hamburg",
                            // kategorie_opendata: ["Verkehr"], // todo: handle categories
                            // kategorie_inspire: ["Verkehrsnetze"],
                            // kategorie_organisation: "Behörde für Verkehr und Mobilitätswende (BVM)"
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
                this.kmlLayers.push(l);
            }
            return false;
        },
        getFolderConfigs: function (owcList, level) {
            const subFolders = owcList.filter(owc => owc.properties?.folder?.split("/").length === level + 1);
            const isLeafNode = subFolders.length === 0;

            if (isLeafNode) {
                return owcList.map(this.getMasterPortalConfigFromOwc);
            }

            return subFolders.map((owcFolder) => {
                const folder = owcFolder.properties?.folder;
                const subElements = owcList.filter(owc => owc.properties?.folder?.startsWith(owcFolder.properties.folder));

                return {
                    name: owcFolder.properties.title ?? owcFolder.properties.folder,
                    type: owcFolder.properties.folder ? "folder" : undefined,
                    elements: folder && this.getFolderConfigs(subElements, level + 1)
                };
            });
        },
        parseContext: async function () {
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
                // commented-out because metadata urls have to enable CORS
                // todo: fetch metadata (needs example)
                // const metadataResponse = await fetch(metadataUrl);
                // const parser = new DOMParser();
                // const xml = parser.parseFromString(metadataResponse, "application/xml");
                // todo: get logo from metadata and update mainMenu.logo below
            }

            // set bbox (from ows context extension)
            const crs = mapCollection.getMapView("2D").getProjection().getCode();

            if (context.properties.extension) {
                const extension = context.properties.extension[0].projections.find(p => p.code === crs);

                this.zoomToExtent({extent: extension.bbox});
            }
            else {
                const bbox = context.properties.bbox;
                const transformedBbox = transformExtent(bbox, "EPSG:4326", crs);

                this.zoomToExtent({extent: transformedBbox});
            }

            // set the application title
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

            const tree = this.getFolderConfigs(owcLayers, 1);

            const portalConfigNoProxy = isProxy(this.portalConfig) ? toRaw(this.portalConfig) : this.portalConfig;

            const newConfig = {
                [portalConfigKey]: portalConfigNoProxy,
                [treeTopicConfigKey]: {
                    [treeBaselayersKey]: {
                        elements: []
                    },
                    [treeSubjectsKey]: {
                        elements: tree
                    }
                }
            };

            layerCollection.clear();

            await this.setPortalConfig(newConfig, {root: true});
            Object.keys(newConfig[treeTopicConfigKey]).forEach(topic => {
                this.setLayerConfigByParentKey({layerConfigs: newConfig[treeTopicConfigKey][topic], parentKey: topic}, {root: true});
            });

            this.extendLayers(null, {root: true});

            for (let i = 0; i < this.kmlLayers.length; i++) {
                const kmlLayer = this.kmlLayers[i];

                await this.addKmlLayer(kmlLayer);
            }

            // remove import alerts
            this.cleanup();
        }
    }
};
</script>

<template lang="html">
    <div
        v-if="true"
        id="owsContext"
    >
        <p>Link hier einfügen (GeoJSON):</p>
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
