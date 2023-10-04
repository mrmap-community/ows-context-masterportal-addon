import OWSContextComponent from "./components/OWSContext.vue";
import OWSContextStore from "./store/indexOWSContext";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: OWSContextComponent,
    store: OWSContextStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
