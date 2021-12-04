<template>
  <div>
    <div class="container">
      <div class="row">
        <div class="col">
          <h1>Roof Area Calculator</h1>
          <hr />
        </div>
      </div>
    </div>
    <div class="container mb-2">
      <form role="form">
        <div class="row justify-content-center">
          <div class="form-group col-lg-3 mb-2">
            <input
              type="text"
              v-model="formData.city"
              class="form-control"
              id="cityInput"
              placeholder="city"
            />
          </div>
        </div>
        <div class="row justify-content-center">
          <div class="form-group col-lg-3 mb-2">
            <input
              type="text"
              v-model="formData.zip"
              class="form-control"
              id="zipInput"
              placeholder="zip"
              pattern="[0-9]*"
            />
          </div>
        </div>
        <div class="row justify-content-center">
          <div class="form-group col-lg-3 mb-2">
            <input
              type="text"
              v-model="formData.street"
              class="form-control"
              id="streetInput"
              placeholder="street"
            />
          </div>
        </div>
        <div class="row justify-content-center">
          <div class="form-group col-lg-3 mb-2">
            <input
              type="number"
              v-model="formData.houseNumber"
              class="form-control"
              id="houseNumberInput"
              min="0"
              placeholder="house number"
            />
          </div>
        </div>
      </form>
    </div>
    <div class="container mb-2">
      <div class="row">
        <div class="col">
          <button type="button" class="btn btn-success" @click="onClickFind">
            Find on Map
          </button>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="card">
        <div class="row justify-content-center mt-2">
          <h4>Your coordinates:</h4>
          <p>
            {{ myCoordinates.lat.toFixed(4) }} Latitude,
            {{ myCoordinates.lng.toFixed(4) }} Longitude
          </p>
        </div>
        <div class="justify-content-center">
          <h5>Mark your roof on the map!</h5>
        </div>
        <google-map
          @click="onClickMap"
          :center="myCoordinates"
          :zoom="zoom"
          style="width: 70%; height: 500px; margin: 6px auto"
          ref="mapRef"
          @dragend="handleDrag"
        >
          <google-polygon
            v-bind:path.sync="outerCoords"
            v-bind:options="{ strokeColor: '#008000' }"
            ref="polygon"
            :editable="false"
          ></google-polygon>
          <google-marker
            :position="myCoordinates"
            :clickable="false"
            :draggable="false"
            @click="center = m.position"
          />
          <gmap-info-window
            :options="infoOptions"
            :position="infoWindowPos"
            :opened="infoWinOpen"
            @closeclick="infoWinOpen = false"
          >
            <div v-html="infoContent"></div>
          </gmap-info-window>
          ></google-map
        >

        <div class="row mb-2">
          <div class="col">
            <button
              type="button"
              class="btn btn-warning"
              @click="onClickClearMarkers"
            >
              Clear Markers
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import {
  distanceCalculator,
  surfaceCalculator,
} from "../utilities/GeoCalculator.js";

export default {
  data() {
    return {
      formData: {
        city: "",
        street: "",
        houseNumber: "",
        zip: "",
      },
      map: null,
      myCoordinates: {
        lat: 0,
        lng: 0,
      },
      zoom: 12,
      address: "",
      infoContent: "test",
      infoWindowPos: {
        lat: 0,
        lng: 0,
      },
      infoWinOpen: false,
      infoOptions: {
        pixelOffset: {
          width: 0,
          height: -35,
        },
      },
      outerCoords: [],
      roofMetrics: {
        distances: [],
        surface: 0, //m2
        performance: 0,
        yield: 0,
      },
    };
  },
  created() {
    // if user does have saved center, zoom in localstorga, use it
    if (localStorage.center) {
      this.myCoordinates = JSON.parse(localStorage.center);
    } else {
      // get users code from browser request
      this.$getLocation({})
        .then((coordinates) => {
          this.myCoordinates = coordinates;
        })
        .catch((error) => alert(error));
    }

    if (localStorage.zoom) {
      this.zoom = JSON.parse(localStorage.zoom);
    }
  },
  mounted() {
    this.$refs.mapRef.$mapPromise.then((map) => (this.map = map));
  },
  methods: {
    // get center and zoom level, store in local storage
    handleDrag() {
      let center = {
        lat: this.map.getCenter().lat(),
        lng: this.map.getCenter().lng(),
      };
      let zoom = this.map.getZoom();

      localStorage.center = JSON.stringify(center);
      localStorage.zoom = zoom;
    },
    async onClickFind() {
      if (
        !this.formData.street ||
        !this.formData.city ||
        !this.formData.houseNumber ||
        !this.formData.zip
      ) {
        alert("You must add a full address!");
        return;
      }
      //Make request
      let address = `${this.formData.street}, ${this.formData.houseNumber}, ${this.formData.city} ${this.formData.zip}`;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.VUE_APP_GOOGLE_API_KEY}`;
      const { data } = await axios.get(url);

      if (data === "No Results") {
        alert("No results for address");
        return;
      }

      const geocodedLocation = data.results[0];
      this.myCoordinates.lat = parseFloat(
        geocodedLocation.geometry.location.lat.toFixed(4)
      );
      this.myCoordinates.lng = parseFloat(
        geocodedLocation.geometry.location.lng.toFixed(4)
      );
      this.zoom = 20;
    },

    onClickMap(e) {
      // rectangle sized roof
      if (this.outerCoords.length < 4) {
        let coordinateObject = {
          lat: e.latLng.toJSON().lat,
          lng: e.latLng.toJSON().lng,
        };
        this.outerCoords.push(coordinateObject);
      }
      if (this.outerCoords.length == 4) {
        this.calculateRoofArea();
        this.formatInfoWindow();
      }
    },
    calculateRoofArea() {
      for (var i = 0; i < this.outerCoords.length - 1; i++) {
        let lat1 = this.outerCoords[i].lat;
        let lng1 = this.outerCoords[i].lng;
        let lat2 = this.outerCoords[i + 1].lat;
        let lng2 = this.outerCoords[i + 1].lng;
        var distance = distanceCalculator(lat1, lng1, lat2, lng2);
        this.roofMetrics.distances.push(distance);

        if (i == this.outerCoords.length - 2) {
          let lat1 = this.outerCoords[0].lat;
          let lng1 = this.outerCoords[0].lng;
          let lat2 = this.outerCoords[3].lat;
          let lng2 = this.outerCoords[3].lng;
          distance = distanceCalculator(lat1, lng1, lat2, lng2);
          this.roofMetrics.distances.push(distance);
        }
      }
      this.roofMetrics.surface = surfaceCalculator(this.roofMetrics.distances);
      this.roofMetrics.performance = (this.roofMetrics.surface / 10).toFixed(4);
      this.roofMetrics.yield = (this.roofMetrics.performance * 1000).toFixed(4);
    },
    onClickClearMarkers() {
      this.outerCoords = [];
      this.roofMetrics.distances = [];
      this.roofMetrics.surface = 0;
      this.roofMetrics.performance = 0;
      this.roofMetrics.yield = 0;
      this.infoWinOpen = false;
      this.infoContent = "";
    },
    formatInfoWindow() {
      this.infoWindowPos.lat = this.outerCoords[0].lat;
      this.infoWindowPos.lng = this.outerCoords[0].lng;
      this.infoWinOpen = true;

      this.infoContent = `      
      <h6>Roof Metrics</h6>
      <div>
        <p>Surface: ${this.roofMetrics.surface} [m<sup>2</sup>]</p>
        <p>System Performance: ${this.roofMetrics.performance} [kwP]</p>
        <p>Elictricity Yield: ${this.roofMetrics.yield} [kWh/a]</p>
      </div>`;
    },
  },

  computed: {
    mapCoordinates() {
      if (!this.map) {
        return {
          lat: 0,
          lng: 0,
        };
      }
      return {
        lat: this.map.getCenter().lat().toFixed(4),
        lng: this.map.getCenter().lng().toFixed(4),
      };
    },
  },
};
</script>

<style scoped>
/* End global styles */
.card {
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  transition: 0.3s;
  margin-bottom: 20px;
  border-radius: 10px;
}
/* On mouse-over, add a deeper shadow */
.card:hover {
  box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.2);
}
</style>
