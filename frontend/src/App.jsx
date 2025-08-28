import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./templates/MainLayout.jsx";
import Dashboard from "./views/Dashboard.jsx";
import NotFound from "./views/NotFound.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}