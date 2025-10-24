import React, { useState, useEffect } from "react";
import { loginUser, registerUser } from "../api";

export default function Auth({ onAuth, initialMode }) {
  const [mode, setMode] = useState("login"); // login | register

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "lecturer",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      let data;
      if (mode === "login") {
        console.log("Login payload:", { email: form.email, password: form.password });
        data = await loginUser({ email: form.email, password: form.password });
        console.log("Login response:", data);
      } else {
        console.log("Register payload:", form);
        data = await registerUser(form);
        console.log("Register response:", data);
      }

      if (data.user && onAuth) {
        onAuth(data.user);
      }

      setMessage(`✅ ${data.message || (mode === "login" ? "Login successful!" : "Registered successfully!")}`);
      if (mode === "register") {
        setForm({ name: "", email: "", password: "", role: "lecturer" });
        setMode("login");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>{mode === "login" ? "Login" : "Register"}</h2>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        {message && (
          <p className={`message ${message.startsWith("✅") ? "success" : "error"}`}>
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <>
              <input
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                required
                className="form-input"
              />
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="form-input"
              >
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="prl">Principal Lecturer</option>
                <option value="pl">Program Leader</option>
                <option value="admin">Admin</option>
              </select>
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="form-input"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="form-input"
          />

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (mode === "login" ? "Logging in..." : "Registering...") : mode === "login" ? "Login" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
