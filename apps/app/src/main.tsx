import React from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router";
import App from "./app/App";
import { HanteiLogMado } from "./app/hantei-log/HanteiLogMado";
import { appRoutes } from "./lib/appRoutes";
import { applyDebugDataset, isDebug } from "./lib/debug";
import { installGlobalErrorLog, logCaughtError } from "./lib/error_log";
import "./lib/app.css";

installGlobalErrorLog();
void isDebug()
  .then((debug) => {
    applyDebugDataset(document.documentElement, debug);
  })
  .catch(logCaughtError);

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
