<template >
  <NavBar />
  <div class="mapContainer">
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
import CityData from "../assets/json/basicCity.json";

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
  },
  data: () => ({
    timePassed: 0,
    timerInterval: null,
    subTabIndex: 0,
    tabIndex: 0,
    cityData: CityData.BasicCity,
    selectCity: "",
    busData: [],
    routeUID: "",
    routeStopData: [],
    subRoute: [],
  }),
  created() {
    this.getAuthorizationHeader();
  },
  mounted() {
    this.initMap();
  },
  computed: {
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

    // bus route
    getRouteData() {
      let route = this.routeStopData.filter(
        (item) => item.SubRouteUID === this.subTabIndex
      );
      if (route.length === 1) {
        return route[0].Stops;
      } else if (route.length >= 2) {
        return route.find((item) => item.Direction === parseInt(this.tabIndex))
          .Stops;
      }
    },
    getStopName() {
      const index = this.busData.findIndex((b) => b.RouteUID === this.routeUID);
      if (index !== -1) {
        let route = this.routeStopData.filter(
          (item) => item.SubRouteUID === this.subTabIndex
        );
        if (route.length === 1) {
          if (route[0].Direction === 0) {
            return [this.busData[index].DestinationStopNameZh];
          } else {
            return [this.busData[index].DepartureStopNameZh];
          }
        } else {
          return [
            this.busData[index].DestinationStopNameZh,
            this.busData[index].DepartureStopNameZh,
          ];
        }
      }
      return "";
    },
  },
  methods: {
    getAuthorizationHeader() {
      const parameter = {
        grant_type: "client_credentials",
        client_id: import.meta.env.VITE_APP_CLIENTID,
        client_secret: import.meta.env.VITE_APP_CLIENT_SECRET,
      };
      this.axios
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

    // timer
    startTimer() {
      clearInterval(this.timerInterval);
      this.timePassed = 0;
      this.timerInterval = setInterval(() => (this.timePassed += 1), 1000);
    },

    // bus route
    async getbusRoute(nUID) {
      if (this.busData.length !== 0) {
        var index = this.busData.findIndex((d) => d.RouteUID === nUID);
        var RouteName = this.busData[index].RouteName.Zh_tw;

        try {
          const estimatedTimeOfArrival =
            "/Bus/EstimatedTimeOfArrival/City/" +
            this.selectCity +
            "/" +
            RouteName +
            "?format=JSON";
          const stopOfRoute =
            "/Bus/StopOfRoute/City/" +
            this.selectCity +
            "/" +
            RouteName +
            "?format=JSON";
          // StopOfRoute
          this.axios.get(stopOfRoute).then((response) => {
            const stopData = response.data.filter(
              (data) => data.RouteUID === nUID
            );
            // console.log(stopData);
            // EstimatedTimeOfArrival

            this.axios.get(estimatedTimeOfArrival).then((response) => {
              const estData = response.data;
              // console.log(estData);
              this.mergedRouteStopData(stopData, estData);
              this.startTimer();
            });
          });
        } catch (error) {
          console.log(error);
        }
      }
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
    mergedRouteStopData(obj1, obj2) {
      this.routeStopData = obj1.map((o1) => {
        o1.Stops = o1.Stops.map((stop) => {
          const matchingObj = obj2.find((o2) => {
            let condition =
              o2.RouteUID === o1.RouteUID &&
              o2.StopUID == stop.StopUID &&
              (o2.Direction === o1.Direction || o2.Direction === 255);
            if (o1.SubRouteUID && o2.SubRouteUID) {
              condition = condition && o2.SubRouteUID === o1.SubRouteUID;
            }
            return condition;
          });
          if (matchingObj) {
            return { ...stop, ...matchingObj };
          } else {
            return stop;
          }
        });
        return o1;
      });
      console.log(this.routeStopData);

      // subRoute
      const values = this.routeStopData.map((item) => ({
        SubRouteUID: item.SubRouteUID,
        SubRouteName: item.SubRouteName,
      }));
      this.subRoute = Array.from(
        new Set(values.map((item) => JSON.stringify(item)))
      ).map((item) => JSON.parse(item));
      if (this.subTabIndex === 0) {
        this.subTabIndex = this.subRoute[0].SubRouteUID;
      }
    },
    getColor(value) {
      switch (value) {
        case 0:
          return {
            color: "#fb8500",
            border: "0.2vw solid #fb8500",
          };
        case 1:
          return {
            color: "#457b9d",
            border: "0.2vw solid #457b9d",
          };
        case 2:
          return {
            color: "#1d3557",
            border: "0.2vw solid #1d3557",
          };
        default:
          return {
            color: "#a8abb2",
            border: "0.2vw solid #a8abb2",
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
      // map.closePopup();

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
    selectCity: async function (nCity) {
      if (nCity != "") {
        try {
          const path = "/Bus/Route/City/" + nCity + "?format=JSON";
          this.axios.get(path).then((response) => {
            this.busData = response.data;
          });
        } catch (error) {
          console.log(error);
        }
      }
    },
    routeUID: async function (nUID) {
      try {
        this.tabIndex = 0;
        this.subTabIndex = 0;
        await this.getbusRoute(nUID);
      } catch (error) {
        console.error(error);
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
@use "../assets/scss/value";
#app {
  display: flex;
  flex-direction: column;
}
.mapContainer {
  position: relative;
  display: flex;
  flex-direction: row;
  height: calc(100vh - 5.5vw);
  background-color: value.$color-white;
}
#map {
  width: 100%;
  height: 100%;
}
.mapContent {
  display: flex;
  flex-direction: column;
  justify-content: start;
  color: value.$color-navy;
  top: 50%;
  left: 50%;
  margin: 1.5%;
  padding: 1vw;
  min-width: 30vw;
  max-width: 30vw;
  height: calc(97% - 3vw);
  background-color: #fff;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.2);
  border-radius: 1.5vw;
  font-weight: 700;
  font-size: 2.25vw;
}
.selectContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75vw;
  margin: 1vw 0;
}
:deep(.el-select__wrapper) {
  height: 2.5vw;
  border-radius: 2vw;
  box-shadow: 0 0.5px 4px 0 rgba(0, 0, 0, 0.2);
  font-size: 1.25vw;
  line-height: 1.5;
  padding: 1rem;
  .el-select__selection {
    .el-select__placeholder {
      color: value.$color-navy;
    }
    .el-select__placeholder.is-transparent {
      color: #a8abb2;
    }
  }
  .el-select__caret {
    color: value.$color-navy;
  }
}
:deep(.el-select-dropdown__item.hover),
:deep(.el-select-dropdown__item:hover) {
  background: value.$color-white;
}

:deep(.el-select-dropdown__item.is-selected) {
  color: value.$color-blue-d;
  background-color: value.$color-white;
}
.busSubRouteContainer {
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: start;
  align-items: center;
  gap: 0.5vw;
  width: 100%;
  height: 2.5vw;
  margin-bottom: 1vw;
  font-weight: 400;
  font-size: 1.25vw;
  color: value.$color-navy;
  overflow-x: scroll;
  overflow-y: visible;
  div {
    height: 90%;
  }
  .subTab {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-weight: 400;
    padding: 0 0.25vw;
    border: 0.1vw solid value.$color-navy;
    border-radius: 0.5vw;
    width: max-content;
    flex-wrap: nowrap;
    word-break: keep-all;
  }
  input[type="radio"] {
    display: none;
    &:checked {
      & + label {
        color: value.$color-orange;
        font-weight: 600;
        border: 0.1vw solid value.$color-orange;
      }
    }
  }
}
.busRouteContainer {
  display: flex;
  flex-direction: column;
  justify-content: start;
  width: 100%;
  height: 10vw;
  flex-grow: 1;
  box-shadow: 0 0.5px 4px 0 rgba(0, 0, 0, 0.2);
  background-color: value.$color-white;
  border-radius: 1.5vw;
  font-size: 1.5vw;
  position: relative;
  .refresh {
    cursor: pointer;
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    right: 0.5vw;
    bottom: 5vh;
    width: 5vw;
    height: 5vw;
    border-radius: 2.5vw;
    background-color: #fff;
    z-index: 10;
    box-shadow: 0 0.5px 4px 0 rgba(0, 0, 0, 0.2);
    &__icon {
      position: absolute;
      width: 2.5vw;
      height: 2.5vw;
      top: auto;
      bottom: auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    &__svg {
      transform: scaleX(-1);
    }
    &__circle {
      fill: none;
      stroke: none;
    }
    &__path-elapsed {
      stroke-width: 0.75vw;
      stroke: #a8abb2;
    }
    &__path-remaining {
      stroke-width: 0.75vw;
      stroke-linecap: round;
      transform: rotate(90deg);
      transform-origin: center;
      transition: 1s linear all;
      fill-rule: nonzero;
      stroke: currentColor;
      &.green {
        color: value.$color-blue-l;
      }
      &.orange {
        color: value.$color-white;
      }
      &.red {
        color: value.$color-yellow;
      }
    }
  }
  .busRouteContainerTitle {
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    width: 100%;
    margin-bottom: 0.5vw;
    font-weight: 400;
    // background-color: value.$color-blue-l;
    border-radius: 1.5vw 1.5vw 0 0;
    font-weight: 600;
    font-size: 1.25vw;
    color: value.$color-navy;
    .tab {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      cursor: pointer;
      transition: 0.25s ease-in-out;
      font-weight: 400;
      color: #a8abb2;
      opacity: 0.8;
    }
    input[type="radio"] {
      display: none;
      &:checked {
        & + label {
          font-weight: 600;
          color: value.$color-navy;
          opacity: 1;
        }
      }
    }
    input[id="radio-0"] {
      & + label {
        border-start-start-radius: 1.5vw;
      }
      &:not(:checked) {
        & + label {
          background-color: #fff;
          box-shadow: inset -3px 0 4px rgba(0, 0, 0, 0.2);
        }
      }
    }

    input[id="radio-1"] {
      & + label {
        border-start-end-radius: 1.5vw;
      }
      &:not(:checked) {
        & + label {
          background-color: #fff;
          box-shadow: inset 3px 0 4px rgba(0, 0, 0, 0.2);
        }
      }
    }
  }
  .stopInfoContainer {
    height: 100%;
    overflow-y: scroll;
    .busStopInfo {
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      align-items: center;
      height: 3.5vw;
      font-weight: 400;
      padding: 0 1vw;
      cursor: pointer;
      &:hover {
        // opacity: 0.8;
        background-color: #a8dadc80;
      }
      .stopTime {
        // width: max-content;
        // width: 5.5vw;
        min-width: 9.5vw;
        white-space: nowrap;
        border: 0.2vw solid value.$color-navy;
        border-radius: 2vw;
        line-height: 1.5;
      }
      .stopName {
        width: 100%;
        text-align: start;
        margin-left: 1vw;
      }
      .stopStatus {
        position: relative;
        width: 3.5vw;
        height: 3.5vw;
        color: value.$color-white;
        z-index: 1;
        line-height: 1;
        display: flex;
        align-items: center; /* 垂直居中 */
        justify-content: center; /* 水平居中 */
        &:after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: -1;
          width: 1vw;
          height: 1vw;
          border-radius: 50%;
          background-color: value.$color-navy;
        }
        &:before {
          display: block;
          content: "";
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translate(-50%, 0%);
          width: 0.2vw;
          height: 100%;
          background-color: value.$color-navy;
          z-index: -1;
        }
      }
      &:first-child .stopStatus:before {
        height: 50%;
      }

      &:last-child .stopStatus:before {
        height: 50%;
        top: 0;
      }

      &:only-child .stopStatus:before {
        display: none;
      }
    }
  }
}
.arrive0 {
  .stopStatus {
    &:after {
      background-color: value.$color-orange !important;
      animation: neon 1.5s ease-in-out infinite alternate;
    }
    &:before {
      background-color: value.$color-orange !important;
    }
  }
}
.arrive1 {
  .stopStatus {
    &:after {
      background-color: value.$color-blue-d !important;
    }
    &:before {
      background-color: value.$color-blue-d !important;
    }
  }
}
@keyframes neon {
  0%,
  100% {
    box-shadow: 0 0 0.3vw value.$color-yellow, 0 0 1.5vw value.$color-yellow,
      0 0 0.3vw value.$color-yellow;
    scale: 1;
  }
  50% {
    box-shadow: 0 0 0.8vw value.$color-yellow, 0 0 2.5vw value.$color-yellow,
      0 0 0.8vw value.$color-yellow;
    background-color: value.$color-yellow !important;
    scale: 1.1;
  }
}
</style>



