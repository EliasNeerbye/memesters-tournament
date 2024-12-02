import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import { socketService } from "./services/socketService.js";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <socketService>
        <App />
      </socketService>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
