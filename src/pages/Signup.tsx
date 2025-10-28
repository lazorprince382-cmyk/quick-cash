import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import "./Signup.css";

const Signup: React.FC = () => {
  const signup = useMutation(api.signup.signup);
  const simpleSignup = useMutation(api.auth.simpleSignup);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !phone || !password) {
      setError("All fields except referral are required.");
      return;
    }

    try {
      setLoading(true);

      // Try main signup first
      let res;
      try {
        res = await signup({
          name,
          email,
          password,
          phone,
          referralCode: referral || undefined,
        });
      } catch (mainError) {
        // If main signup fails, try backup
        console.log("Main signup failed, trying backup...", mainError);
        res = await simpleSignup({
          name,
          email,
          password,
          phone,
        });
      }

      if (res && res.success) {
        localStorage.setItem("qc_user", JSON.stringify({ 
          id: res.userId,
          name: res.name,
          email: res.email,
          phone: res.phone,
          balance: res.balance,
          referralEarnings: 0,
          referralCode: res.referralCode,
          role: res.role
        }));
        navigate("/dashboard");
        return;
      }

      setError("Account creation failed. Please try again.");
    } catch (err: any) {
      if (err.message === "Email already registered") {
        setError("Email already registered. Redirecting to sign-in...");
        setTimeout(() => navigate("/signin"), 2000);
      } else {
        setError(err.message || "Sign up failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-header">
        <div className="logo-box">QC</div>
        <h1>Quick Cash</h1>
        <p className="subtitle">Ugandan Money Investment Platform</p>
        <p className="bonus-text">Welcome to Quick Cash an online investment platform! earn daily and boost your life.</p>
      </div>

      <div className="signup-form-card">
        <form className="signup-form" onSubmit={handleSubmit} autoComplete="off">
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="tel"
            placeholder="e.g., 0750000377"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoComplete="tel"
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          <input
            type="text"
            placeholder="Referral Code (Optional)"
            value={referral}
            onChange={(e) => setReferral(e.target.value)}
            autoComplete="off"
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <div className="signin-link">
          <p>
            Already have an account? <Link to="/signin">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;