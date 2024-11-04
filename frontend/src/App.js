import "./App.css";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CreateUser from "./pages/CreateUser";
import LoginUser from "./pages/LoginUser";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/createUser" element={<CreateUser />} />
      <Route path="/login" element={<LoginUser />} />
    </Routes>
  );
}

export default App;
