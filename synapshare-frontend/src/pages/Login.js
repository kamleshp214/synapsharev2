import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  signInWithPopup,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const googleProvider = new GoogleAuthProvider();

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          await handlePostLogin(result.user);
        }
      } catch (err) {
        console.error("Google Redirect Error:", err);
        setError(`Google redirect failed: ${err.message}`);
      }
    };
    handleRedirectResult();
  }, []);

  const handlePostLogin = async (user) => {
    try {
      const token = await user.getIdToken(true);
      const response = await axios.get(
        `http://localhost:5000/api/user/${user.uid}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.isAdmin || response.data.username) {
        navigate("/");
      } else {
        setShowUsernameModal(true);
      }
    } catch (err) {
      console.error("Error checking user:", err);
      setError("Failed to verify user. Please try again.");
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await handlePostLogin(result.user);
    } catch (err) {
      console.error("Email Login Error:", err.code, err.message);
      let errorMessage = "Failed to log in with email.";
      if (err.code === "auth/wrong-password") {
        errorMessage =
          "Incorrect password. Please try again or reset your password.";
      } else if (err.code === "auth/user-not-found") {
        errorMessage = "No user found with this email. Please register.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email format.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please try again later.";
      } else {
        errorMessage = `Login failed: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await handlePostLogin(result.user);
    } catch (err) {
      console.error("Email Registration Error:", err.code, err.message);
      let errorMessage = "Failed to register with email.";
      if (err.code === "auth/email-already-in-use") {
        errorMessage =
          "This email is already in use. Try logging in or use a different email.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email format.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Use at least 6 characters.";
      } else {
        errorMessage = `Registration failed: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handlePostLogin(result.user);
    } catch (err) {
      console.error("Google Popup Error:", err);
      let errorMessage = "Failed to log in with Google.";
      if (err.code === "auth/popup-blocked") {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          errorMessage = `Redirect fallback failed: ${redirectErr.message}`;
        }
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (err.code === "auth/cancelled-popup-request") {
        errorMessage = "Popup request cancelled. Please try again.";
      } else {
        errorMessage = `Google login failed: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setError("Password reset email sent! Please check your inbox.");
    } catch (err) {
      console.error("Password Reset Error:", err);
      setError(`Failed to send password reset email: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setUsernameError("");
    try {
      const checkResponse = await axios.post(
        "http://localhost:5000/api/check-username",
        { username }
      );
      if (checkResponse.data.exists) {
        setUsernameError("Username is already taken. Please choose another.");
        return;
      }
      const user = auth.currentUser;
      if (!user) {
        setUsernameError("User not authenticated. Please log in again.");
        return;
      }
      const token = await user.getIdToken(true);
      const saveResponse = await axios.post(
        "http://localhost:5000/api/save-username",
        { username },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (saveResponse.data.success) {
        setShowUsernameModal(false);
        navigate("/");
      } else {
        setUsernameError(saveResponse.data.error || "Failed to save username.");
      }
    } catch (err) {
      console.error(
        "Username submission error:",
        err.response ? err.response.data : err.message
      );
      setUsernameError("Failed to save username. Please try again.");
    }
  };

  return (
    <div className="relative z-10 max-w-md mx-auto mt-16">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-8 text-center">
        Login to SynapShare
      </h1>
      {error && (
        <p className="text-red-500 dark:text-red-400 mb-4 bg-red-100/50 dark:bg-red-900/50 p-3 rounded-lg">
          {error}
        </p>
      )}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <form
          onSubmit={isRegistering ? handleEmailRegister : handleEmailLogin}
          className="mb-6"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 transition-all text-gray-800 dark:text-gray-100"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 transition-all text-gray-800 dark:text-gray-100"
            required
          />
          {!isRegistering && (
            <button
              type="button"
              onClick={handlePasswordReset}
              className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline mb-4 block"
            >
              Forgot Password?
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`bg-${
              isRegistering ? "green" : "indigo"
            }-600 text-white py-2 px-4 rounded-lg hover:bg-${
              isRegistering ? "green" : "indigo"
            }-500 transition w-full mb-2 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading
              ? isRegistering
                ? "Registering..."
                : "Logging in..."
              : isRegistering
              ? "Register with Email"
              : "Login with Email"}
          </button>
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition w-full"
          >
            {isRegistering ? "Switch to Login" : "Need an account? Register"}
          </button>
        </form>
        <div className="flex items-center justify-center mb-4">
          <div className="border-t border-gray-300 dark:border-gray-600 flex-grow"></div>
          <span className="px-4 text-gray-600 dark:text-gray-400">or</span>
          <div className="border-t border-gray-300 dark:border-gray-600 flex-grow"></div>
        </div>
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition w-full ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <FcGoogle className="text-xl" />{" "}
          {loading ? "Logging in..." : "Login with Google"}
        </button>
      </div>

      {showUsernameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Choose a Unique Username
            </h2>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-400 transition-all text-gray-800 dark:text-gray-100"
              required
            />
            {usernameError && (
              <p className="text-red-500 dark:text-red-400 mb-4">
                {usernameError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleUsernameSubmit}
                className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-500 transition"
              >
                Submit
              </button>
              <button
                onClick={() => setShowUsernameModal(false)}
                className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
