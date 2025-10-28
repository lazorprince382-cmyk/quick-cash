import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import "./DepositSummary.css";

interface DepositSummaryProps {
  amount: string;
  method: string;
  name: string;
  phone: string;
  onBack: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const DepositSummary: React.FC<DepositSummaryProps> = ({
  amount,
  method,
  name,
  phone,
  onBack,
  onConfirm,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const paymentDetails: Record<string, { accountName: string; accountNumber: string }> = {
    "MTN Mobile Money": {
      accountName: "Beatrice",
      accountNumber: "0783919923",
    },
    "Airtel Money": {
      accountName: "Masaba Aziz",
      accountNumber: "0750000377",
    },
    "Bank Transfer": {
      accountName: "Quick Cash Holdings",
      accountNumber: "100200300400",
    },
  };

  const { accountName, accountNumber } = paymentDetails[method] ?? {
    accountName: "Unknown",
    accountNumber: "",
  };

  const handleCopyAccountNumber = () => {
    navigator.clipboard.writeText(accountNumber)
      .then(() => {
        alert("Account number copied to clipboard!");
      })
      .catch(() => {
        alert("Failed to copy account number. Please copy it manually.");
      });
  };

  return (
    <div className="summary-container">
      <h2>Payment Information</h2>

      <div className="summary-section">
        <h3>Deposit Summary</h3>
        <p><strong>Amount:</strong> UGX {parseInt(amount).toLocaleString()}</p>
        <p><strong>Method:</strong> {method}</p>
        <p><strong>Your Name:</strong> {name}</p>
        <p><strong>Your Phone:</strong> {phone}</p>
      </div>

      <div className="payment-section">
        <h3>{method} Payment Details</h3>
        <p><strong>Account Name:</strong> {accountName}</p>
        <div className="account-number-row">
          <strong>Account Number:</strong> 
          <span className="account-number">{accountNumber}</span>
          <button
            className="copy-btn"
            onClick={handleCopyAccountNumber}
          >
            📋 Copy
          </button>
        </div>
      </div>

      <div className="steps-section">
        <h4>📝 Next Steps</h4>
        <ol>
          <li>Send <strong>UGX {parseInt(amount).toLocaleString()}</strong> to the account above</li>
          <li>Keep your transaction receipt for reference</li>
          <li>Click "Confirm Deposit" below after sending the payment</li>
          <li>Wait for admin approval (usually 1-2 minutes)</li>
          <li>Your balance will be updated automatically once approved</li>
        </ol>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* Footer Buttons */}
      <div className="summary-footer">
        <button 
          className="btn confirm-btn" 
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "🔄 Submitting..." : "✅ Confirm Deposit"}
        </button>
        
        <button 
          className="btn cancel-btn" 
          onClick={onCancel}
          disabled={loading}
        >
          ❌ Cancel
        </button>
        
        <button 
          className="btn back-btn" 
          onClick={onBack}
          disabled={loading}
        >
          ← Back to Form
        </button>
      </div>

      <div className="security-note">
        <p>🔒 <strong>Security Note:</strong> Only confirm after you have made the payment. 
        Your deposit will be visible to admin for approval immediately after confirmation.</p>
      </div>
    </div>
  );
};

export default DepositSummary;