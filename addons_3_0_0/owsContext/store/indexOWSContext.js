import getters from "./gettersOWSContext.js";
import mutations from "./mutationsOWSContext.js";
import state from "./stateOWSContext.js";

export default {
    namespaced: true,
    state: {...state},
    mutations,
    getters
};
