import {generateSimpleGetters} from "../../../../src_3_0_0/shared/js/utils/generators";
import stateOWSContext from "./stateOWSContext";

const getters = {
    ...generateSimpleGetters(stateOWSContext)
};

export default getters;
