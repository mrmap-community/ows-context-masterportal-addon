<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import getters from "../store/gettersOwsContext";
import mutations from "../store/mutationsOwsContext";
import LightButton from "../../../../src_3_0_0/shared/modules/buttons/components/LightButton.vue";

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
        layerObjects: async function (object) {
            // Example function for layer import
            // new layerObjects
            const addLayer = await this.addLayerToLayerConfig({layerConfig: object, parentKey: "Baselayer"});

            if (addLayer) {
                console.log("layer has been added");
            }
            else {
                console.log("layer has been added. not.");
            }

        }
    },
    methods: {
        ...mapActions("Modules/LayerTree", ["removeLayer", "replaceByIdInLayerConfig"]),
        ...mapActions(["addLayerToLayerConfig"]),
        ...mapMutations("Modules/OwsContext", Object.keys(mutations)),
        parseContext: function () {
            // dummy context...
            // return layerObject as an example
            const dummyObject = {
                id: "ows-no-label",
                name: "OSM-WMS-no-labels",
                typ: "WMS",
                layers: "OSM-WMS-no-labels",
                url: "https://ows.terrestris.de/osm/service",
                version: "1.3.0",
                visibility: true,
                type: "layer",
                showInLayerTree: true
            };

            this.setLayerObjects(dummyObject);
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
            text="Parse OWS"
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
