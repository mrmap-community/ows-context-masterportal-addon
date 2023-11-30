import layerCollection from "../../../../src_3_0_0/core/layers/js/layerCollection";
import {treeTopicConfigKey} from "../../../../src_3_0_0/shared/js/utils/constants";
import {uniqueId} from "../../../../src_3_0_0/shared/js/utils/uniqueId.js";

const actions = {

    /**
     * Applies portal config.
     * @param {Object} param.commit the commit
     * @param {Progressevent} newConfig The portal config.
     * @returns {void}
     */
    async modifyPortalConfig ({commit}, newConfig) {
        return new Promise((resolve) => {
            commit("setPortalConfig", newConfig, {root: true});

            Object.keys(newConfig[treeTopicConfigKey]).forEach(topic => {
                commit("setLayerConfigByParentKey", {layerConfigs: newConfig[treeTopicConfigKey][topic], parentKey: topic}, {root: true});
            });
            resolve();
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
        if (layer.properties.offerings[0].code === "http://www.opengis.net/spec/owc-atom/1.0/req/wms") {
            const getMapOperation = layer.properties.offerings[0].operations.find(o => o.code === "GetMap");
            const getMapUrl = getMapOperation?.href && new URL(getMapOperation?.href);
            const getCapabilitiesOperation = layer.properties.offerings[0].operations.find(o => o.code === "GetCapabilities");
            const getCapabilitiesUrl = getCapabilitiesOperation?.href && new URL(getCapabilitiesOperation?.href);
            const getFeatureInfoOperation = layer.properties.offerings[0].operations.find(o => o.code === "GetFeatureInfo");
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

            const id = uniqueId();

            return {
                // todo: set sequence to fix layer order
                // id: `ows-wms-${uniqueId()}`,
                id: id,
                layerSequence: id,
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
        if (layer.properties.offerings[0].code === "http://www.opengis.net/spec/owc-atom/1.0/req/wmts") {
            const getCapabilitiesOperation = layer.properties.offerings[0].operations.find(o => o.code === "GetCapabilities");
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
        if (layer.properties.offerings[0].code === "http://www.opengis.net/spec/owc-atom/1.0/req/kml") {
            commit("setKmlLayers", [layer, ...state.kmlLayers]);
        }
        return Promise.reject();
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

        const childPromises = [];

        if (isLeafNode) {
            const promises = owcList.map(async (l) => dispatch("getMasterPortalConfigFromOwc", l));
            const settled = await Promise.allSettled(promises);

            return settled.filter(c => c.status === "fulfilled").map(c => c.value);
        }
        else if (subLeafs?.length > 0) {
            const promises = subLeafs.map(async (sl) => dispatch("getMasterPortalConfigFromOwc", sl));

            childPromises.push(...promises);
        }

        childPromises.push(...subFolders.map(async (owcFolder) => {
            const folder = owcFolder.properties?.folder;
            const subElements = owcList.filter(owc => owc.properties?.folder?.startsWith(owcFolder.properties.folder));

            const id = uniqueId();

            return {
                name: folder,
                // id: owcFolder.properties.uid ?? `layer-${uniqueId()}`,
                // todo: static is is needed to add layer by parentKey
                // id: `layer-${uniqueId()}`,
                id: id,
                showInLayerTree: false,
                type: "folder",
                folder: folder,
                elements: folder && await dispatch("getFolderConfigs", {owcList: subElements, level: level + 1})
            };
        }));

        const children = await Promise.allSettled(childPromises);

        return children.filter(c => c.status === "fulfilled").map(c => c.value);
    },

    /**
     * Adds a layer Config to app-store layerConfigs
     * @param {Object} param.dispatch the dispatch
     * @param {Object} param.state the state
     * @param {Object} name the name
     * @param {Object} parentKey the Parent-Key
     * @returns {ol/layer} The created layer.
     */
    async addLayerConfigWithName ({dispatch, state}, {name, parentKey}) {
        if (!layerCollection.getLayerById(state.layerId)) {
            await dispatch("addLayerToLayerConfig", {
                layerConfig: {
                    id: state.layerId,
                    name: name ?? "importDrawLayer",
                    showInLayerTree: true,
                    typ: "VECTORBASE",
                    type: "layer",
                    visibility: true,
                    // layerSequence: 1 // adds layer at first position
                },
                parentKey: parentKey
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
        const parentKey = kmlConfig.properties.folder;

        const kml = await dispatch("addLayerConfigWithName", {name: kmlConfig.properties?.title, parentKey: kmlConfig.properties.folder});

        if (kml) {
            await dispatch("Modules/FileImport/importKML", {raw: kmlConfig.properties.offerings[0].content[0].content, layer: kml.layer, filename: "test.kml"}, {root: true});
        }
    }

};

export default actions;
