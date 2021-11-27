<template>
  <div>
    <div class="container">
      <div class="row">
        <div class="col-sm-10">
          <h1>Roof Area Calculator</h1>
          <hr />
        </div>
      </div>
      <div class="form-group">
        <input
          type="text"
          v-model="formData.city"
          class="form-control"
          id="cityInput"
          placeholder="City"
        />
      </div>
      <div class="form-group">
        <input
          type="text"
          v-model="formData.zip"
          class="form-control"
          id="zipInput"
          placeholder="zip"
          pattern="[0-9]*"
        />
      </div>
      <div class="form-group">
        <input
          type="text"
          v-model="formData.street"
          class="form-control"
          id="streetInput"
          placeholder="street"
        />
      </div>
      <div class="form-group">
        <input
          type="number"
          v-model="formData.houseNumber"
          class="form-control"
          id="houseNumberInput"
          placeholder="House Number"
        />
      </div>
      <div class="container">
        <div class="row justify-content-center">
          <button
            type="button"
            class="btn btn-success btn-sm"
            @click="onClickFind"
          >
            Find on Map
          </button>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="row justify-content-center">
        <h1>Your coordinates:</h1>
        <p>
          {{ myCoordinates.lat }} Latitude, {{ myCoordinates.lng }} Longitude
        </p>
      </div>
    </div>
    <div class="container">
      <button
        type="button"
        class="btn btn-success btn-sm"
        @click="onClickClearMarkers"
      >
        Clear Markers
      </button>
    </div>
    <div class="container"></div>
    <google-map
      @click="onClickMap"
      :center="myCoordinates"
      :zoom="zoom"
      style="width: 70%; height: 500px; margin: 32px auto"
      ref="mapRef"
      @dragend="handleDrag"
    >
      <!-- <div v-if="savedMarkers.length > 0"></div> -->
      <google-polyline
        v-bind:path.sync="paths"
        v-bind:options="{ strokeColor: '#008000' }"
        ref="polyline"
        :editable="false"
      ></google-polyline>
      <google-marker
        :key="index"
        v-for="(m, index) in savedMarkers"
        :position="m.position"
        :clickable="true"
        :draggable="false"
        @click="center = m.position"
      />
      ></google-map
    >
  </div>
</template>

<script>
import axios from "axios";

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
      savedMarkers: [],
      address: "",
      paths: [],
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
      this.myCoordinates.lat = geocodedLocation.geometry.location.lat;
      this.myCoordinates.lng = geocodedLocation.geometry.location.lng;
      this.zoom = 20;
    },

    onClickMap(e) {
      var marker = {
        position: e.latLng.toJSON(),
      };
      this.savedMarkers.push(marker);
      let pathObject = {
        lat: e.latLng.toJSON().lat,
        lng: e.latLng.toJSON().lng,
      };

      if (this.paths.length == 0) {
        this.paths.push(pathObject);
        this.paths.push(pathObject);
      } else {
        this.paths.splice(this.paths.length - 1, 0, pathObject);
      }
    },
    onClickClearMarkers() {
      this.savedMarkers = [];
      this.paths = [];
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
