import "./App.css";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CreateUser from "./pages/CreateUser";
import LoginUser from "./pages/LoginUser";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/createUser" element={<CreateUser />} />
      <Route path="/login" element={<LoginUser />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}

export default App;
