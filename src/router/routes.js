// 動態路由: path: "/user/:id"
const routes = [
    {
        path: "/",
        name: "App",
        title: "App",
        component: () => ('@/App.vue'),
    }
];

export default routes;