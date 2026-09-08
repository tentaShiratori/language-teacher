import type { ComponentType } from "react";
import type { RouteObject } from "react-router";

export const HANTEI_LOG_PATH = "/hantei-log";

export function appRoutes(pages: {
  honban: ComponentType;
  hanteiLog: ComponentType;
}): RouteObject[] {
  return [
    { path: "/", Component: pages.honban },
    { path: HANTEI_LOG_PATH, Component: pages.hanteiLog },
  ];
}
