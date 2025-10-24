import React, { useState } from "react";
import { registerUser } from "../api";

export default function Register({ onNavigate }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = await registerUser(form);
      setMessage(`✅ ${data.message || "Registered successfully!"}`);
      setForm({ name: "", email: "", password: "", role: "student" });

      setTimeout(() => {
        onNavigate("login");
      }, 2000);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join us today</p>
        </div>
        
        {message && (
          <div className={`message ${message.startsWith("✅") ? "success" : "error"}`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          
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
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Role</label>
            <select 
              name="role" 
              value={form.role} 
              onChange={handleChange}
              className="form-input"
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="principal_lecturer">Principal Lecturer</option>
              <option value="program_leader">Program Leader</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "⏳ Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? 
            <button 
              onClick={() => onNavigate("login")} 
              className="auth-link"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}