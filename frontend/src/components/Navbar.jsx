import "../css/Navbar.css";

export default function Navbar() {
  return (
    <nav>
      <ul>
        <li>
          <a href="/">Home</a>
        </li>
        <li>
          <a href="/about">About</a>
        </li>
        <li>
          <a href="/login">Login</a>
        </li>
        <li>
          <a href="/createuser">Create User</a>
        </li>
      </ul>
    </nav>
  );
}
