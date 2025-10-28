import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import "./Invest.css";

interface Package {
  _id: Id<"packages">;
  _creationTime: number;
  name: string;
  amount: number;
  rate: number;
  durationDays: number;
  isActive: boolean;
  description?: string;
}

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

const Invest: React.FC = () => {
  const navigate = useNavigate();
  
  // Get packages from Convex
  const packages = useQuery(api.packages.getPackages) || [];
  const purchasePackage = useMutation(api.packages.purchasePackage);
  
  // Get user from localStorage (only for current balance)
  const stored = typeof window !== "undefined" ? localStorage.getItem("qc_user") : null;
  const user: User | null = stored ? JSON.parse(stored) : null;
  const userId = user?.id;

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (pkg: Package) => {
    setError(null);
    setMessage(null);
    
    if (!userId) {
      setError("You must be signed in to purchase a package.");
      return;
    }
    
    try {
      setLoadingId(pkg._id);
      
      const result = await purchasePackage({ 
        packageId: pkg._id,
        userId: userId
      });
      
      if (result.success) {
        // Only update balance in localStorage (investment data stays in Convex)
        const updatedUser = {
          ...user,
          balance: result.newBalance,
        };
        
        localStorage.setItem("qc_user", JSON.stringify(updatedUser));
        
        setMessage(`Successfully purchased ${pkg.name}! UGX ${pkg.amount.toLocaleString()} deducted. Your investment is now active.`);
        
        setTimeout(() => {
          setMessage(null);
        }, 5000);
      } else {
        setError("Purchase failed. Please try again.");
      }
      
    } catch (err: any) {
      console.error("Purchase error:", err);
      setError(err.message || "Purchase failed. Please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  // Rest of your Invest.tsx component remains the same...
  // Calculate package details for display
  const calculatePackageDetails = (pkg: Package) => {
    const totalReturn = Math.round(pkg.amount * pkg.rate);
    const profit = totalReturn - pkg.amount;
    const dailyReturn = Math.round(profit / pkg.durationDays);
    const margin = `${((pkg.rate - 1) * 100).toFixed(1)}%`;
    
    return { totalReturn, profit, dailyReturn, margin };
  };

  // Redirect if not signed in
  if (!userId) {
    return (
      <div className="invest-container">
        <div className="error">Please sign in to view investments.</div>
        <button 
          onClick={() => navigate("/signin")}
          className="btn green"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="invest-container">
      <div className="invest-header">
        <h1>Purchase Investment Packages</h1>
        <p className="tagline">Ugandan Money Investment Platform</p>
        <div className="balance-box">
          Available Balance: UGX {user?.balance?.toLocaleString() || "0"}
        </div>
        <p className="intro-message">
          Choose a package and start earning returns after the contract period.
        </p>
      </div>

      <div className="requirements-card">
        <h3>Investment Benefits</h3>
        <ul>
          <li>✅ Your investments are securely stored in our database</li>
          <li>💰 Access your investment history anytime, anywhere</li>
          <li>🔄 Data persists even after logout</li>
          <li>⚡ Real-time updates across all devices</li>
        </ul>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="packages-grid">
        {packages.map((pkg) => {
          const { totalReturn, profit, dailyReturn, margin } = calculatePackageDetails(pkg);
          const canPurchase = user?.balance >= pkg.amount;
          const shortfall = Math.max(0, pkg.amount - (user?.balance || 0));

          return (
            <div key={pkg._id} className="package-card">
              <h3>{pkg.name}</h3>
              <div className="package-details">
                <p><strong>Investment Amount:</strong> UGX {pkg.amount.toLocaleString()}</p>
                <p><strong>Daily Return:</strong> UGX {dailyReturn.toLocaleString()}</p>
                <p><strong>Contract Period:</strong> {pkg.durationDays} Days</p>
                <p><strong>Total Return:</strong> UGX {totalReturn.toLocaleString()}</p>
                <p><strong>Profit:</strong> UGX {profit.toLocaleString()}</p>
                <p><strong>Profit Margin:</strong> {margin}</p>
                {pkg.description && <p className="package-description"><em>{pkg.description}</em></p>}
              </div>

              {canPurchase ? (
                <button
                  className="btn green"
                  onClick={() => handlePurchase(pkg)}
                  disabled={loadingId === pkg._id || !pkg.isActive}
                >
                  {loadingId === pkg._id ? "Processing..." : `Purchase - UGX ${pkg.amount.toLocaleString()}`}
                </button>
              ) : (
                <button className="btn gray" disabled>
                  Need UGX {shortfall.toLocaleString()} more
                </button>
              )}
            </div>
          );
        })}
      </div>

      {packages.length === 0 && (
        <div className="no-packages">
          <h3>No investment packages available</h3>
          <p>Please check back later or contact support.</p>
        </div>
      )}

      <button 
        onClick={() => navigate("/dashboard")}
        className="btn gray"
      >
        ← Back to Dashboard
      </button>

      <footer className="invest-footer">
        <div className="footer-logo">QC</div>
        <p>© 2025–2030 Quick Cash. Secure Ugandan Investment Platform.</p>
        <p className="footer-note">All investments securely stored in database - accessible anytime.</p>
      </footer>
    </div>
  );
};

export default Invest;