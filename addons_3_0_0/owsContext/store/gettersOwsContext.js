import {generateSimpleGetters} from "../../../../src_3_0_0/shared/js/utils/generators";
import stateOwsContext from "./stateOwsContext";

const getters = {
    ...generateSimpleGetters(stateOwsContext)
};

export default getters;
