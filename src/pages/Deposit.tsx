import React, { useState } from "react";
import "./Deposit.css";
import DepositSummary from "./DepositSummary";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";

const Deposit: React.FC = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("MTN Mobile Money");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Get current user from localStorage
  const stored = typeof window !== "undefined" ? localStorage.getItem("qc_user") : null;
  const user = stored ? JSON.parse(stored) : null;

  // Convex mutations and queries
  const submitDeposit = useMutation(api.deposits.createDeposit);
  const userDeposits = useQuery(api.deposits.getUserDeposits, 
    user?.id ? { userId: user.id } : "skip"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !phone || !name) {
      setError("Please fill in all required fields.");
      return;
    }

    const depositAmount = parseInt(amount);
    if (isNaN(depositAmount) || depositAmount < 5000) {
      setError("Minimum deposit is UGX 5,000.");
      return;
    }

    if (!phone.startsWith("07") || phone.length !== 10) {
      setError("Enter a valid Ugandan phone number.");
      return;
    }

    if (!user?.id) {
      setError("You must be signed in to make a deposit.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      setLoading(false);
      setShowSummary(true);
    } catch (err) {
      setLoading(false);
      setError("Failed to process deposit request. Please try again.");
      console.error(err);
    }
  };

  const handleConfirmDeposit = async () => {
    setLoading(true);
    
    try {
      const depositAmount = parseInt(amount);
      
      // Submit to Convex
      const result = await submitDeposit({
        userId: user.id,
        name,
        phone,
        amount: depositAmount,
        method
      });

      if (result?.success) {
        setMessage("Deposit submitted for admin approval!");
        setShowSummary(false);
        
        // Clear form
        setAmount("");
        setPhone("");
        setName("");
        
        alert("Deposit confirmed! Your transaction is being processed and awaiting admin approval.");
      }
    } catch (err: any) {
      setError("Failed to submit deposit. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeposit = () => {
    setShowSummary(false);
  };

  // Redirect if not signed in
  if (!user?.id) {
    return (
      <div className="deposit-container">
        <div className="error-message">
          Please sign in to access the deposit page.
          <button 
            onClick={() => navigate("/signin")}
            className="btn green"
            style={{marginTop: '10px'}}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="deposit-container">
      <div className="deposit-header">
        <h1>Deposit Funds</h1>
        <p className="tagline">Add money to your account to start investing</p>
        <div className="balance-box">Current Balance: UGX {user?.balance?.toLocaleString() || "0"}</div>
      </div>

      {showSummary ? (
        <DepositSummary
          amount={amount}
          method={method}
          name={name}
          phone={phone}
          onBack={() => setShowSummary(false)}
          onConfirm={handleConfirmDeposit}
          onCancel={handleCancelDeposit}
        />
      ) : (
        <>
          <div className="instructions-card">
            <h3>Deposit Instructions</h3>
            <ul>
              <li>Fill the form below with your deposit details.</li>
              <li>Click "Submit Deposit Request" to get payment information.</li>
              <li>Make the payment using the provided information.</li>
              <li>Your balance will appear (normal processing time: 1–2 minutes).</li>
              <li>Your balance will be updated once approved.</li>
            </ul>
            <div className="limits-box">
              <p><strong>Minimum deposit:</strong> UGX 5,000</p>
              <p><strong>Maximum per transaction:</strong> UGX 1,000,000</p>
              <p><strong>Maximum per day:</strong> UGX 5,000,000</p>
              <p><strong>Starting balance:</strong> UGX 2,000 for all new users</p>
            </div>
          </div>

          <form className="deposit-form" onSubmit={handleSubmit}>
            <label>
              Deposit Amount (UGX) *
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (min 5,000)"
                min="5000"
                max="1000000"
                required
              />
            </label>

            <label>
              Payment Method
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option>MTN Mobile Money</option>
                <option>Airtel Money</option>
                <option>Bank Transfer</option>
              </select>
            </label>

            <label>
              Your Phone Number *
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0783919923"
                pattern="07[0-9]{8}"
                required
              />
            </label>

            <label>
              Your Name *
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </label>

            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}

            <button type="submit" className="btn green" disabled={loading}>
              {loading ? "Processing..." : "Submit Deposit Request"}
            </button>
          </form>
        </>
      )}

      {/* Dynamic Recent Deposits Section */}
      <div className="deposit-list">
        <h3>Your Recent Deposits</h3>
        
        {userDeposits === undefined ? (
          <p className="no-deposits">Loading your deposits...</p>
        ) : userDeposits && userDeposits.length > 0 ? (
          userDeposits
            .slice()
            .sort((a: any, b: any) => b.createdAt - a.createdAt)
            .slice(0, 10)
            .map((deposit: any) => (
              <div key={deposit._id} className="deposit-item">
                <div><strong>{deposit.name}</strong> ({deposit.phone})</div>
                <div>Amount: UGX {deposit.amount?.toLocaleString()}</div>
                <div>Method: {deposit.method}</div>
                <div>Status: <span className={`status-${deposit.status}`}>{deposit.status}</span></div>
                <div className="deposit-date">
                  {new Date(deposit.createdAt).toLocaleString()}
                </div>
              </div>
            ))
        ) : (
          <p className="no-deposits">No deposits yet. Make your first deposit above!</p>
        )}
      </div>

      <footer className="deposit-footer">
        <div className="footer-logo">QC</div>
        <p>© 2025–2030 Quick Cash. Secure Ugandan Investment Platform.</p>
        <p className="footer-note">
          Invest confidently and earn daily returns from capital markets.
        </p>
      </footer>
    </div>
  );
};

export default Deposit;