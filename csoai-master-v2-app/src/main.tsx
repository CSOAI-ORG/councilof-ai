// Day 12 BLOCK 1: main.tsx entry point (was missing from the M2 master)
// Bridges index.html → App.tsx via the standard Vite/React bootstrap pattern.
import React from "react";
import ReactDOM from "react-dom/client";
import App from "../App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
