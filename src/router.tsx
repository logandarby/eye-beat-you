import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router'
import GameComponent from './components/GameComponent'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: GameComponent,
})

const routeTree = rootRoute.addChildren([gameRoute])

export const router = createRouter({
  routeTree,
  basepath: '/eye-beat-you',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
} 