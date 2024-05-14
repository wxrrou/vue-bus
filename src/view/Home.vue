<template >
  <NavBar />
  <div class="mapContainer">
    <Loader />
    <div class="mapContent">
      <span>搜尋公車路線</span>
      <div class="selectContainer">
        <el-select
          class="select_box"
          v-model="selectCity"
          filterable
          placeholder="請選擇縣市"
          :teleported="false"
        >
          <el-option
            :value="c.City"
            v-for="c in cityData"
            :key="c.City"
            :label="c.CityName"
          />
        </el-select>
        <el-select
          v-model="routeUID"
          filterable
          placeholder="請選擇公車路線"
          no-data-text="請先選擇縣市"
          no-match-text="沒有資料符合"
          :teleported="false"
        >
          <el-option
            :value="b.RouteUID"
            v-for="b in busData"
            :key="b.RouteID"
            :label="
              '[' +
              b.RouteName.Zh_tw +
              ']' +
              b.DepartureStopNameZh +
              ' - ' +
              b.DestinationStopNameZh
            "
          />
        </el-select>
      </div>
      <div class="busSubRouteContainer" v-if="subRoute.length > 1">
        <div v-for="s in subRoute" :key="s.SubRouteUID">
          <input
            type="radio"
            :id="s.SubRouteUID"
            :value="s.SubRouteUID"
            v-model="subTabIndex"
          />
          <label class="subTab" :for="s.SubRouteUID">{{
            s.SubRouteName.Zh_tw
          }}</label>
        </div>
      </div>
      <div class="busRouteContainer" v-if="routeStopData.length !== 0">
        <div class="busRouteContainerTitle">
          <input
            type="radio"
            id="radio-0"
            name="tabs"
            value="0"
            v-model="tabIndex"
          />
          <label class="tab" for="radio-0">往 {{ getStopName[0] }}</label>
          <input
            type="radio"
            id="radio-1"
            value="1"
            v-model="tabIndex"
            name="tabs"
          />
          <label class="tab" for="radio-1" v-if="getStopName.length === 2"
            >往 {{ getStopName[1] }}</label
          >
        </div>
        <div class="stopInfoContainer" ref="stopInfoContainer">
          <div
            class="busStopInfo"
            :class="{
              arrive0: getStatus(s)[1] === 0,
              arrive1: getStatus(s)[1] === 1,
            }"
            :style="{ fontWeight: getStatus(s)[1] === 0 ? 700 : 400 }"
            v-for="s in getRouteData"
            :key="s.StopID"
            @click="clickStop(s)"
          >
            <div class="stopTime" :style="getColor(getStatus(s)[1])">
              {{ getStatus(s)[0] }}
            </div>
            <div class="stopName">{{ s.StopName.Zh_tw }}</div>
            <div class="stopStatus">{{ s.index }}</div>
          </div>
        </div>
        <div class="refresh" @click="refresh">
          <svg
            class="refresh__svg"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g class="refresh__circle">
              <circle
                class="refresh__path-elapsed"
                cx="50"
                cy="50"
                r="45"
              ></circle>
              <path
                :stroke-dasharray="circleDasharray"
                class="refresh__path-remaining"
                :class="remainingPathColor"
                d="
            M 50, 50
            m -45, 0
            a 45,45 0 1,0 90,0
            a 45,45 0 1,0 -90,0
          "
              ></path>
            </g>
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            class="refresh__icon"
          >
            <!-- !Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. -->
            <path
              fill="#1d3557"
              d="M463.5 224H472c13.3 0 24-10.7 24-24V72c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H463.5z"
            />
          </svg>
        </div>
      </div>
    </div>
    <div id="map"></div>
  </div>
</template>

<script >
import NavBar from "../components/NavBar.vue";
import Loader from "../components/Loader.vue";
import { mapState, mapActions, mapGetters } from "vuex";
let map = {};

const FULL_DASH_ARRAY = 283;
const WARNING_THRESHOLD = 10;
const ALERT_THRESHOLD = 5;

const COLOR_CODES = {
  info: {
    color: "green",
  },
  warning: {
    color: "orange",
    threshold: WARNING_THRESHOLD,
  },
  alert: {
    color: "red",
    threshold: ALERT_THRESHOLD,
  },
};
const TIME_LIMIT = 30;

export default {
  components: {
    NavBar: NavBar,
    Loader: Loader,
  },
  created() {
    this.getAuthorizationHeader();
  },
  mounted() {
    this.initMap();
  },
  computed: {
    ...mapState([
      "timePassed",
      "timerInterval",
      "cityData",
      "busData",
      "routeStopData",
      "subRoute",
    ]),
    ...mapGetters(["getRouteData", "getStopName"]),
    selectCity: {
      get() {
        return this.$store.state.selectCity;
      },
      set(value) {
        this.updateSelectCity(value);
      },
    },
    routeUID: {
      get() {
        return this.$store.state.routeUID;
      },
      set(value) {
        this.updateRouteUID(value);
      },
    },
    subTabIndex: {
      get() {
        return this.$store.state.subTabIndex;
      },
      set(value) {
        this.updateSubTabIndex(value);
      },
    },
    tabIndex: {
      get() {
        return this.$store.state.tabIndex;
      },
      set(value) {
        this.updateTabIndex(value);
      },
    },

    // timer
    circleDasharray() {
      return `${(this.timeFraction * FULL_DASH_ARRAY).toFixed(0)} 283`;
    },
    timeLeft() {
      return TIME_LIMIT - this.timePassed;
    },
    timeFraction() {
      const rawTimeFraction = this.timeLeft / TIME_LIMIT;
      return rawTimeFraction - (1 / TIME_LIMIT) * (1 - rawTimeFraction);
    },
    remainingPathColor() {
      const { alert, warning, info } = COLOR_CODES;
      if (this.timeLeft <= alert.threshold) {
        return alert.color;
      } else if (this.timeLeft <= warning.threshold) {
        return warning.color;
      } else {
        return info.color;
      }
    },
  },
  methods: {
    ...mapActions([
      // 'increment', // 将 `this.increment()` 映射为 `this.$store.dispatch('increment')`
      // `mapActions` 也支持载荷：
      // 'incrementBy' // 将 `this.incrementBy(amount)` 映射为 `this.$store.dispatch('incrementBy', amount)`
      "updateSelectCity",
      "updateRouteUID",
      "updateSubTabIndex",
      "updateTabIndex",
      "getbusRoute",
    ]),
    async getAuthorizationHeader() {
      const parameter = {
        grant_type: "client_credentials",
        client_id: import.meta.env.VITE_APP_CLIENTID,
        client_secret: import.meta.env.VITE_APP_CLIENT_SECRET,
      };
      await this.axios
        .post(import.meta.env.VITE_APP_AUTHURL, parameter, {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
          },
        })
        .then((response) => {
          this.axios.defaults.headers.common["Authorization"] =
            "Bearer " + response.data.access_token;
        })
        .catch((error) => {
          console.log(error);
        });
    },

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

    refresh() {
      const scrollPosition = this.$refs.stopInfoContainer.scrollTop;
      this.getbusRoute(this.routeUID)
        .then(() => {
          setTimeout(() => {
            this.$nextTick(() => {
              if (this.$refs.stopInfoContainer) {
                this.$refs.stopInfoContainer.scrollTo(0, scrollPosition);
              }
            });
          }, 500);
        })
        .catch((error) => {
          console.error(error);
        });
    },
    getColor(value) {
      switch (value) {
        case 0:
          return {
            color: "#fb8500",
            border: "1.5px solid #fb8500",
          };
        case 1:
          return {
            color: "#457b9d",
            border: "1.5px solid #457b9d",
          };
        case 2:
          return {
            color: "#1d3557",
            border: "1.5px solid #1d3557",
          };
        default:
          return {
            color: "#a8abb2",
            border: "1.5px solid #a8abb2",
          };
      }
    },
    getTime(time) {
      if (time <= 60) {
        return ["進站中", 0];
      } else if (time < 180) {
        return ["將到站", 1];
      } else if (time >= 3600) {
        const h = Math.floor(time / 3600);
        const m = Math.floor((time % 3600) / 60);
        const fH = String(h).padStart(2, "0");
        const fM = String(m).padStart(2, "0");
        return [fH + ":" + fM, 2];
      } else if (time >= 180) {
        return [Math.floor(time / 60) + "分", 2];
      }
    },
    getStatus(data) {
      if (data.Estimates) {
        return this.getTime(data.Estimates[0].EstimateTime);
      } else {
        if (data.EstimateTime || data.EstimateTime === 0) {
          return this.getTime(data.EstimateTime);
        } else {
          if (data.NextBusTime) {
            const date = new Date(data.NextBusTime);
            const h = String(date.getHours()).padStart(2, "0");
            const m = String(date.getMinutes()).padStart(2, "0");
            return [h + ":" + m, 2];
          } else {
            switch (data.StopStatus) {
              case 1:
                return ["尚未發車", 3];
              case 2:
                return ["交管不停靠", 3];
              case 3:
                return ["末班車已過", 3];
              case 4:
                return ["今日未營運", 3];
              default:
                return ["尚未發車", 3];
            }
          }
        }
      }
    },
    // map
    updateMap(data) {
      // clear markers
      map.eachLayer((layer) => {
        if (
          layer instanceof L.Marker ||
          layer instanceof L.Polyline ||
          layer instanceof L.Popup
        ) {
          map.removeLayer(layer);
        }
      });

      // add markers
      const latlngs = [];
      data.forEach((stop) => {
        const latlng = [
          stop.StopPosition.PositionLat,
          stop.StopPosition.PositionLon,
        ];
        latlngs.push(latlng);

        L.marker(latlng).addTo(map).bindPopup(`
          <p><strong style="font-size: 20px;">${stop.StopName.Zh_tw}</strong></p>
          <p><strong style="font-size: 20px;">${stop.StopName.En}</strong></p>
          `);
      });

      var polyline = L.polyline(latlngs, { color: "#ffb703", weight: 5 }).addTo(
        map
      );

      // zoom the map to the polyline
      map.fitBounds(polyline.getBounds());
    },
    clickStop(stop) {
      const latlng = [
        stop.StopPosition.PositionLat,
        stop.StopPosition.PositionLon,
      ];
      map.flyTo(latlng, 17);
      const popup = L.popup();
      popup
        .setLatLng(latlng)
        .setContent(
          `
          <p><strong style="font-size: 20px;">${stop.StopName.Zh_tw}</strong></p>
          <p><strong style="font-size: 20px;">${stop.StopName.En}</strong></p>
          `
        )
        .openOn(map);
    },
  },
  watch: {
    timeLeft(newValue) {
      if (newValue === 0) {
        this.refresh();
      }
    },
    getRouteData(newValue, oldValue) {
      if (
        newValue &&
        (!oldValue ||
          newValue.map((item) => item.StopUID).join(",") !==
            oldValue.map((item) => item.StopUID).join(","))
      ) {
        this.updateMap(newValue);
      }
    },
  },
};
</script>

<style lang='scss' scoped>
@use "../assets/scss/home";
</style>




