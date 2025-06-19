import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from "@tanstack/react-router";
import GameComponent from "./components/GameComponent";
import ThemeDemo from "./components/ThemeDemo/ThemeDemo";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: GameComponent,
});

const themeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/theme",
  component: ThemeDemo,
});

const routeTree = rootRoute.addChildren([gameRoute, themeRoute]);

export const router = createRouter({
  routeTree,
  basepath: "/eye-beat-you",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
