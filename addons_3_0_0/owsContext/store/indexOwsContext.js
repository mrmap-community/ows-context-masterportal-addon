import getters from "./gettersOwsContext.js";
import mutations from "./mutationsOwsContext.js";
import state from "./stateOwsContext.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
