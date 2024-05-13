import axios from 'axios';
import { createStore } from 'vuex';
import CityData from "../assets/json/basicCity.json";

export default createStore({
    state: {
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
        isLoading: false,
    },
    getters: {
        // bus
        getRouteData(state) {
            let route = state.routeStopData.filter(
                (item) => item.SubRouteUID === state.subTabIndex
            );
            if (route.length === 1) {
                return route[0].Stops;
            } else if (route.length >= 2) {
                return route.find((item) => item.Direction === parseInt(state.tabIndex))
                    .Stops;
            }
        },
        getStopName(state) {
            const index = state.busData.findIndex((b) => b.RouteUID === state.routeUID);
            if (index !== -1) {
                let route = state.routeStopData.filter(
                    (item) => item.SubRouteUID === state.subTabIndex
                );
                if (route.length === 1) {
                    if (route[0].Direction === 0) {
                        return [state.busData[index].DestinationStopNameZh];
                    } else {
                        return [state.busData[index].DepartureStopNameZh];
                    }
                } else {
                    return [
                        state.busData[index].DestinationStopNameZh,
                        state.busData[index].DepartureStopNameZh,
                    ];
                }
            }
            return "";
        },
    },
    actions: {
        async updateSelectCity({ commit }, selectCity) {
            commit("update_selectCity", selectCity);
            if (selectCity != "") {
                try {
                    const path = "/Bus/Route/City/" + selectCity + "?format=JSON";
                    await axios.get(path).then((response) => {
                        commit("update_busData", response.data);
                    });
                } catch (error) {
                    console.log(error);
                }
            }

        },
        updateRouteUID({ commit, dispatch }, routeUID) {
            commit("update_tabIndex", 0);
            commit("update_subTabIndex", 0);
            commit("update_routeUID", routeUID);
            dispatch('getbusRoute', routeUID);
        },
        async getbusRoute({ commit, state, dispatch }, nUID) {
            if (state.busData.length !== 0) {
                var index = state.busData.findIndex((d) => d.RouteUID === nUID);
                var RouteName = state.busData[index].RouteName.Zh_tw;
                commit("update_isLoading", true);
                try {
                    const estimatedTimeOfArrival =
                        "/Bus/EstimatedTimeOfArrival/City/" +
                        state.selectCity +
                        "/" +
                        RouteName +
                        "?format=JSON";
                    const stopOfRoute =
                        "/Bus/StopOfRoute/City/" +
                        state.selectCity +
                        "/" +
                        RouteName +
                        "?format=JSON";
                    // StopOfRoute
                    await axios.get(stopOfRoute).then(async (response) => {
                        const stopData = response.data.filter(
                            (data) => data.RouteUID === nUID
                        );
                        // EstimatedTimeOfArrival
                        await axios.get(estimatedTimeOfArrival).then((response) => {
                            const estData = response.data;
                            dispatch('mergedRouteStopData', { stopData, estData });
                            dispatch('startTimer');
                            commit("update_isLoading", false);
                        });
                    });
                } catch (error) {
                    console.log(error);
                }
            }
        },
        mergedRouteStopData({ commit, state }, { stopData, estData }) {
            const routeStopData = stopData.map((o1) => {
                o1.Stops = o1.Stops.map((stop) => {
                    const matchingObj = estData.find((o2) => {
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
            commit("update_routeStopData", routeStopData);

            // subRoute
            const values = routeStopData.map((item) => ({
                SubRouteUID: item.SubRouteUID,
                SubRouteName: item.SubRouteName,
            }));
            const subRoute = Array.from(
                new Set(values.map((item) => JSON.stringify(item)))
            ).map((item) => JSON.parse(item));
            commit("update_subRoute", subRoute);

            if (state.subTabIndex === 0) {
                commit("update_subTabIndex", subRoute[0].SubRouteUID);
            }
        },
        updateTabIndex({ commit }, tabIndex) {
            commit("update_tabIndex", tabIndex);
        },
        updateSubTabIndex({ commit }, subTabIndex) {
            commit("update_subTabIndex", subTabIndex);
        },
        startTimer({ commit }) {
            commit('clear_timerInterval')
            commit('update_timePassed', 0)
            commit('update_timerInterval')
        },
    },
    mutations: {
        update_selectCity(state, selectCity) {
            state.selectCity = selectCity;
        },
        update_busData(state, busData) {
            state.busData = busData;
        },
        update_routeUID(state, routeUID) {
            state.routeUID = routeUID;
        },
        update_tabIndex(state, tabIndex) {
            state.tabIndex = tabIndex;
        },
        update_subTabIndex(state, subTabIndex) {
            state.subTabIndex = subTabIndex;
        },
        update_routeStopData(state, routeStopData) {
            state.routeStopData = routeStopData;
        },
        update_subRoute(state, subRoute) {
            state.subRoute = subRoute;
        },
        update_isLoading(state, isLoading) {
            state.isLoading = isLoading;
        },
        update_timePassed(state, timePassed) {
            state.timePassed = timePassed;
        },
        update_timerInterval(state) {
            state.timerInterval = setInterval(() => (state.timePassed += 1), 1000);
        },
        clear_timerInterval(state) {
            clearInterval(state.timerInterval);
        },

    },

    modules: {}
})