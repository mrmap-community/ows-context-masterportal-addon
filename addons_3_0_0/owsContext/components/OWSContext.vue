<script>
import {mapGetters} from "vuex";
import getters from "../store/gettersOWSContext";

/**
 * @module modules/OWSContext */
export default {
    name: "OWSContext",
    components: {
    },
    data () {
        return {
            exampleProp: undefined
        };
    },
    computed: {
        ...mapGetters("Modules/OWSContext", Object.keys(getters))
    },
    mounted () {
        console.log("Addon mouted");
    },
    methods: {
    }
};
</script>

<template lang="html">
    <div
        v-if="true"
        id="owsContext"
    >
        <p>test addon</p>
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
