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

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  depositedReferrals: number;
  totalCommission: number;
  referralEarnings: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Get user from localStorage (only for auth)
  const stored = typeof window !== "undefined" ? localStorage.getItem("qc_user") : null;
  const user: User | null = stored ? JSON.parse(stored) : null;

  // Get ALL data from Convex
  const investments = useQuery(api.investments.getUserInvestments, 
    user?.id ? { userId: user.id } : "skip"
  ) || [];

  const activeInvestments = useQuery(api.investments.getActiveInvestments,
    user?.id ? { userId: user.id } : "skip"
  ) || [];

  // Get referral data
  const referralStats = useQuery(api.referrals.getReferralStats,
    user?.id ? { userId: user.id } : "skip"
  );

  const referralLink = useQuery(api.referrals.getReferralLink,
    user?.id ? { userId: user.id } : "skip"
  );

  const userReferrals = useQuery(api.referrals.getUserReferrals,
    user?.id ? { userId: user.id } : "skip"
  ) || [];

  // Calculate totals from Convex database
  const calculatedTotalPurchased = investments
    .filter((inv: Investment) => inv.status === "active" || inv.status === "completed")
    .reduce((sum: number, inv: Investment) => sum + (inv.amount || 0), 0);

  const calculatedTotalEarnings = investments
    .filter((inv: Investment) => inv.status === "completed")
    .reduce((sum: number, inv: Investment) => sum + ((inv.earnedSoFar || 0) + (inv.expectedReturn - inv.amount)), 0);

  // Use user data from localStorage for basic info, but totals from Convex
  const displayUser = {
    name: user?.name || "User",
    balance: user?.balance || 0,
    totalPurchased: calculatedTotalPurchased,
    totalEarnings: calculatedTotalEarnings,
    referralEarnings: referralStats?.referralEarnings || user?.referralEarnings || 0,
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
    localStorage.removeItem("qc_investments");
    navigate("/");
  };

  const handleShareReferral = () => {
    const shareLink = referralLink || `${window.location.origin}/signup?ref=${displayUser.referralCode}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareLink);
      alert("Referral link copied to clipboard!");
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareLink;
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
          {/* Referral Stats */}
          {referralStats && (
            <>
              <div className="stat-card">
                <h3>Referral Earnings</h3>
                <p>UGX {referralStats.totalCommission.toLocaleString()}</p>
                <small>Total commission</small>
              </div>
              <div className="stat-card">
                <h3>Referrals</h3>
                <p>{referralStats.totalReferrals} Total</p>
                <small>{referralStats.depositedReferrals} Deposited</small>
              </div>
            </>
          )}
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

            {/* Enhanced Referral Section */}
            <div className="referral-section">
              <h4>📢 Invite Friends & Earn 5% Commission</h4>
              <p>
                Share your referral code and earn <strong>5% commission</strong> on every friend's first deposit!
                <br />
                <strong>You also get UGX 500 bonus when friends sign up with your code!</strong>
              </p>
              
              <div className="referral-box">
                <div className="referral-code">
                  {displayUser.referralCode}
                </div>
                <button
                  onClick={handleShareReferral}
                  className="share-btn"
                >
                  📋 Copy Link
                </button>
              </div>

              {/* Referral Stats */}
              {referralStats && (
                <div className="referral-stats">
                  <div className="referral-stat-item">
                    <span>Total Referrals:</span>
                    <strong>{referralStats.totalReferrals}</strong>
                  </div>
                  <div className="referral-stat-item">
                    <span>Active Referrals:</span>
                    <strong>{referralStats.activeReferrals}</strong>
                  </div>
                  <div className="referral-stat-item">
                    <span>Commission Earned:</span>
                    <strong>UGX {referralStats.totalCommission.toLocaleString()}</strong>
                  </div>
                </div>
              )}

              {/* Referral List */}
              {userReferrals.length > 0 && (
                <div className="referral-list">
                  <h5>Your Referrals:</h5>
                  <div className="referrals-grid">
                    {userReferrals.map((ref) => (
                      <div key={ref._id} className="referral-item">
                        <div className="referral-name">{ref.referredUserName}</div>
                        <div className={`referral-status ${ref.status}`}>
                          {ref.status === 'signed_up' ? '✅ Signed Up' : 
                           ref.status === 'deposited' ? '💰 Deposited' : '✅ Completed'}
                        </div>
                        {ref.commissionEarned && (
                          <div className="referral-commission">
                            UGX {ref.commissionEarned.toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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