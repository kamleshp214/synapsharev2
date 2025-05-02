import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { auth } from "./firebase";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Notes from "./pages/Notes";
import Discussions from "./pages/Discussions";
import Nodes from "./pages/Nodes";
import News from "./pages/News";
import Login from "./pages/Login";
import Search from "./pages/Search";
import Admin from "./pages/Admin";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import axios from "axios";
import {
  FiHome,
  FiFileText,
  FiMessageSquare,
  FiGrid,
  FiBookOpen,
  FiSearch,
  FiShield,
  FiLogOut,
  FiLogIn,
  FiMoon,
  FiSun,
  FiMenu,
  FiX,
  FiUser,
} from "react-icons/fi";

function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await axios.get(
            `http://localhost:5000/api/user/${user.uid}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setUsername(response.data.username || "");
        } catch (error) {
          console.error("Error fetching username:", error);
          setUsername("");
        }
      } else {
        setUsername("");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  const particlesOptions = {
    background: {
      color: { value: darkMode ? "#000000" : "#ffffff" },
    },
    particles: {
      number: { value: 30, density: { enable: true, value_area: 1000 } },
      color: { value: darkMode ? "#ffffff" : "#000000" },
      shape: { type: "circle" },
      opacity: { value: 0.2 },
      size: { value: 2 },
      links: {
        enable: true,
        distance: 150,
        color: darkMode ? "#ffffff" : "#000000",
        opacity: 0.1,
        width: 1,
      },
      move: { enable: true, speed: 1 },
    },
    interactivity: {
      events: { onHover: { enable: true, mode: "grab" } },
      modes: { grab: { distance: 200, links: { opacity: 0.3 } } },
    },
  };

  const isAdmin = user && user.email === "porwalkamlesh5@gmail.com";

  return (
    <Router>
      <div className="flex flex-col min-h-screen font-sans bg-white dark:bg-black text-black dark:text-white">
        <Particles
          id="tsparticles"
          init={particlesInit}
          options={particlesOptions}
          className="absolute inset-0 z-0 pointer-events-none"
        />
        {/* Navbar */}
        <header className="fixed top-0 left-0 right-0 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link
              to="/"
              className="text-xl font-bold text-black dark:text-white"
            >
              SynapShare
            </Link>
            <div
              className={`lg:flex items-center gap-4 ${
                isNavOpen ? "flex" : "hidden"
              } lg:static fixed top-14 left-0 right-0 bg-gray-100 dark:bg-gray-900 p-4 flex-col lg:flex-row lg:p-0 border-b lg:border-none border-gray-200emmel dark:border-gray-700`}
            >
              {[
                { to: "/", icon: FiHome, label: "Home" },
                { to: "/notes", icon: FiFileText, label: "Notes" },
                {
                  to: "/discussions",
                  icon: FiMessageSquare,
                  label: "Discussions",
                },
                { to: "/nodes", icon: FiGrid, label: "Nodes" },
                { to: "/news", icon: FiBookOpen, label: "News" },
                { to: "/search", icon: FiSearch, label: "Search" },
                ...(isAdmin
                  ? [{ to: "/admin", icon: FiShield, label: "Admin" }]
                  : []),
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white rounded-md transition-colors"
                  onClick={() => setIsNavOpen(false)}
                >
                  <item.icon size={16} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/"
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
                  >
                    <FiUser size={16} />
                    <span className="text-sm hidden sm:block">
                      {username || user.email.split("@")[0]}
                    </span>
                  </Link>
                  <button
                    onClick={() => auth.signOut()}
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white rounded-md"
                  >
                    <FiLogOut size={16} />
                    <span className="text-sm hidden sm:block">Logout</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white rounded-md"
                >
                  <FiLogIn size={16} />
                  <span className="text-sm hidden sm:block">Login</span>
                </Link>
              )}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white rounded-md"
              >
                {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
                <span className="text-sm hidden sm:block">
                  {darkMode ? "Light" : "Dark"}
                </span>
              </button>
              <button
                onClick={() => setIsNavOpen(!isNavOpen)}
                className="lg:hidden text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
              >
                {isNavOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 pt-16 pb-16 relative z-10">
          <div className="min-h-[calc(100vh-128px)]">
            <Routes>
              <Route
                path="/"
                element={<Home user={user} username={username} />}
              />
              <Route
                path="/notes"
                element={<Notes user={user} username={username} />}
              />
              <Route
                path="/discussions"
                element={<Discussions user={user} username={username} />}
              />
              <Route
                path="/nodes"
                element={<Nodes user={user} username={username} />}
              />
              <Route path="/news" element={<News />} />
              <Route
                path="/search"
                element={<Search user={user} username={username} />}
              />
              <Route path="/login" element={<Login />} />
              <Route
                path="/admin"
                element={<Admin user={user} username={username} />}
              />
            </Routes>
          </div>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
