<script>
import {mapGetters} from "vuex";
import getters from "../store/gettersOwsContext";

/**
 * @module modules/OwsContext */
export default {
    name: "OwsContext",
    components: {
    },
    data () {
        return {
            exampleProp: undefined
        };
    },
    computed: {
        ...mapGetters("Modules/OwsContext", Object.keys(getters))
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
