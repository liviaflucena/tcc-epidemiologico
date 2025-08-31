import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "./hooks/useTheme.jsx";
import MainLayout from "./templates/MainLayout.jsx";
import Dashboard from "./views/Dashboard.jsx";
import "./styles/index.css";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <MainLayout>
        <Dashboard />
      </MainLayout>
    </ThemeProvider>
  </React.StrictMode>
);