import layerCollection from "../../../../src_3_0_0/core/layers/js/layerCollection";
import {treeSubjectsKey} from "../../../../src_3_0_0/shared/js/utils/constants";

const actions = {

    /**
     * Applies portal config.
     * @param {Object} param.commit the commit
     * @param {Object} param.dispatch the dispatch
     * @param {Progressevent} portalConfig The portal config.
     * @returns {void}
     */
    modifyPortalConfig ({commit}, portalConfig) {
        // const configJson = JSON.parse(event.target.result);

        layerCollection.clear();
        commit("setPortalConfig", portalConfig, {root: true});
        // Object.keys(configJson[treeTopicConfigKey]).forEach(topic => {
        //     commit("setLayerConfigByParentKey", {layerConfigs: configJson[treeTopicConfigKey][topic], parentKey: topic}, {root: true});
        // });
        // dispatch("extendLayers", null, {root: true});
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
    }
};

export default actions;
