import React, { useState } from "react";
import { loginUser } from "../api";

export default function Login({ onLogin, onNavigate }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = await loginUser(form);
      if (!data.user || !data.token) {
        setMessage("❌ Invalid login credentials.");
        return;
      }

      setMessage(`✅ Welcome, ${data.user.name}!`);
      setForm({ email: "", password: "" });
      if (onLogin) onLogin(data.user);
    } catch (err) {
      setMessage(`❌ ${err.message || "Login failed"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
        </div>
        
        {message && (
          <div className={`message ${message.startsWith("✅") ? "success" : "error"}`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "🔐 Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? 
            <button 
              onClick={() => onNavigate("register")} 
              className="auth-link"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}