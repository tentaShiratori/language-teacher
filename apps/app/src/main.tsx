import React from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router";
import App from "./App";
import { appRoutes } from "./_lib/appRoutes";
import { HanteiLogMado } from "./_lib/HanteiLogMado";

const router = createHashRouter(
  appRoutes({
    honban: App,
    hanteiLog: HanteiLogMado,
  }),
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
