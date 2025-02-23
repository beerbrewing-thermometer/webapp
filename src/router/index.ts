import { waitForUserAuthInit } from "@/helpers/auth-init-waiter";
import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/live",
  },
  {
    path: "/login",
    name: "Login | Beerbrewing Thermometer",
    component: () => import("@/views/login/LoginForm.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/live",
    name: "Live | Beerbrewing Thermometer",
    component: () => import("@/views/live/LiveView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/history",
    name: "History | Beerbrewing Thermometer",
    component: () => import("@/views/history/HistoryView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/:catchAll(.*)",
    name: "Not Found | Beerbrewing Thermometer",
    component: () => import("@/views/not-found/NotFound.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  if (to.name) {
    document.title = to.name.toString();
  }

  const user = await waitForUserAuthInit();
  if (to.meta.requiresAuth && !user && to.path !== "/login") {
    next("/login");
    return;
  }

  if (to.path === "/login" && user) {
    next("/");
    return;
  }

  next();
});
export default router;
