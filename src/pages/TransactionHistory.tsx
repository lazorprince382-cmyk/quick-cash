import React from "react";
import "./TransactionHistory.css";

const TransactionHistory: React.FC = () => {
  const transactions = [
    {
      title: "Welcome bonus for new user",
      date: "10/12/2023, 7:45:15 PM",
      amount: "+UGX 500",
      status: "Completed",
    },
    // Add more transactions here as needed
  ];

  return (
    <div className="transaction-history-container">
      <h1>Transaction History</h1>
      <div className="transaction-list">
        {transactions.map((txn, index) => (
          <div key={index} className="transaction-card">
            <h3>{txn.title}</h3>
            <p><strong>Date:</strong> {txn.date}</p>
            <p><strong>Amount:</strong> {txn.amount}</p>
            <p className={`status ${txn.status.toLowerCase()}`}>{txn.status}</p>
          </div>
        ))}
      </div>

      <footer className="history-footer">
        <div className="footer-logo">QC</div>
        <p>© 2025–2030 Quick Cash. Secure Ugandan Investment Platform.</p>
        <p className="footer-note">Track your financial activity with confidence.</p>
      </footer>
    </div>
  );
};

export default TransactionHistory;