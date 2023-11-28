import layerCollection from "../../../../src_3_0_0/core/layers/js/layerCollection";
import {treeSubjectsKey, treeTopicConfigKey, portalConfigKey, treeBaselayersKey} from "../../../../src_3_0_0/shared/js/utils/constants";
import {transformExtent} from "ol/proj";
import {uniqueId} from "../../../../src_3_0_0/shared/js/utils/uniqueId.js";
import {isProxy, toRaw} from "vue";

const actions = {

    /**
     * Applies portal config.
     * @param {Object} param.commit the commit
     * @param {Progressevent} newConfig The portal config.
     * @returns {void}
     */
    modifyPortalConfig ({commit}, newConfig) {
        commit("setPortalConfig", newConfig, {root: true});

        Object.keys(newConfig[treeTopicConfigKey]).forEach(topic => {
            commit("setLayerConfigByParentKey", {layerConfigs: newConfig[treeTopicConfigKey][topic], parentKey: topic}, {root: true});
        });
    },

    /**
     * Generates portal config from OWS Context.
     * @param {Object} param.commit the commit
     * @param {Progressevent} layer The layer.
     * @returns {void}
     */
    async getMasterPortalConfigFromOwc ({commit, state}, layer) {
        // todo: the structure will change in the future: offerings will be a child of properties
        if (layer.offerings[0].code === "http://www.opengis.net/spec/owc-atom/1.0/req/wms") {
            const getMapOperation = layer.offerings[0].operations.find(o => o.code === "GetMap");
            const getMapUrl = getMapOperation?.href && new URL(getMapOperation?.href);
            const getCapabilitiesOperation = layer.offerings[0].operations.find(o => o.code === "GetCapabilities");
            const getCapabilitiesUrl = getCapabilitiesOperation?.href && new URL(getCapabilitiesOperation?.href);
            const getFeatureInfoOperation = layer.offerings[0].operations.find(o => o.code === "GetFeatureInfo");
            const crs = mapCollection.getMapView("2D").getProjection().getCode();

            if (!getMapUrl) {
                // generate an empty folder if no getMap operation is specified
                return {
                    id: `ows-${uniqueId()}`,
                    name: layer.properties.title,
                    folder: layer.properties.folder,
                    type: "folder"
                };
            }

            const metadataUrl = layer.properties?.resourceMetadata;
            const mapParam = getMapUrl.searchParams.get("map");
            const mapServerParam = mapParam ? `?map=${mapParam}` : "";

            return {
                id: `ows-wms-${uniqueId()}`,
                name: layer.properties.title,
                typ: "WMS",
                layers: getMapUrl?.searchParams.get("LAYERS"),
                url: getMapUrl ? `${getMapUrl?.origin}${getMapUrl?.pathname}${mapServerParam}` : `${getCapabilitiesUrl?.origin}${getCapabilitiesUrl?.pathname}`,
                version: getMapUrl?.searchParams.get("VERSION"),
                visibility: layer.properties?.active ?? getMapOperation?.extension?.active ?? false,
                transparency: layer.properties?.extension?.opacity ? 100 - (layer.properties?.extension?.opacity * 100) : 0,
                transparent: true,
                urlIsVisible: true,
                featureCount: "1",
                minScale: layer.properties?.minScaleDenominator,
                maxScale: layer.properties?.maxScaleDenominator,
                type: "layer",
                crs: crs,
                gfiAttributes: getFeatureInfoOperation ? "showAll" : "ignore",
                gfiTheme: "default",
                infoFormat: getFeatureInfoOperation?.type,
                layerAttribution: "nicht vorhanden",
                showInLayerTree: layer.properties?.active ?? getMapOperation?.extension?.active ?? false,
                folder: layer.properties.folder,
                notSupportedFor3DNeu: false,
                singleTile: true, // forces single tiles to prevent performance issues
                cache: false, // check which attributes are necessary
                datasets: metadataUrl && [
                    {
                        md_id: undefined,
                        customMetadata: true,
                        csw_url: metadataUrl,
                        md_name: layer.properties.title
                    }
                ]
            };
        }
        if (layer.offerings[0].code === "http://www.opengis.net/spec/owc-atom/1.0/req/wmts") {
            const getCapabilitiesOperation = layer.offerings[0].operations.find(o => o.code === "GetCapabilities");
            const getCapabilitiesUrl = getCapabilitiesOperation?.href && new URL(getCapabilitiesOperation?.href);

            if (!getCapabilitiesUrl) {
                return false;
            }

            return {
                id: `ows-wmts-${uniqueId()}`,
                name: layer.properties.title,
                typ: "WMTS",
                visibility: layer.properties?.active,
                transparency: layer.properties?.extension?.opacity ? 100 - (layer.properties?.extension?.opacity * 100) : undefined,
                capabilitiesUrl: getCapabilitiesOperation?.href,
                layers: layer.properties?.extension?.layers, // todo: add extension for layer parameter
                optionsFromCapabilities: true,
                showInLayerTree: layer.properties?.active ?? false,
                folder: layer.properties.folder,
                baselayer: false
            };
        }
        if (layer.offerings[0].code === "http://www.opengis.net/spec/owc-atom/1.0/req/kml") {
            commit("setKmlLayers", [layer, ...state.kmlLayers]);
        }
        return false;
    },

    /**
     * Generates folder configs.
     * @param {Object} param.commit the commit
     * @param {Progressevent} level The tree level
     * @param {Progressevent} owcList The list of owc layers
     * @returns {void}
     */
    async getFolderConfigs ({dispatch}, {owcList, level}) {
        const subFolders = owcList.filter(owc => owc.properties?.folder?.split("/").length === level + 1);

        const subLeafs = owcList.filter(owc => owc.properties?.folder?.split("/").length === level);

        const isLeafNode = subFolders.length === 0;

        const children = [];

        if (isLeafNode) {
            // todo: fix promise issues
            return owcList.map(this.getMasterPortalConfigFromOwc);
        }
        else if (subLeafs?.length > 0) {

            children.push(...subLeafs.map(this.getMasterPortalConfigFromOwc));
        }

        children.push(...subFolders.map(async (owcFolder) => {
            const folder = owcFolder.properties?.folder;
            const subElements = owcList.filter(owc => owc.properties?.folder?.startsWith(owcFolder.properties.folder));

            return {
                name: folder,
                id: `layer-${uniqueId()}`,
                showInLayerTree: false,
                type: "folder",
                folder: folder,
                // elements: folder && this.getFolderConfigs(subElements, level + 1, folder)
                elements: folder && await dispatch("getFolderConfigs", {owcList: subElements, level: level + 1})
            };
        }));

        return children;
    },

    /**
     * Parses ows context.
     * @param {Object} param.commit the commit
     * @param {Progressevent} owcUrl The context url.
     * @returns {void}
     */
    async parseContext ({commit, dispatch, state, rootState}, owcUrl) {
        const response = await fetch(owcUrl, {});

        if (!response.ok) {
            await dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: "Could not parse OWS Context"
            }, {root: true});
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

            await dispatch("Maps/zoomToExtent", {extent: extension.bbox}, {root: true});
        }
        else {
            const bbox = context.properties.bbox;
            const transformedBbox = transformExtent(bbox, "EPSG:4326", crs);

            await dispatch("Maps/zoomToExtent", {extent: transformedBbox}, {root: true});
        }

        // set the application title
        const modifiedMenu = {
            ...rootState.portalConfig.mainMenu,
            title: {
                ...rootState.portalConfig.mainMenu.title,
                link: metadataUrl,
                logo: "",
                text: context.properties?.title ?? "Unnamed OWS Context",
                tooltip: context.properties?.title ?? "Unnamed OWS Context"
            }
        };

        commit("Menu/setMainMenu", modifiedMenu, {root: true});

        const owcLayers = context.features;

        const tree = await dispatch("getFolderConfigs", {owcList: owcLayers, level: 1});

        console.log('tree', tree);

        const portalConfigNoProxy = isProxy(rootState.portalConfig) ? toRaw(rootState.portalConfig) : rootState.portalConfig;

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

        await dispatch("modifyPortalConfig", newConfig);

        // kml import
        for (let i = 0; i < state.kmlLayers.length; i++) {
            const kmlLayer = state.kmlLayers[i];

            await dispatch("addKmlLayer", kmlLayer);
        }

        // remove import alerts
        await dispatch("Alerting/cleanup", "", {root: true});
    },

    /**
     * Adds a layer Config to app-store layerConfigs
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.state the state
     * @param {Object} name the name
     * @returns {ol/layer} The created layer.
     */
    async addLayerConfigWithName ({dispatch, state}, name) {
        if (!layerCollection.getLayerById(state.layerId)) {
            await dispatch("addLayerToLayerConfig", {
                layerConfig: {
                    id: state.layerId,
                    name: name ?? "importDrawLayer",
                    showInLayerTree: true,
                    typ: "VECTORBASE",
                    type: "layer",
                    visibility: true
                },
                parentKey: treeSubjectsKey
            }, {root: true});
        }

        return layerCollection.getLayerById(state.layerId);
    },

    /**
     * Adds a layer Config to app-store layerConfigs
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.state the state
     * @param {Object} kmlConfig the kml config
     * @returns {ol/layer} The created layer.
     */
    async addKmlLayer ({dispatch}, kmlConfig) {
        const kml = await dispatch("addLayerConfigWithName", kmlConfig.properties?.title);

        if (kml) {
            await dispatch("Modules/FileImport/importKML", {raw: kmlConfig.offerings[0].content[0].content, layer: kml.layer, filename: "test.kml"}, {root: true});
        }
    }

};

export default actions;
