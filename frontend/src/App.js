import "./App.css";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import CreateUser from "./pages/CreateUser";
import LoginUser from "./pages/LoginUser";
import ProfilePage from "./pages/ProfilePage";
import LobbyPage from "./pages/LobbyPage";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/createUser" element={<CreateUser />} />
      <Route path="/login" element={<LoginUser />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/lobby" element={<LobbyPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
