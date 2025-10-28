import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Signin.css";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signin = useMutation(api.signin.signin) as any;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const res = await signin({ email, password });
      if (res && res.id) {
        localStorage.setItem(
          "qc_user",
          JSON.stringify({
            id: res.id,
            name: res.name,
            email: res.email,
            phone: res.phone,
            balance: res.balance,
            referralEarnings: res.referralEarnings,
            referralCode: res.referralCode,
            role: res.role,
          })
        );

        if (res.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
        return;
      }
      setError("Sign in failed");
    } catch (err: any) {
      setError(err?.message ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-header">
        <div className="logo-box">QC</div>
        <h1>Welcome Back</h1>
        <p className="subtitle">Sign in to your Quick Cash account</p>
      </div>

      <div className="signin-form-card">
        <form className="signin-form" onSubmit={submit} autoComplete="off">
          <input
            type="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Enter your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="signup-link">
          <p>
            Don't have an account? <Link to="/signup">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
