<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import getters from "../store/gettersOwsContext";
import mutations from "../store/mutationsOwsContext";
import LightButton from "../../../../src_3_0_0/shared/modules/buttons/components/LightButton.vue";
import layerCollection from "../../../../src_3_0_0/core/layers/js/layerCollection";

/**
 * @module modules/OwsContext */
export default {
    name: "OwsContext",
    components: {
        LightButton
    },
    data () {
        return {
            exampleProp: undefined
        };
    },
    computed: {
        ...mapGetters("Modules/OwsContext", Object.keys(getters))
    },
    watch: {
        layerObjects: async function (layerList) {
            // function for layer import
            const promises = layerList.map(ll => {
                return this.addLayerToLayerConfig({layerConfig: ll, parentKey: "Baselayer"});
            });
            const results = await Promise.allSettled(promises);

            if (results) {
                console.log("context has been added");
            } else {
                console.log("context has not been added.");
            }
        }
    },
    methods: {
        ...mapActions("Modules/LayerTree", ["removeLayer", "replaceByIdInLayerConfig"]),
        ...mapActions(["addLayerToLayerConfig"]),
        ...mapMutations("Modules/OwsContext", Object.keys(mutations)),
        parseContext: async function () {
            // clear layers
            layerCollection.clear();

            const url = '/portal/demo/resources/wmc.json';
            const response = await fetch(url, {});
            const context = await response.json();
            console.log('context', context);
            const layers = context.features;
            const mpConfigs = layers.map(l => {
                if (l.offerings[0].code === 'http://www.opengis.net/spec/owc-atom/1.0/req/wms') {
                    const getMapOperation = l.offerings[0].operations.find(o => o.code === 'GetMap');
                    const getCapabilitiesOperation = l.offerings[0].operations.find(o => o.code === 'GetCapabilities');
                    const getMapUrl = getMapOperation?.href && new URL(getMapOperation?.href);
                    const getCapabilitiesUrl = getCapabilitiesOperation?.href && new URL(getCapabilitiesOperation?.href);

                    const obj = {
                        id: "ows-no-label",
                        name: l.properties.title,
                        typ: "WMS",
                        layers: getMapUrl?.searchParams.get('LAYERS'),
                        url: `${getMapUrl?.origin}${getMapUrl?.pathname}`,
                        version: getMapUrl?.searchParams.get('VERSION'),
                        visibility: true,
                        type: "layer",
                        showInLayerTree: true
                    };
                    return obj;
                } else {
                    return {};
                }
            });

            // add first 10 layers
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
        <LightButton
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
    width: 30vw;
    display: flex;
    align-items: center;
}
</style>
