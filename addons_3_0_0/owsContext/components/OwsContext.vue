<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import getters from "../store/gettersOwsContext";
import mutations from "../store/mutationsOwsContext";
import LightButton from "../../../../src_3_0_0/shared/modules/buttons/components/LightButton.vue";

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
            "addLayerConfigWithName",
            "parseContext"
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
        parseContextAction: async function () {
            await this.parseContext(this.owcUrl);
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
            :interaction="parseContextAction"
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
