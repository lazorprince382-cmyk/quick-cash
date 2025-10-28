import React, { useEffect } from "react";
import "./Dashboard.css";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface User {
  id: Id<"users">;
  name: string;
  email: string;
  balance: number;
  totalPurchased: number;
  totalEarnings: number;
  referralEarnings: number;
  referralCode: string;
}

interface Investment {
  _id: Id<"investments">;
  userId: Id<"users">;
  amount: number;
  status: "active" | "completed" | "cancelled";
  earnedSoFar?: number;
  expectedReturn: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Get user from localStorage (only for auth)
  const stored = typeof window !== "undefined" ? localStorage.getItem("qc_user") : null;
  const user: User | null = stored ? JSON.parse(stored) : null;

  // Get ALL data from Convex - this is the key fix!
  const investments = useQuery(api.investments.getUserInvestments, 
    user?.id ? { userId: user.id } : "skip"
  ) || [];

  const activeInvestments = useQuery(api.investments.getActiveInvestments,
    user?.id ? { userId: user.id } : "skip"
  ) || [];

  // Calculate totals from Convex database (not localStorage)
  const calculatedTotalPurchased = investments
    .filter((inv: Investment) => inv.status === "active" || inv.status === "completed")
    .reduce((sum: number, inv: Investment) => sum + (inv.amount || 0), 0);

  const calculatedTotalEarnings = investments
    .filter((inv: Investment) => inv.status === "completed")
    .reduce((sum: number, inv: Investment) => sum + ((inv.earnedSoFar || 0) + (inv.expectedReturn - inv.amount)), 0);

  // Use user data from localStorage for basic info, but totals from Convex
  const displayUser = {
    name: user?.name || "User",
    balance: user?.balance || 0, // This gets updated when user data changes
    totalPurchased: calculatedTotalPurchased, // Always from Convex
    totalEarnings: calculatedTotalEarnings, // Always from Convex
    referralEarnings: user?.referralEarnings || 0,
    referralCode: user?.referralCode || "REF" + Math.random().toString(36).substr(2, 8).toUpperCase()
  };

  // Redirect if not signed in
  useEffect(() => {
    if (!user?.id) {
      navigate("/signin");
    }
  }, [user, navigate]);

  const logout = () => {
    localStorage.removeItem("qc_user");
    localStorage.removeItem("qc_investments"); // Remove this if you were using it
    navigate("/");
  };

  const handleShareReferral = () => {
    const referralLink = `${window.location.origin}/signup?ref=${displayUser.referralCode}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(referralLink);
      alert("Referral link copied to clipboard!");
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = referralLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Referral link copied to clipboard!");
    }
  };

  if (!user?.id) {
    return (
      <div className="dashboard-container">
        <div className="loading error">
          Please sign in to access the dashboard.
          <button 
            onClick={() => navigate("/signin")}
            className="action-btn blue"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="brand-section">
            <div className="logo-box">QC</div>
            <div className="brand-text">
              <h1>Quick Cash</h1>
              <p className="tagline">Ugandan Money Investment Platform</p>
            </div>
          </div>
          <div className="user-section">
            <span className="welcome-text">
              Welcome, <span>{displayUser.name}</span>
            </span>
            <button
              onClick={logout}
              className="logout-btn"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Balance</h3>
            <p>UGX {displayUser.balance.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>Total Purchased</h3>
            <p>UGX {displayUser.totalPurchased.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>Total Earnings</h3>
            <p>UGX {displayUser.totalEarnings.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <h3>Active Investments</h3>
            <p>{activeInvestments.length}</p>
            <small>Real-time from database</small>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-section">
          <div className="action-buttons">
            <Link to="/invest" className="action-btn blue">
              <span className="icon">💵</span>
              <span>Invest</span>
            </Link>
            <Link to="/deposit" className="action-btn green">
              <span className="icon">💳</span>
              <span>Deposit</span>
            </Link>
            <Link to="/withdraw" className="action-btn pink">
              <span className="icon">🏦</span>
              <span>Withdraw</span>
            </Link>
          </div>
        </div>

        {/* Additional Content */}
        <div className="content-section">
          <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="welcome-banner">
              <h3>Welcome back, {displayUser.name}! 👋</h3>
              <p>Your investment data is securely stored and always available.</p>
              {activeInvestments.length > 0 && (
                <div className="payout-info">
                  <strong>✅ Your investments are safely stored in our database</strong>
                </div>
              )}
            </div>

            {/* Referral Section */}
            <div className="referral-section">
              <h4>📢 Invite Friends & Earn 5%</h4>
              <p>
                Share your referral code and earn 5% commission on every friend's first deposit!
                <br />
                <strong>New users get UGX 1,500 welcome bonus!</strong>
              </p>
              <div className="referral-box">
                <div className="referral-code">
                  {displayUser.referralCode}
                </div>
                <button
                  onClick={handleShareReferral}
                  className="share-btn"
                >
                  Share Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="footer-logo">QC</div>
          <p>© 2025-2030 Quick Cash. Secure Ugandan Money Investment Platform.</p>
          <p className="footer-note">
            All your investment data is securely stored and always accessible.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;