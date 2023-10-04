import OwsContextComponent from "./components/OwsContext.vue";
import OwsContextStore from "./store/indexOwsContext";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: OwsContextComponent,
    store: OwsContextStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
