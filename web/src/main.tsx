import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./app/styles.css";
import { initI18n } from "./app/i18n";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element was not found");
}

initI18n();

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
