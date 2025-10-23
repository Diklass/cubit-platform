// src/index.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth/AuthContext";
import App from "./App";
import { ThemeProviderCustom } from "./theme/ThemeContext";
import "./styles/globals.css";
import "react-colorful/dist/index.css";



const queryClient = new QueryClient();

function Root() {
  return (
    <ThemeProviderCustom >
      <BrowserRouter>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProviderCustom>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
