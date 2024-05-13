<template>
  <div id="map"></div>
</template>

<script>
let map = {};
export default {
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      // 地圖
      map = L.map("map", {
        center: [25.042474, 121.513729],
        zoom: 18,
        zoomControl: false,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 20,
        attribution: "© OpenStreetMap",
      }).addTo(map);
      L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(map);
    },
  },
};
</script>


<style lang='scss' scoped>
@use "../assets/scss/value";
#map {
  width: 100%;
  height: 100%;
  @media (max-width: $breakpoint) {
    position: absolute !important;
    top: calc(1.5% + 3.75vw + 92px);
    left: 50%;
    transform: translate(-50%, 0);
    height: 30vh;
    width: calc(97% - 2vw);
  }
}
</style>