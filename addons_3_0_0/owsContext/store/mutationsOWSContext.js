import {generateSimpleMutations} from "../../../../src_3_0_0/shared/js/utils/generators";
import stateOWSContext from "./stateOWSContext";

const mutations = {
    ...generateSimpleMutations(stateOWSContext),
    /**
     * If name from config.json starts with "translate#", the corrected key is set to name here.
     * @param {object} state of this component
     * @param {string} payload name of this component
     * @returns {void}
     */
    applyTranslationKey: (state, payload) => {
        if (payload && payload.indexOf("translate#") > -1) {
            state.name = payload.substr("translate#".length);
        }
    }
};

export default mutations;
