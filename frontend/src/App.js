import logo from "./logo.svg";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import CreateUser from "./pages/CreateUser";
import LandingPage from "./pages/LandingPage"
import About from "./pages/About";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage></LandingPage>}></Route>
      <Route path="/about" element={<About></About>}></Route>
      <Route path="/login" element={<Login></Login>}></Route>
      <Route path="/createuser" element={<CreateUser></CreateUser>}></Route>

    </Routes>
  );
}

export default App;
