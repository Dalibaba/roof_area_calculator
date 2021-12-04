import Vue from "vue";
import App from "./App.vue";
import VueGeolocation from "vue-browser-geolocation";
import * as VueGoogleMaps from "vue2-google-maps";
import "bootstrap/dist/css/bootstrap.css";

Vue.config.productionTip = false;
Vue.use(VueGeolocation);
Vue.use(VueGoogleMaps, {
  load: {
    key: process.env.VUE_APP_GOOGLE_API_KEY,
  },
  installComponents: true,
});

// name google components

Vue.component("google-map", VueGoogleMaps.Map);
Vue.component("google-polygon", VueGoogleMaps.Polygon);
Vue.component("google-info-window", VueGoogleMaps.InfoWindow);
Vue.component("google-marker", VueGoogleMaps.Marker);
new Vue({
  render: (h) => h(App),
}).$mount("#app");
