<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import getters from "../store/gettersOwsContext";
import mutations from "../store/mutationsOwsContext";
import LightButton from "../../../../src_3_0_0/shared/modules/buttons/components/LightButton.vue";
import layerCollection from "../../../../src_3_0_0/core/layers/js/layerCollection";

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
            owcUrl: "/portal/demo/resources/wmc.json"
        };
    },
    computed: {
        ...mapGetters("Modules/OwsContext", Object.keys(getters)),
        ...mapGetters([
            "portalConfig"
        ])
    },
    watch: {
        layerObjects: async function (layerList) {
            const promises = layerList.map(ll => {
                // todo: determine parentKey from ows context
                return this.addLayerToLayerConfig({layerConfig: ll, parentKey: "Baselayer"});
            });

            await Promise.allSettled(promises);
        }
    },
    methods: {
        ...mapActions("Modules/LayerTree", ["removeLayer", "replaceByIdInLayerConfig"]),
        ...mapActions(["addLayerToLayerConfig"]),
        ...mapActions("Modules/OwsContext", ["modifyPortalConfig"]),
        ...mapMutations("Modules/OwsContext", Object.keys(mutations)),
        ...mapMutations(["setPortalConfig"]),
        parseContext: async function () {
            // clear layers
            layerCollection.clear();

            const response = await fetch(this.owcUrl, {});
            const context = await response.json();
            const owsProperties = context.properties;

            const portalConfig = this.portalConfig;

            const newConfig = {
                mapView: {
                    // todo: convert to crs
                    extent: owsProperties.bbox
                },
                ...portalConfig
            };

            // todo: properly generate new config
            this.setPortalConfig(newConfig);

            // or: commit via action
            // this.modifyPortalConfig(newConfig);

            const layers = context.features;
            const mpConfigs = layers.map(l => {
                if (l.offerings[0].code === "http://www.opengis.net/spec/owc-atom/1.0/req/wms") {
                    const getMapOperation = l.offerings[0].operations.find(o => o.code === "GetMap");
                    const getMapUrl = getMapOperation?.href && new URL(getMapOperation?.href);
                    // const getCapabilitiesOperation = l.offerings[0].operations.find(o => o.code === "GetCapabilities");
                    // const getCapabilitiesUrl = getCapabilitiesOperation?.href && new URL(getCapabilitiesOperation?.href);

                    const obj = {
                        id: l.properties.title,
                        name: l.properties.title,
                        typ: "WMS",
                        layers: getMapUrl?.searchParams.get("LAYERS"),
                        url: `${getMapUrl?.origin}${getMapUrl?.pathname}`,
                        version: getMapUrl?.searchParams.get("VERSION"),
                        visibility: true,
                        type: "layer",
                        showInLayerTree: true
                    };

                    return obj;
                }
                return {};
            });

            // restrict to first 10 layers for testing
            const firstWmsConfigs = [...mpConfigs].slice(0, 10);

            this.setLayerObjects(firstWmsConfigs);
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
