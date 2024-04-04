<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import getters from "../store/gettersOwsContext";
import mutations from "../store/mutationsOwsContext";
import LightButton from "../../../../src_3_0_0/shared/modules/buttons/components/LightButton.vue";
import {treeSubjectsKey, treeBaselayersKey} from "../../../../src_3_0_0/shared/js/utils/constants";
import {transformExtent} from "ol/proj";
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
            // owcUrl: "https://www.geoportal.rlp.de/mapbender/php/mod_exportWmc.php?wmcId=2506&outputFormat=json"
            // owcUrl: "/portal/demo/resources/examples/wmc.json"
            owcUrl: "/portal/demo/resources/examples/wmc_metadata.json"
            // owcUrl: ""
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
    methods: {
        ...mapActions("Maps", ["placingPointMarker", "zoomToExtent"]),
        ...mapActions("Alerting", ["addSingleAlert", "cleanup"]),
        ...mapActions([
            "extendLayers"
        ]),
        ...mapActions("Modules/OwsContext", [
            "getFolderConfigs",
            "addKmlLayer"
        ]),
        ...mapMutations("Modules/OwsContext", Object.keys(mutations)),
        ...mapMutations(["setPortalConfig", "setLayerConfig"]),
        ...mapMutations("Modules/OpenConfig", ["setLayerConfigByParentKey"]),
        ...mapMutations("Menu", ["setMainMenu"]),
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
                    link: metadataUrl[0],
                    logo: "",
                    text: context.properties?.title ?? "Unnamed OWS Context",
                    tooltip: context.properties?.title ?? "Unnamed OWS Context"
                }
            };

            this.setMainMenu(modifiedMenu);

            const owcLayers = context.features;

            const tree = await this.getFolderConfigs({owcList: owcLayers, level: 1});

            const layerConfig = {
                [treeBaselayersKey]: {
                    elements: []
                },
                [treeSubjectsKey]: {
                    // reverse tree to match OWS Context layer order
                    elements: tree.reverse()
                }
            };

            layerCollection.clear();

            Object.keys(layerConfig).forEach(topic => {
                this.setLayerConfigByParentKey({layerConfigs: layerConfig[topic], parentKey: topic}, {root: true});
            });
            this.extendLayers();

            for (let i = 0; i < this.kmlLayers.length; i++) {
                const kmlLayer = this.kmlLayers[i];

                await this.addKmlLayer(kmlLayer);
            }

            // removes import alert
            // todo: the message still shows up if another alert is opened
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
