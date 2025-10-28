// Admin.tsx - Update the withdrawals section
import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import "./Admin.css";

const Admin: React.FC = () => {
  const pendingDeposits = useQuery(api.admin.getPendingDeposits) || [];
  const pendingWithdrawals = useQuery(api.admin.getPendingWithdrawals) || [];
  const allUsers = useQuery(api.admin.getAllUsers) || [];
  const allWithdrawals = useQuery(api.withdraws.getAllWithdrawals) || [];

  const approveDeposit = useMutation(api.admin.approveDeposit);
  const rejectDeposit = useMutation(api.admin.rejectDeposit);
  const approveWithdrawal = useMutation(api.admin.approveWithdrawal);
  const rejectWithdrawal = useMutation(api.admin.rejectWithdrawal);

  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"deposits" | "withdrawals" | "users" | "withdrawalHistory">("deposits");
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle deposit approval
  const handleApproveDeposit = async (depositId: string) => {
    try {
      setLoading(depositId);
      setError(null);
      
      const adminUser = JSON.parse(localStorage.getItem("qc_user") || "{}");
      
      const result = await approveDeposit({ 
        depositId: depositId as any, 
        adminId: adminUser.id 
      });

      if (result.success) {
        setMessage("Deposit approved successfully!");
        showNotification('success', "Deposit approved! User balance updated.");
        
        // Refresh data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to approve deposit");
      showNotification('error', e?.message || "Failed to approve deposit");
    } finally {
      setLoading(null);
    }
  };

  // Handle deposit rejection
  const handleRejectDeposit = async (depositId: string) => {
    try {
      setLoading(depositId);
      setError(null);
      
      const adminUser = JSON.parse(localStorage.getItem("qc_user") || "{}");
      
      const result = await rejectDeposit({ 
        depositId: depositId as any, 
        adminId: adminUser.id 
      });

      if (result.success) {
        setMessage("Deposit rejected successfully!");
        showNotification('success', "Deposit rejected.");
        
        // Refresh data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to reject deposit");
      showNotification('error', e?.message || "Failed to reject deposit");
    } finally {
      setLoading(null);
    }
  };

  // Handle withdrawal actions
  const handleWithdrawalAction = async (mut: any, withdrawalId: string, action: string) => {
    try {
      setLoading(withdrawalId);
      setError(null);
      
      const adminUser = JSON.parse(localStorage.getItem("qc_user") || "{}");
      
      const result = await mut({ 
        withdrawalId: withdrawalId as any, 
        adminId: adminUser.id 
      });

      if (result.success) {
        setMessage(`Withdrawal ${action} successfully!`);
        showNotification('success', `Withdrawal ${action}!`);
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (e: any) {
      setError(e?.message || `Failed to ${action} withdrawal`);
      showNotification('error', e?.message || `Failed to ${action} withdrawal`);
    } finally {
      setLoading(null);
    }
  };

  // Get admin user from localStorage
  const stored = typeof window !== "undefined" ? localStorage.getItem("qc_user") : null;
  const adminUser = stored ? JSON.parse(stored) : null;

  if (!adminUser || adminUser.role !== "admin") {
    return (
      <div className="admin-container">
        <div className="admin-error" style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '100px auto'
        }}>
          <h2 style={{color: '#dc3545', marginBottom: '20px'}}>Access Denied</h2>
          <p style={{marginBottom: '20px', color: '#6c757d'}}>
            You must be an administrator to access this page.
          </p>
          <button
            onClick={() => {
              localStorage.setItem(
                "qc_user",
                JSON.stringify({ 
                  id: "local-admin-id", 
                  role: "admin", 
                  name: "Local Admin",
                  email: "admin@quickcash.com"
                })
              );
              window.location.reload();
            }}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Set test admin & reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p className="admin-subtitle">Manage deposits, withdrawals, and users</p>
        <p style={{marginTop: '10px', opacity: 0.8}}>Welcome, {adminUser.name}</p>
      </div>

      {error && <div className="admin-error-message">{error}</div>}
      {message && <div className="admin-success-message">{message}</div>}

      <div className="admin-tabs">
        <button className={`tab-button ${activeTab === "deposits" ? "active" : ""}`} onClick={() => setActiveTab("deposits")}>
          Pending Deposits ({pendingDeposits.length})
        </button>
        <button className={`tab-button ${activeTab === "withdrawals" ? "active" : ""}`} onClick={() => setActiveTab("withdrawals")}>
          Pending Withdrawals ({pendingWithdrawals.length})
        </button>
        <button className={`tab-button ${activeTab === "withdrawalHistory" ? "active" : ""}`} onClick={() => setActiveTab("withdrawalHistory")}>
          All Withdrawals ({allWithdrawals.length})
        </button>
        <button className={`tab-button ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
          Users ({allUsers.length})
        </button>
      </div>

      {activeTab === "deposits" && (
        <div className="admin-section">
          <h2>Pending Deposit Requests</h2>
          {pendingDeposits.length === 0 ? (
            <p className="no-data">No pending deposits</p>
          ) : (
            <div className="requests-grid">
              {pendingDeposits.map((deposit: any) => (
                <div key={deposit._id} className="request-card">
                  <div className="request-header">
                    <h3>UGX {Number(deposit.amount || 0).toLocaleString()}</h3>
                    <span className="status pending">Pending</span>
                  </div>
                  <div className="request-details">
                    <p><strong>User:</strong> {deposit.name}</p>
                    <p><strong>Phone:</strong> {deposit.phone}</p>
                    <p><strong>Method:</strong> {deposit.method}</p>
                    <p><strong>Date:</strong> {new Date(deposit._creationTime || Date.now()).toLocaleString()}</p>
                    <p><strong>User ID:</strong> {deposit.userId}</p>
                  </div>
                  <div className="request-actions">
                    <button 
                      className="btn approve" 
                      onClick={() => handleApproveDeposit(deposit._id)}
                      disabled={loading === deposit._id}
                    >
                      {loading === deposit._id ? "Processing..." : "Approve"}
                    </button>
                    <button 
                      className="btn reject" 
                      onClick={() => handleRejectDeposit(deposit._id)}
                      disabled={loading === deposit._id}
                    >
                      {loading === deposit._id ? "Processing..." : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "withdrawals" && (
        <div className="admin-section">
          <h2>Pending Withdrawal Requests</h2>
          {pendingWithdrawals.length === 0 ? (
            <p className="no-data">No pending withdrawals</p>
          ) : (
            <div className="requests-grid">
              {pendingWithdrawals.map((withdrawal: any) => (
                <div key={withdrawal._id} className="request-card">
                  <div className="request-header">
                    <h3>UGX {Number(withdrawal.amountRequested || 0).toLocaleString()}</h3>
                    <span className="status pending">Pending</span>
                  </div>
                  <div className="request-details">
                    <p><strong>Net Amount:</strong> UGX {Number(withdrawal.netAmount || 0).toLocaleString()}</p>
                    <p><strong>Fee:</strong> UGX {Number(withdrawal.fee || 0).toLocaleString()}</p>
                    <p><strong>Account:</strong> {withdrawal.accountNumber} ({withdrawal.accountName})</p>
                    <p><strong>Method:</strong> {withdrawal.method}</p>
                    <p><strong>User ID:</strong> {withdrawal.userId}</p>
                    <p><strong>Date:</strong> {new Date(withdrawal._creationTime || Date.now()).toLocaleString()}</p>
                  </div>
                  <div className="request-actions">
                    <button 
                      className="btn approve" 
                      onClick={() => handleWithdrawalAction(approveWithdrawal, withdrawal._id, "approved")}
                      disabled={loading === withdrawal._id}
                    >
                      {loading === withdrawal._id ? "Processing..." : "Approve"}
                    </button>
                    <button 
                      className="btn reject" 
                      onClick={() => handleWithdrawalAction(rejectWithdrawal, withdrawal._id, "rejected")}
                      disabled={loading === withdrawal._id}
                    >
                      {loading === withdrawal._id ? "Processing..." : "Reject"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "withdrawalHistory" && (
        <div className="admin-section">
          <h2>All Withdrawals</h2>
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Fee</th>
                  <th>Net Amount</th>
                  <th>Method</th>
                  <th>Account</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {allWithdrawals.map((withdrawal: any) => (
                  <tr key={withdrawal._id}>
                    <td>{withdrawal.userName}</td>
                    <td>UGX {Number(withdrawal.amountRequested || 0).toLocaleString()}</td>
                    <td>UGX {Number(withdrawal.fee || 0).toLocaleString()}</td>
                    <td>UGX {Number(withdrawal.netAmount || 0).toLocaleString()}</td>
                    <td>{withdrawal.method}</td>
                    <td>{withdrawal.accountNumber}</td>
                    <td>
                      <span className={`status-badge status-${withdrawal.status}`}>
                        {withdrawal.statusText || withdrawal.status}
                      </span>
                    </td>
                    <td>{new Date(withdrawal.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="admin-section">
          <h2>All Users</h2>
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Balance</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Deposits Made</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user: any) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>UGX {Number(user.balance || 0).toLocaleString()}</td>
                    <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                    <td>{new Date(user._creationTime || Date.now()).toLocaleDateString()}</td>
                    <td>{user.hasMadeDeposit ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <footer className="admin-footer">
        <div className="footer-logo">QC Admin</div>
        <p>© 2025 Quick Cash - Secure Investment Platform</p>
      </footer>
    </div>
  );
};

export default Admin;