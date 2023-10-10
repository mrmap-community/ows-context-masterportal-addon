import layerCollection from "../../../core/layers/js/layerCollection";
// import {treeTopicConfigKey} from "../../../shared/js/utils/constants";

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
    }
};

export default actions;
