import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import "./Withdraw.css";

const Withdraw: React.FC = () => {
  const stored = typeof window !== "undefined" ? localStorage.getItem("qc_user") : null;
  const user = stored ? JSON.parse(stored) : null;
  const userId = user?.id;
  const balance = user?.balance ?? 0;

  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState("MTN Mobile Money");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Use Convex to get withdrawals
  const withdrawals = useQuery(api.withdraws.getUserWithdrawals, 
    userId ? { userId } : "skip"
  ) || [];

  const createWithdrawal = useMutation(api.withdraws.createWithdrawal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const amt = Number(amount);
    if (!userId) return setError("Please sign in first");
    if (!amt || amt <= 0) return setError("Enter a valid amount");
    if (amt > balance) return setError("Insufficient balance");
    if (amt < 5000) return setError("Minimum withdrawal is UGX 5,000");
    if (!accountNumber) return setError("Provide account number");
    if (!accountName) return setError("Provide account name");

    // Validate phone number for mobile money
    if ((method === "MTN Mobile Money" || method === "Airtel Money") && 
        (!accountNumber.startsWith("07") || accountNumber.length !== 10)) {
      return setError("Enter a valid Ugandan phone number");
    }

    try {
      setLoading(true);
      
      // Call Convex mutation
      const result = await createWithdrawal({
        userId,
        amountRequested: amt,
        method,
        accountNumber,
        accountName,
      });

      if (result.success) {
        setMessage(`Withdrawal requested successfully! Fee: UGX ${result.fee.toLocaleString()}. Net Amount: UGX ${result.netAmount.toLocaleString()}. Waiting for admin approval.`);
        
        // Update local user balance
        const updatedUser = {
          ...user,
          balance: balance - amt
        };
        localStorage.setItem("qc_user", JSON.stringify(updatedUser));
        
        // Clear form
        setAmount("");
        setAccountNumber("");
        setAccountName("");
        
        // Reload to reflect new balance and show updated withdrawals
        setTimeout(() => window.location.reload(), 2000);
      }
      
    } catch (err: any) {
      setError(err?.message ?? "Withdrawal request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="withdraw-container">
        <div className="error">Please sign in to withdraw funds.</div>
      </div>
    );
  }

  return (
    <div className="withdraw-container">
      <div className="withdraw-header">
        <h1>Withdraw Funds</h1>
        <p className="tagline">Withdraw your earnings to your preferred account</p>
        <div className="balance-box">Available Balance: UGX {balance.toLocaleString()}</div>
      </div>

      <div className="instructions-card">
        <h3>Withdrawal Instructions</h3>
        <ul>
          <li>Minimum withdrawal: UGX 5,000</li>
          <li>Withdrawal fee: 15% (minimum UGX 500)</li>
          <li>Processing time: 1-2 business days</li>
          <li>Ensure your account details are correct</li>
          <li>Withdrawals require admin approval for security</li>
        </ul>
      </div>

      <form className="withdraw-form" onSubmit={handleSubmit}>
        <label>
          Withdrawal Amount (UGX) *
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
            placeholder="Enter amount (min 5,000)"
            min="5000"
            max={balance}
          />
        </label>

        <label>
          Payment Method *
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option>MTN Mobile Money</option>
            <option>Airtel Money</option>
            <option>Bank Transfer</option>
          </select>
        </label>

        <label>
          Account Number *
          <input 
            value={accountNumber} 
            onChange={(e) => setAccountNumber(e.target.value)} 
            placeholder={
              method.includes("Money") 
                ? "e.g. 0771234567" 
                : "Bank account number"
            }
          />
        </label>

        <label>
          Account Name *
          <input 
            value={accountName} 
            onChange={(e) => setAccountName(e.target.value)} 
            placeholder="Your full name as registered"
          />
        </label>

        {amount && amount >= 5000 && (
          <div className="fee-calculation">
            <p><strong>Fee (15%):</strong> UGX {Math.max(500, Math.round(Number(amount) * 0.15)).toLocaleString()}</p>
            <p><strong>Net Amount:</strong> UGX {(Number(amount) - Math.max(500, Math.round(Number(amount) * 0.15))).toLocaleString()}</p>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <button 
          type="submit" 
          className="btn green" 
          disabled={loading || !amount || amount < 5000 || amount > balance}
        >
          {loading ? "Processing..." : "Submit Withdrawal Request"}
        </button>
      </form>

      {withdrawals.length > 0 && (
        <div className="withdrawal-history">
          <h3>Recent Withdrawals</h3>
          <div className="withdrawals-list">
            {withdrawals.map((withdrawal: any) => (
              <div key={withdrawal._id} className="withdrawal-card">
                <div className="withdrawal-header">
                  <span className="amount">UGX {withdrawal.amountRequested?.toLocaleString()}</span>
                  <span className={`status status-${withdrawal.status}`}>
                    {withdrawal.statusText || withdrawal.status}
                  </span>
                </div>
                <div className="withdrawal-details">
                  <p><strong>Method:</strong> {withdrawal.method}</p>
                  <p><strong>Account:</strong> {withdrawal.accountNumber} ({withdrawal.accountName})</p>
                  <p><strong>Fee:</strong> UGX {withdrawal.fee?.toLocaleString()}</p>
                  <p><strong>Net Amount:</strong> UGX {withdrawal.netAmount?.toLocaleString()}</p>
                  <p><strong>Date:</strong> {new Date(withdrawal.createdAt).toLocaleString()}</p>
                  <p><strong>Status:</strong> {withdrawal.statusText || withdrawal.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="withdraw-footer">
        <div className="footer-logo">QC</div>
        <p>© 2025–2030 Quick Cash. Secure Ugandan Investment Platform.</p>
        <p className="footer-note">
          Your funds are safe with us. Withdraw with confidence.
        </p>
      </footer>
    </div>
  );
};

export default Withdraw;